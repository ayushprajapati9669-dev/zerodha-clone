import PortfolioSnapshot from "../models/PortfolioSnapshotModel.js";
import Holding from "../models/HoldingsModel.js";
import Funds from "../models/FundsModel.js";
import { calculateRealizedPnLForUser, calculateHoldingsAnalytics } from "../helpers/portfolioAnalyticsHelper.js";
import { getAllLivePrices } from "./trueDataService.js";

/**
 * Format Date as YYYY-MM-DD
 */
const formatDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Capture or update today's snapshot for a specific user
 */
export const captureUserSnapshot = async (userId) => {
  try {
    const todayKey = formatDateKey();
    const holdings = await Holding.find({ userId });
    const userFunds = await Funds.findOne({ userId });

    const cashBalance = userFunds ? Number(userFunds.availableBalance || 0) : 0;
    const marketPrices = getAllLivePrices() || {};
    const { totalRealizedPnl, stockRealizedMap } = await calculateRealizedPnLForUser(userId);
    const analytics = calculateHoldingsAnalytics(holdings, marketPrices, stockRealizedMap);

    const totalInvested = analytics.totalInvested;
    const currentValue = analytics.totalCurrentValue;
    const unrealizedPnl = analytics.totalUnrealizedPnl;
    const realizedPnl = totalRealizedPnl;
    const totalPnl = unrealizedPnl + realizedPnl;
    const totalPortfolioValue = currentValue + cashBalance;
    const returnPercentage = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;

    const snapshotData = {
      userId,
      date: todayKey,
      timestamp: new Date(),
      totalInvested,
      currentValue,
      cashBalance,
      totalPortfolioValue,
      realizedPnl,
      unrealizedPnl,
      totalPnl,
      returnPercentage,
      holdingsCount: holdings.length,
    };

    const snapshot = await PortfolioSnapshot.findOneAndUpdate(
      { userId, date: todayKey },
      snapshotData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return snapshot;
  } catch (error) {
    console.error(`Error capturing snapshot for user ${userId}:`, error.message);
    return null;
  }
};

/**
 * Helper to compute date range cutoff
 */
const getStartDateForRange = (range) => {
  const now = new Date();
  const start = new Date(now);

  switch (range) {
    case "1W":
      start.setDate(now.getDate() - 7);
      break;
    case "1M":
      start.setMonth(now.getMonth() - 1);
      break;
    case "3M":
      start.setMonth(now.getMonth() - 3);
      break;
    case "6M":
      start.setMonth(now.getMonth() - 6);
      break;
    case "1Y":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "ALL":
    default:
      return null;
  }
  return start;
};

/**
 * Retrieves portfolio snapshot performance history for a user across a specified range
 */
export const getSnapshotHistory = async (userId, range = "1M") => {
  // Always capture today's live state first to ensure latest point is present
  await captureUserSnapshot(userId);

  const startDate = getStartDateForRange(range);
  const query = { userId };
  if (startDate) {
    const startDateKey = formatDateKey(startDate);
    query.date = { $gte: startDateKey };
  }

  const snapshots = await PortfolioSnapshot.find(query).sort({ date: 1 });

  if (snapshots.length === 0) {
    return {
      snapshots: [],
      metrics: {
        startingValue: 0,
        endingValue: 0,
        absoluteChange: 0,
        percentageChange: 0,
        dataPointsCount: 0,
        collectionStartDate: null,
      },
    };
  }

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  const startingValue = first.totalPortfolioValue;
  const endingValue = last.totalPortfolioValue;
  const absoluteChange = endingValue - startingValue;
  const percentageChange = startingValue > 0 ? (absoluteChange / startingValue) * 100 : 0;

  return {
    snapshots: snapshots.map((s) => ({
      date: s.date,
      timestamp: s.timestamp,
      totalPortfolioValue: s.totalPortfolioValue,
      currentValue: s.currentValue,
      cashBalance: s.cashBalance,
      totalInvested: s.totalInvested,
      unrealizedPnl: s.unrealizedPnl,
      realizedPnl: s.realizedPnl,
      returnPercentage: s.returnPercentage,
    })),
    metrics: {
      startingValue,
      endingValue,
      absoluteChange,
      percentageChange,
      dataPointsCount: snapshots.length,
      collectionStartDate: first.date,
    },
  };
};
