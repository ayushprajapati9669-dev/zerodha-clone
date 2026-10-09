import RiskSettings from "../models/RiskSettingsModel.js";
import RiskAlert from "../models/RiskAlertModel.js";
import Holding from "../models/HoldingsModel.js";
import Position from "../models/PositionsModel.js";
import Order from "../models/OrdersModel.js";
import { getUserFunds } from "../helpers/fundHelper.js";
import { getTrueDataPrice } from "./trueDataService.js";
import {
  calculateHoldingsAnalytics,
  calculateRealizedPnLForUser,
} from "../helpers/portfolioAnalyticsHelper.js";
import {
  calculatePortfolioRiskScore,
  calculateSectorConcentration,
  evaluatePreTradeRisk,
  calculateRiskRewardMetrics,
  getISTDateString,
} from "../helpers/riskCalculationHelper.js";
import { createNotificationIfEnabled } from "../helpers/notificationHelper.js";
import { emitNewNotification } from "../utils/notificationSocket.js";

/**
 * Ensures risk settings exist for a user, creating default settings if missing
 */
export const getOrCreateRiskSettings = async (userId) => {
  let settings = await RiskSettings.findOne({ userId });
  if (!settings) {
    settings = await RiskSettings.create({
      userId,
      enforcementMode: "warning",
      maxDailyLoss: 10000,
      dailyLossBasis: "realized_plus_unrealized",
      maxSingleStockAllocationPercent: 30,
      maxPositionSize: 50000,
      enableDailyLossGuard: true,
    });
  }
  return settings;
};

/**
 * Computes today's daily loss data for a user based on IST day boundary
 */
export const calculateDailyLossForUser = async (userId, riskSettings) => {
  const settings = riskSettings || (await getOrCreateRiskSettings(userId));
  const todayIST = getISTDateString();

  // Find all completed sell orders executed today in IST
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const completedTodaySellOrders = await Order.find({
    userId,
    status: "completed",
    type: "sell",
    createdAt: { $gte: startOfDay },
  });

  let todayRealizedPnL = 0;
  completedTodaySellOrders.forEach((ord) => {
    todayRealizedPnL += ord.realizedPnl || 0;
  });

  // Fetch holdings & live market prices to compute unrealized P&L
  const holdings = await Holding.find({ userId });

  const marketPrices = {};
  let staleCount = 0;

  for (const h of holdings) {
    const sym = h.symbol.toUpperCase();
    try {
      const liveData = getTrueDataPrice(sym);
      if (liveData && liveData.currentPrice) {
        marketPrices[sym] = liveData;
      } else {
        staleCount++;
      }
    } catch (e) {
      staleCount++;
    }
  }

  const { totalRealizedPnl: historicalRealizedMap } = await calculateRealizedPnLForUser(userId);
  const holdingsAnalytics = calculateHoldingsAnalytics(holdings, marketPrices, historicalRealizedMap);

  const unrealizedPnL = holdingsAnalytics.totalUnrealizedPnl || 0;

  let totalDailyPnL = 0;
  if (settings.dailyLossBasis === "realized_only") {
    totalDailyPnL = todayRealizedPnL;
  } else {
    totalDailyPnL = todayRealizedPnL + unrealizedPnL;
  }

  const currentDailyLoss = totalDailyPnL < 0 ? Math.abs(totalDailyPnL) : 0;
  const isLimitBreached = settings.enableDailyLossGuard && settings.maxDailyLoss > 0 && currentDailyLoss >= settings.maxDailyLoss;

  // Duplicate alert prevention check
  if (isLimitBreached && settings.lastDailyLossAlertDate !== todayIST) {
    settings.lastDailyLossAlertDate = todayIST;
    await settings.save();

    // Create risk alert entry
    await RiskAlert.create({
      userId,
      type: "daily_loss_breach",
      severity: "critical",
      actualValue: currentDailyLoss,
      configuredThreshold: settings.maxDailyLoss,
      explanation: `Maximum daily loss limit of ₹${settings.maxDailyLoss.toLocaleString("en-IN")} has been reached! Current daily loss: ₹${currentDailyLoss.toLocaleString("en-IN")}.`,
    });

    // Send notification
    const notification = await createNotificationIfEnabled({
      userId,
      type: "system",
      event: "system",
      title: "Daily Loss Guard Triggered",
      message: `Your daily loss limit of ₹${settings.maxDailyLoss.toLocaleString("en-IN")} has been reached.`,
      priority: "high",
    });

    if (notification) {
      emitNewNotification(userId, notification);
    }
  }

  return {
    todayIST,
    todayRealizedPnL,
    unrealizedPnL,
    totalDailyPnL,
    currentDailyLoss,
    maxDailyLoss: settings.maxDailyLoss,
    dailyLossBasis: settings.dailyLossBasis,
    isLimitBreached,
    holdingsAnalytics,
    staleCount,
  };
};

/**
 * Returns comprehensive Portfolio Risk Overview data for a user
 */
