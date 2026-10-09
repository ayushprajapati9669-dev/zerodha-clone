/**
 * Trading Journal + Strategy Backtesting Test Suite
 * Uses Node.js native test runner (node --test)
 *
 * Covers:
 *  1. indicatorHelper  – SMA calculation correctness
 *  2. backtestMetricsHelper – performance metrics computation
 *  3. smaCrossover strategy – signal generation logic
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { calculateSMA } from "../helpers/indicatorHelper.js";
import { calculateBacktestMetrics } from "../helpers/backtestMetricsHelper.js";
import {
  validateSmaCrossoverParams,
  generateSmaCrossoverSignals,
} from "../strategies/smaCrossover.js";

// ─────────────────────────────────────────
// Helper: build a simple synthetic candle array for testing ONLY strategy logic.
// No prices are used in a live or submitted order flow.
// ─────────────────────────────────────────
function makeSyntheticCandles(prices) {
  return prices.map((p, i) => ({
    time: `2024-01-${String(i + 1).padStart(2, "0")}T09:15:00`,
    open: p,
    high: p,
    low: p,
    close: p,
    volume: 1000,
  }));
}

// ──────────────────────────────────────────────────────────────────
// 1.  SMA Calculation Tests
// ──────────────────────────────────────────────────────────────────
describe("indicatorHelper – calculateSMA", () => {
  it("should return empty array for empty input", () => {
    assert.deepEqual(calculateSMA([], 5), []);
  });

  it("should return array of nulls when data length is less than period", () => {
    const result = calculateSMA([100, 110, 120], 5);
    assert.equal(result.length, 3);
    assert.ok(result.every((v) => v === null));
  });

  it("should return nulls up to period-1 then start producing values", () => {
    const prices = [10, 20, 30, 40, 50]; // period = 3
    const result = calculateSMA(prices, 3);
    assert.equal(result.length, 5);
    assert.equal(result[0], null);
    assert.equal(result[1], null);
    assert.equal(result[2], 20); // (10+20+30)/3
    assert.equal(result[3], 30); // (20+30+40)/3
    assert.equal(result[4], 40); // (30+40+50)/3
  });

  it("should calculate a 5-period SMA correctly", () => {
    const prices = [100, 102, 104, 106, 108, 110]; // period = 5
    const result = calculateSMA(prices, 5);
    // SMA at index 4: (100+102+104+106+108)/5 = 104
    assert.equal(result[4], 104);
    // SMA at index 5: (102+104+106+108+110)/5 = 106
    assert.equal(result[5], 106);
  });

  it("should handle candle objects (.close property)", () => {
    const candles = makeSyntheticCandles([10, 20, 30]);
    const result = calculateSMA(candles, 3);
    assert.equal(result[2], 20); // (10+20+30)/3
  });

  it("should handle period = 1 (identity SMA)", () => {
    const prices = [5, 10, 15];
    const result = calculateSMA(prices, 1);
    assert.equal(result[0], 5);
    assert.equal(result[1], 10);
    assert.equal(result[2], 15);
  });

  it("should return empty array for invalid period (0 or negative)", () => {
    assert.deepEqual(calculateSMA([100, 200], 0), []);
    assert.deepEqual(calculateSMA([100, 200], -5), []);
  });
});

// ──────────────────────────────────────────────────────────────────
// 2.  Backtest Metrics Tests
// ──────────────────────────────────────────────────────────────────
describe("backtestMetricsHelper – calculateBacktestMetrics", () => {
  it("should return zeroed metrics when there are no trades", () => {
    const result = calculateBacktestMetrics({
      initialCapital: 100000,
      trades: [],
      equityCurve: [],
    });

    assert.equal(result.totalTrades, 0);
    assert.equal(result.netPnL, 0);
    assert.equal(result.finalEquity, 100000);
    assert.equal(result.returnPercent, 0);
    assert.equal(result.winRate, 0);
    assert.equal(result.profitFactor, "N/A");
    assert.equal(result.maxDrawdownPercent, 0);
  });

  it("should calculate correct net P&L, win rate, and final equity for mixed trades", () => {
    const trades = [
      { netPnL: 2000, costs: 40, returnPercent: 2 },
      { netPnL: -500, costs: 40, returnPercent: -0.5 },
      { netPnL: 1000, costs: 40, returnPercent: 1 },
    ];
    const result = calculateBacktestMetrics({ initialCapital: 100000, trades, equityCurve: [] });

    assert.equal(result.totalTrades, 3);
    assert.equal(result.winningTrades, 2);
    assert.equal(result.losingTrades, 1);
    assert.equal(result.netPnL, 2500);               // 2000 - 500 + 1000
    assert.equal(result.finalEquity, 102500);
    assert.equal(result.returnPercent, 2.5);          // 2500/100000 * 100
    assert.equal(result.winRate, Number((2 / 3 * 100).toFixed(2)));
    assert.equal(result.totalCosts, 120);
  });

  it("should produce correct profit factor (grossProfit / grossLoss)", () => {
    const trades = [
      { netPnL: 3000, costs: 0, returnPercent: 3 },
      { netPnL: -1000, costs: 0, returnPercent: -1 },
    ];
    const result = calculateBacktestMetrics({ initialCapital: 50000, trades, equityCurve: [] });
    assert.equal(result.profitFactor, 3);             // 3000 / 1000
  });

  it("should return 'Max (No Loss)' as profit factor when no losing trades", () => {
    const trades = [
      { netPnL: 500, costs: 10, returnPercent: 0.5 },
      { netPnL: 200, costs: 10, returnPercent: 0.2 },
    ];
    const result = calculateBacktestMetrics({ initialCapital: 50000, trades, equityCurve: [] });
    assert.equal(result.profitFactor, "Max (No Loss)");
  });

  it("should compute max drawdown from equity curve", () => {
    const equityCurve = [
      { equity: 100000 },
      { equity: 110000 }, // new peak
      { equity: 90000 },  // drawdown = 10000/110000 ≈ 9.09%
      { equity: 95000 },
    ];
    const result = calculateBacktestMetrics({ initialCapital: 100000, trades: [{ netPnL: -5000, costs: 0, returnPercent: -5 }], equityCurve });
    // drawdown peak = 110000, trough = 90000 → (20000/110000)*100 ≈ 18.18%
    assert.ok(result.maxDrawdownPercent > 9, `Expected drawdown > 9%, got ${result.maxDrawdownPercent}`);
    assert.ok(result.maxDrawdownPercent < 20, `Expected drawdown < 20%, got ${result.maxDrawdownPercent}`);
  });

  it("should default initialCapital to 100000 if not provided or invalid", () => {
    const result = calculateBacktestMetrics({ initialCapital: 0, trades: [], equityCurve: [] });
    assert.equal(result.initialCapital, 100000);
  });

  it("should handle all-losing trades correctly", () => {
    const trades = [
      { netPnL: -200, costs: 20, returnPercent: -0.2 },
      { netPnL: -300, costs: 20, returnPercent: -0.3 },
    ];
    const result = calculateBacktestMetrics({ initialCapital: 50000, trades, equityCurve: [] });
    assert.equal(result.winningTrades, 0);
    assert.equal(result.losingTrades, 2);
    assert.equal(result.netPnL, -500);
    assert.equal(result.winRate, 0);
    // grossProfit = 0, grossLoss > 0 → code computes 0/grossLoss = 0 (a number)
    assert.equal(result.profitFactor, 0);
  });
});

// ──────────────────────────────────────────────────────────────────
// 3.  SMA Crossover Strategy Tests
// ──────────────────────────────────────────────────────────────────
describe("smaCrossover – validateSmaCrossoverParams", () => {
  it("should accept valid fast/slow periods", () => {
    const result = validateSmaCrossoverParams({ fastPeriod: 9, slowPeriod: 21 });
    assert.equal(result.isValid, true);
    assert.equal(result.fastPeriod, 9);
    assert.equal(result.slowPeriod, 21);
  });

  it("should reject when fast >= slow", () => {
    const r1 = validateSmaCrossoverParams({ fastPeriod: 21, slowPeriod: 9 });
    assert.equal(r1.isValid, false);
    assert.ok(r1.error.includes("smaller"));

    const r2 = validateSmaCrossoverParams({ fastPeriod: 10, slowPeriod: 10 });
    assert.equal(r2.isValid, false);
  });

  it("should treat 0 as falsy and default to valid period (design behaviour of the helper)", () => {
    // fastPeriod: 0 is falsy, so defaults to 9; slowPeriod: -1 produces NaN → rejected
    const r1 = validateSmaCrossoverParams({ fastPeriod: 0, slowPeriod: 10 });
    // 0 is treated as falsy → defaults to 9, which is < 10 → isValid = true
    assert.equal(r1.isValid, true);

    const r2 = validateSmaCrossoverParams({ fastPeriod: 5, slowPeriod: -1 });
    // slowPeriod: -1 fails the isNaN check (it IS a number but <= 0 → rejected)
    assert.equal(r2.isValid, false);
  });

  it("should use defaults (9, 21) when params are missing", () => {
    const result = validateSmaCrossoverParams({});
    assert.equal(result.isValid, true);
    assert.equal(result.fastPeriod, 9);
    assert.equal(result.slowPeriod, 21);
  });
});

describe("smaCrossover – generateSmaCrossoverSignals", () => {
  it("should return empty array for too few candles", () => {
    const candles = makeSyntheticCandles([100, 110, 120]);
    const result = generateSmaCrossoverSignals(candles, { fastPeriod: 3, slowPeriod: 5 });
    assert.deepEqual(result, []);
  });

  it("should return an array of the same length as candles when sufficient data", () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const candles = makeSyntheticCandles(prices);
    const signals = generateSmaCrossoverSignals(candles, { fastPeriod: 3, slowPeriod: 5 });
    assert.equal(signals.length, 30);
  });

  it("should generate a BUY signal when fast SMA crosses above slow SMA", () => {
    // Construct a price series that causes a definitive bullish crossover:
    // First 15 values fall so fast < slow, then sharp rise causes fast to overtake slow.
    const falling = [120, 118, 115, 112, 110, 108, 105, 102, 100, 98, 97, 96, 95, 94, 93];
    const rising  = [100, 110, 120, 130, 140, 150]; // sharp recovery
    const prices  = [...falling, ...rising];
    const candles = makeSyntheticCandles(prices);
    const signals = generateSmaCrossoverSignals(candles, { fastPeriod: 3, slowPeriod: 5 });
    const buySignals = signals.filter((s) => s.signal === "BUY");
    assert.ok(buySignals.length >= 1, "Expected at least one BUY signal from the crossover");
  });

  it("should generate an EXIT signal when fast SMA crosses below slow SMA", () => {
    // Rising trend followed by a sharp drop
    const rising  = [90, 92, 95, 98, 102, 106, 111, 117, 122, 128, 132, 136, 140];
    const falling = [130, 120, 110, 100, 90, 80, 70]; // fast drops faster than slow
    const prices  = [...rising, ...falling];
    const candles = makeSyntheticCandles(prices);
    const signals = generateSmaCrossoverSignals(candles, { fastPeriod: 3, slowPeriod: 5 });
    const exitSignals = signals.filter((s) => s.signal === "EXIT");
    assert.ok(exitSignals.length >= 1, "Expected at least one EXIT signal after fast SMA crosses below slow SMA");
  });

  it("should never generate a signal before slowPeriod candles are available", () => {
    const prices  = Array.from({ length: 30 }, (_, i) => 100 + i * 2);
    const candles = makeSyntheticCandles(prices);
    const signals = generateSmaCrossoverSignals(candles, { fastPeriod: 3, slowPeriod: 10 });
    // All signals before index 10 must be null
    for (let i = 0; i < 10; i++) {
      assert.equal(signals[i].signal, null, `Expected null signal at index ${i}`);
    }
  });

  it("should expose correct fastSma and slowSma values in each signal entry", () => {
    const prices  = Array.from({ length: 15 }, (_, i) => 100 + i);
    const candles = makeSyntheticCandles(prices);
    const signals = generateSmaCrossoverSignals(candles, { fastPeriod: 3, slowPeriod: 5 });
    signals.forEach((s, i) => {
      if (i >= 4) {
        assert.ok(s.fastSma !== null && typeof s.fastSma === "number");
        assert.ok(s.slowSma !== null && typeof s.slowSma === "number");
      }
    });
  });

  it("should throw for invalid strategy params", () => {
    const candles = makeSyntheticCandles(Array.from({ length: 30 }, () => 100));
    assert.throws(() => {
      generateSmaCrossoverSignals(candles, { fastPeriod: 21, slowPeriod: 9 });
    }, /smaller/);
  });
});
