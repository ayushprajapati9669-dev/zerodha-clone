import Holding from "../models/HoldingsModel.js";
import Funds from "../models/FundsModel.js";
import Order from "../models/OrdersModel.js";
import { calculateRealizedPnLForUser, calculateHoldingsAnalytics } from "../helpers/portfolioAnalyticsHelper.js";
import { getSnapshotHistory, captureUserSnapshot } from "./portfolioSnapshotService.js";
import { getAllLivePrices } from "./trueDataService.js";

/**
 * Main summary service for Portfolio Analytics Dashboard
 */
export const getPortfolioAnalyticsSummary = async (userId) => {
  const holdings = await Holding.find({ userId });
  const userFunds = await Funds.findOne({ userId });
  const cashBalance = userFunds ? Number(userFunds.availableBalance || 0) : 0;
  const marketPrices = getAllLivePrices() || {};

  const { totalRealizedPnl, stockRealizedMap } = await calculateRealizedPnLForUser(userId);
  const holdingsAnalytics = calculateHoldingsAnalytics(holdings, marketPrices, stockRealizedMap);

  const totalInvested = holdingsAnalytics.totalInvested;
  const currentValue = holdingsAnalytics.totalCurrentValue;
  const unrealizedPnl = holdingsAnalytics.totalUnrealizedPnl;
  const realizedPnl = totalRealizedPnl;
  const totalPnl = unrealizedPnl + realizedPnl;
  const totalPortfolioValue = currentValue + cashBalance;
  const totalReturnPercent = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;
  const dayPnl = holdingsAnalytics.totalDayProfitLoss;

  // Capture today's snapshot asynchronously
  captureUserSnapshot(userId).catch((err) =>
    console.error("Background snapshot capture error:", err.message)
  );

  return {
    totalInvested,
    currentValue,
    cashBalance,
    totalPortfolioValue,
    realizedPnl,
    unrealizedPnl,
    totalPnl,
    totalReturnPercent,
    dayPnl,
    holdingsCount: holdings.length,
  };
};

/**
 * Performance over time series endpoint handler
 */
export const getPortfolioPerformanceOverTime = async (userId, range = "1M") => {
  return await getSnapshotHistory(userId, range);
};

/**
 * Realized vs Unrealized P&L detailed breakdown
 */
export const getPnLBreakdownService = async (userId, symbolFilter = null) => {
  const holdings = await Holding.find({ userId });
  const marketPrices = getAllLivePrices() || {};
  const { totalRealizedPnl, stockRealizedMap } = await calculateRealizedPnLForUser(userId);
  const analytics = calculateHoldingsAnalytics(holdings, marketPrices, stockRealizedMap);

  // Completed sell orders for realized P&L trade history
  const sellOrdersQuery = { userId, type: "sell", status: "completed" };
  if (symbolFilter) {
    sellOrdersQuery.symbol = symbolFilter.toUpperCase();
  }
  const completedSellOrders = await Order.find(sellOrdersQuery).sort({ executedAt: -1, createdAt: -1 });

  let stockList = analytics.stockAnalytics;
  if (symbolFilter) {
    stockList = stockList.filter((s) => s.symbol.toUpperCase() === symbolFilter.toUpperCase());
  }

  return {
    summary: {
      totalRealizedPnl,
      totalUnrealizedPnl: analytics.totalUnrealizedPnl,
      combinedPnl: totalRealizedPnl + analytics.totalUnrealizedPnl,
    },
    stocks: stockList,
    recentSellTransactions: completedSellOrders.map((order) => ({
      orderId: order._id,
      symbol: order.symbol,
      companyName: order.companyName,
      quantity: order.quantity,
      executionPrice: order.executionPrice || order.price,
      costBasis: order.costBasis || 0,
      realizedPnl: order.realizedPnl || 0,
      executedAt: order.executedAt || order.createdAt,
      product: order.product,
    })),
  };
};

/**
 * Best and worst performing stocks service
 */
export const getStockRankingsService = async (userId) => {
  const holdings = await Holding.find({ userId });
  const marketPrices = getAllLivePrices() || {};
  const { totalRealizedPnl, stockRealizedMap } = await calculateRealizedPnLForUser(userId);
  const analytics = calculateHoldingsAnalytics(holdings, marketPrices, stockRealizedMap);

  return {
    bestPerformer: analytics.bestPerformer,
    worstPerformer: analytics.worstPerformer,
    topHolding: analytics.topHolding,
    topHoldingPercentage: analytics.topHoldingPercentage,
    stocks: analytics.stockAnalytics,
  };
};
