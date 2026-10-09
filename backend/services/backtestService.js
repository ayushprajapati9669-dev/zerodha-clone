import BacktestHistory from "../models/BacktestHistoryModel.js";
import { getTrueDataHistoricalCandles } from "./historicalDataService.js";
import { runBacktestEngine } from "./backtestEngine.js";
import { SMA_CROSSOVER_METADATA } from "../strategies/smaCrossover.js";

/**
 * Returns available strategies metadata for backtesting UI
 */
export const getAvailableStrategiesService = () => {
  return [SMA_CROSSOVER_METADATA];
};

/**
 * Executes strategy backtest over genuine TrueData historical candles
 */
export const runBacktestSimulationService = async (params = {}) => {
  const {
    strategyName = "sma_crossover",
    symbol,
    fromDate,
    toDate,
    interval = "15min",
    fastPeriod = 9,
    slowPeriod = 21,
    initialCapital = 100000,
    maxAllocationPercent = 50,
    brokerage = 20,
    slippagePercent = 0.05,
  } = params;

  if (!symbol || !fromDate || !toDate) {
    throw new Error("Missing required backtesting parameters (symbol, fromDate, toDate).");
  }

  // 1. Fetch genuine TrueData historical candles
  const candles = await getTrueDataHistoricalCandles({
    symbol,
    fromDate,
    toDate,
    interval,
  });

  // 2. Execute isolated backtest engine
  const backtestResult = runBacktestEngine({
    strategyName,
    candles,
    parameters: { fastPeriod, slowPeriod },
    initialCapital,
    maxAllocationPercent,
    brokerage,
    slippagePercent,
  });

  return {
    symbol: symbol.toUpperCase(),
    fromDate,
    toDate,
    interval,
    ...backtestResult,
  };
};

/**
 * Saves completed backtest run to MongoDB
 */
export const saveBacktestRunService = async (userId, backtestData) => {
  const {
    strategyName,
    symbol,
    fromDate,
    toDate,
    interval,
    parameters,
    summary,
    trades,
    equityCurve,
  } = backtestData;

  if (!strategyName || !symbol || !summary) {
    throw new Error("Invalid backtest run payload.");
  }

  const savedRun = await BacktestHistory.create({
    userId,
    strategyName,
    symbol: symbol.toUpperCase(),
    fromDate,
    toDate,
    interval,
    parameters,
    summary,
    trades: trades || [],
    equityCurve: (equityCurve || []).slice(0, 500), // Store up to 500 equity curve points
  });

  return savedRun;
};

/**
 * Returns paginated saved backtest history for user
 */
export const getSavedBacktestHistoryService = async (userId, page = 1, limit = 10) => {
  const skip = (Math.max(1, page) - 1) * limit;

  const [history, totalCount] = await Promise.all([
    BacktestHistory.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-trades -equityCurve"),
    BacktestHistory.countDocuments({ userId }),
  ]);

  return {
    history,
    pagination: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
};

/**
 * Gets single detailed saved backtest run by ID (strictly isolated to owner)
 */
export const getSavedBacktestRunByIdService = async (userId, runId) => {
  const run = await BacktestHistory.findOne({ _id: runId, userId });
  if (!run) {
    throw new Error("Saved backtest run not found or access denied.");
  }
  return run;
};

/**
 * Deletes a saved backtest run
 */
export const deleteSavedBacktestRunService = async (userId, runId) => {
  const run = await BacktestHistory.findOneAndDelete({ _id: runId, userId });
  if (!run) {
    throw new Error("Saved backtest run not found or access denied.");
  }
  return run;
};