export const getRiskOverviewService = async (userId) => {
  const settings = await getOrCreateRiskSettings(userId);
  const dailyLossData = await calculateDailyLossForUser(userId, settings);
  const { holdingsAnalytics, staleCount } = dailyLossData;

  const riskScoreData = calculatePortfolioRiskScore({
    holdingsAnalytics,
    dailyLossData,
    riskSettings: settings,
    stalePriceCount: staleCount,
  });

  const sectorData = calculateSectorConcentration(
    holdingsAnalytics.stockAnalytics,
    holdingsAnalytics.totalCurrentValue
  );

  const activeAlertsCount = await RiskAlert.countDocuments({ userId, isRead: false });

  // Generate automated alerts for excessive stock concentration if any holding exceeds limit
  for (const stock of holdingsAnalytics.stockAnalytics || []) {
    if (stock.allocationPercent > settings.maxSingleStockAllocationPercent) {
      const existingAlert = await RiskAlert.findOne({
        userId,
        type: "stock_concentration",
        symbol: stock.symbol.toUpperCase(),
        isRead: false,
      });

      if (!existingAlert) {
        await RiskAlert.create({
          userId,
          type: "stock_concentration",
          severity: "high",
          symbol: stock.symbol.toUpperCase(),
          actualValue: Number(stock.allocationPercent.toFixed(2)),
          configuredThreshold: settings.maxSingleStockAllocationPercent,
          explanation: `${stock.symbol.toUpperCase()} represents ${stock.allocationPercent.toFixed(1)}% of portfolio, exceeding maximum allowed threshold of ${settings.maxSingleStockAllocationPercent}%.`,
        });
      }
    }
  }

  return {
    riskScore: riskScoreData.score,
    riskCategory: riskScoreData.riskCategory,
    insufficientData: riskScoreData.insufficientData,
    factors: riskScoreData.factors,
    recommendations: riskScoreData.recommendations,
    thresholds: riskScoreData.thresholds,
    topHolding: holdingsAnalytics.topHolding ? {
      symbol: holdingsAnalytics.topHolding.symbol,
      allocationPercent: Number(holdingsAnalytics.topHoldingPercentage.toFixed(2)),
      currentValue: holdingsAnalytics.topHolding.currentValue,
    } : null,
    sectorConcentration: sectorData.sectorBreakdown,
    hasReliableSectorData: sectorData.hasReliableData,
    dailyLossLimit: settings.maxDailyLoss,
    currentDailyLoss: dailyLossData.currentDailyLoss,
    dailyLossBasis: settings.dailyLossBasis,
    isDailyLossBreached: dailyLossData.isLimitBreached,
    activeAlertsCount,
    enforcementMode: settings.enforcementMode,
    disclaimer: "This risk score is an educational, rule-based assessment and does not guarantee safety or predict future market performance.",
  };
};

/**
 * Updates user risk settings
 */
export const updateRiskSettingsService = async (userId, updateData) => {
  const settings = await getOrCreateRiskSettings(userId);

  if (updateData.enforcementMode && ["warning", "strict"].includes(updateData.enforcementMode)) {
    settings.enforcementMode = updateData.enforcementMode;
  }
  if (updateData.maxDailyLoss !== undefined && Number(updateData.maxDailyLoss) >= 0) {
    settings.maxDailyLoss = Number(updateData.maxDailyLoss);
  }
  if (updateData.dailyLossBasis && ["realized_only", "realized_plus_unrealized"].includes(updateData.dailyLossBasis)) {
    settings.dailyLossBasis = updateData.dailyLossBasis;
  }
  if (updateData.maxSingleStockAllocationPercent !== undefined && Number(updateData.maxSingleStockAllocationPercent) >= 1) {
    settings.maxSingleStockAllocationPercent = Number(updateData.maxSingleStockAllocationPercent);
  }
  if (updateData.maxPositionSize !== undefined && Number(updateData.maxPositionSize) >= 0) {
    settings.maxPositionSize = Number(updateData.maxPositionSize);
  }
  if (updateData.enableDailyLossGuard !== undefined) {
    settings.enableDailyLossGuard = Boolean(updateData.enableDailyLossGuard);
  }

  await settings.save();
  return settings;
};

/**
 * Evaluates Pre-Trade Risk for an order
 */
export const evaluateOrderRiskService = async (userId, orderData) => {
  const settings = await getOrCreateRiskSettings(userId);
  const userFunds = await getUserFunds(userId);
  const dailyLossData = await calculateDailyLossForUser(userId, settings);

  return evaluatePreTradeRisk({
    order: orderData,
    userFunds,
    holdingsAnalytics: dailyLossData.holdingsAnalytics,
    riskSettings: settings,
    dailyLossData,
  });
};

/**
 * Gets user risk alerts
 */
export const getRiskAlertsService = async (userId) => {
  const alerts = await RiskAlert.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return alerts;
};

/**
 * Marks a risk alert as read
 */
export const markAlertAsReadService = async (userId, alertId) => {
  const alert = await RiskAlert.findOneAndUpdate(
    { _id: alertId, userId },
    { isRead: true },
    { new: true }
  );
  return alert;
};

/**
 * Calculates Stop-Loss & Risk-to-Reward ratio for arbitrary inputs
 */
export const calculateRiskRewardService = (params) => {
  return calculateRiskRewardMetrics(params);
};
