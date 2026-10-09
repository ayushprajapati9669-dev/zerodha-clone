import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePortfolioRiskScore,
  calculateSectorConcentration,
  calculateRiskRewardMetrics,
  evaluatePreTradeRisk,
  getISTDateString,
} from "../helpers/riskCalculationHelper.js";

describe("Smart Risk Management System & Trade Guard Test Suite", () => {
  // Test Case 1: Empty portfolio & missing-price handling
  it("should handle empty portfolio and missing prices safely", () => {
    const result = calculatePortfolioRiskScore({
      holdingsAnalytics: { totalCurrentValue: 0, stockAnalytics: [] },
      dailyLossData: { currentDailyLoss: 0 },
      riskSettings: { maxDailyLoss: 10000 },
      stalePriceCount: 2,
    });

    assert.equal(result.score, 0);
    assert.equal(result.riskCategory, "Low");
    assert.equal(result.insufficientData, false);
    assert.ok(Array.isArray(result.factors));
  });

  // Test Case 2: Correct stock concentration calculations
  it("should calculate stock concentration and sector breakdown accurately", () => {
    const stockAnalytics = [
      { symbol: "RELIANCE", currentValue: 60000, allocationPercent: 60 },
      { symbol: "TCS", currentValue: 40000, allocationPercent: 40 },
    ];
    const totalCurrentValue = 100000;

    const sectorRes = calculateSectorConcentration(stockAnalytics, totalCurrentValue);
    assert.equal(sectorRes.hasReliableData, true);
    assert.equal(sectorRes.sectorBreakdown.length, 2);

    const scoreRes = calculatePortfolioRiskScore({
      holdingsAnalytics: { totalCurrentValue, stockAnalytics },
      dailyLossData: { currentDailyLoss: 0 },
      riskSettings: { maxDailyLoss: 10000 },
    });

    // Score should include concentration points for top holding > 50%
    assert.ok(scoreRes.score > 25);
    assert.ok(["Moderate", "High", "Critical"].includes(scoreRes.riskCategory));
  });

  // Test Case 3: Correct long-position stop-loss and target calculations
  it("should calculate potential loss, profit, and risk-to-reward ratio for long positions", () => {
    const result = calculateRiskRewardMetrics({
      entryPrice: 100,
      quantity: 10,
      stopLossPrice: 90,
      targetPrice: 130,
      type: "buy",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.potentialLoss, 100); // (100 - 90) * 10
    assert.equal(result.potentialProfit, 300); // (130 - 100) * 10
    assert.equal(result.riskRewardRatio, 3); // 300 / 100
  });

  // Test Case 4: Correct short-position stop-loss and target calculations
  it("should calculate potential loss, profit, and risk-to-reward ratio for short positions", () => {
    const result = calculateRiskRewardMetrics({
      entryPrice: 200,
      quantity: 5,
      stopLossPrice: 220,
      targetPrice: 150,
      type: "sell",
    });

    assert.equal(result.isValid, true);
    assert.equal(result.potentialLoss, 100); // (220 - 200) * 5
    assert.equal(result.potentialProfit, 250); // (200 - 150) * 5
    assert.equal(result.riskRewardRatio, 2.5); // 250 / 100
  });

  // Test Case 5: Invalid quantity, entry price, stop-loss, and target inputs
  it("should reject invalid quantity or entry price inputs", () => {
    const result1 = calculateRiskRewardMetrics({
      entryPrice: -10,
      quantity: 5,
      stopLossPrice: 90,
      type: "buy",
    });

    assert.equal(result1.isValid, false);
    assert.ok(result1.error.includes("positive numbers"));

    const result2 = calculateRiskRewardMetrics({
      entryPrice: 100,
      quantity: 0,
      type: "buy",
    });

    assert.equal(result2.isValid, false);
  });

  // Test Case 6: Risk warning versus strict-mode behavior
  it("should differentiate warning mode and strict mode behavior for violating orders", () => {
    const proposedOrder = {
      symbol: "RELIANCE",
      type: "buy",
      quantity: 100,
      orderType: "Limit",
      price: 1000, // Trade value = 1,00,000
    };

    const riskSettingsWarning = {
      enforcementMode: "warning",
      maxPositionSize: 50000, // 100k > 50k violation
      maxSingleStockAllocationPercent: 30,
      maxDailyLoss: 10000,
    };

    const warningEval = evaluatePreTradeRisk({
      order: proposedOrder,
      userFunds: { availableBalance: 200000 },
      holdingsAnalytics: { totalCurrentValue: 0, stockAnalytics: [] },
      riskSettings: riskSettingsWarning,
      dailyLossData: { currentDailyLoss: 0 },
    });

    assert.equal(warningEval.allowed, true); // Warning mode allows with violations logged
    assert.ok(warningEval.violations.length > 0);

    const riskSettingsStrict = { ...riskSettingsWarning, enforcementMode: "strict" };

    const strictEval = evaluatePreTradeRisk({
      order: proposedOrder,
      userFunds: { availableBalance: 200000 },
      holdingsAnalytics: { totalCurrentValue: 0, stockAnalytics: [] },
      riskSettings: riskSettingsStrict,
      dailyLossData: { currentDailyLoss: 0 },
    });

    assert.equal(strictEval.allowed, false); // Strict mode rejects order
    assert.ok(strictEval.violations.length > 0);
  });

  // Test Case 7: Daily loss limit enforcement
  it("should enforce daily loss limit when breached in strict mode", () => {
    const proposedOrder = {
      symbol: "TCS",
      type: "buy",
      quantity: 1,
      orderType: "Market",
      price: 3000,
    };

    const strictRiskSettings = {
      enforcementMode: "strict",
      maxPositionSize: 50000,
      maxSingleStockAllocationPercent: 50,
      maxDailyLoss: 5000,
      enableDailyLossGuard: true,
    };

    const evalRes = evaluatePreTradeRisk({
      order: proposedOrder,
      userFunds: { availableBalance: 100000 },
      holdingsAnalytics: { totalCurrentValue: 10000, stockAnalytics: [] },
      riskSettings: strictRiskSettings,
      dailyLossData: { currentDailyLoss: 6000 }, // 6000 > 5000 breached!
    });

    assert.equal(evalRes.allowed, false);
    assert.ok(evalRes.violations.some((v) => v.includes("Daily loss limit breached")));
  });

  // Test Case 8: Market and Limit Order compatibility
  it("should support both Market and Limit orders and add appropriate price disclaimers for Market orders", () => {
    const marketOrderEval = evaluatePreTradeRisk({
      order: { symbol: "INFY", type: "buy", quantity: 5, orderType: "Market", price: 1500 },
      userFunds: { availableBalance: 50000 },
      holdingsAnalytics: { totalCurrentValue: 0, stockAnalytics: [] },
      riskSettings: { enforcementMode: "warning", maxPositionSize: 50000 },
      dailyLossData: { currentDailyLoss: 0 },
    });

    assert.ok(marketOrderEval.explanations.some((e) => e.includes("Market Order: Price-based calculations are estimates")));

    const limitOrderEval = evaluatePreTradeRisk({
      order: { symbol: "INFY", type: "buy", quantity: 5, orderType: "Limit", price: 1500 },
      userFunds: { availableBalance: 50000 },
      holdingsAnalytics: { totalCurrentValue: 0, stockAnalytics: [] },
      riskSettings: { enforcementMode: "warning", maxPositionSize: 50000 },
      dailyLossData: { currentDailyLoss: 0 },
    });

    assert.equal(limitOrderEval.estimatedTradeValue, 7500);
  });

  // Test Case 9: IST Date formatting check
  it("should correctly format current date in IST timezone", () => {
    const istDate = getISTDateString();
    assert.match(istDate, /^\d{4}-\d{2}-\d{2}$/);
  });
});
