import { calculateSMA } from "../helpers/indicatorHelper.js";

export const SMA_CROSSOVER_METADATA = {
  id: "sma_crossover",
  name: "Simple Moving Average Crossover",
  description: "Generates long entry signals when a fast SMA crosses above a slow SMA, and exit signals when it crosses below.",
  defaultParams: {
    fastPeriod: 9,
    slowPeriod: 21,
  },
};

/**
 * Validates SMA Crossover parameters
 */
export const validateSmaCrossoverParams = (params = {}) => {
  const fastPeriod = Number(params.fastPeriod || 9);
  const slowPeriod = Number(params.slowPeriod || 21);

  if (isNaN(fastPeriod) || fastPeriod <= 0) {
    return { isValid: false, error: "Fast SMA period must be a positive integer." };
  }
  if (isNaN(slowPeriod) || slowPeriod <= 0) {
    return { isValid: false, error: "Slow SMA period must be a positive integer." };
  }
  if (fastPeriod >= slowPeriod) {
    return { isValid: false, error: "Fast SMA period must be strictly smaller than Slow SMA period." };
  }

  return { isValid: true, fastPeriod, slowPeriod };
};

/**
 * Generates trading signals for SMA Crossover strategy without look-ahead bias
 * 
 * @param {Array<Object>} candles - Array of candle objects sorted chronologically { time, open, high, low, close, volume }
 * @param {Object} params - { fastPeriod, slowPeriod }
 * @returns {Array<Object>} Array of signals per candle index: { time, signal: 'BUY' | 'EXIT' | null, fastSma, slowSma }
 */
export const generateSmaCrossoverSignals = (candles = [], params = {}) => {
  const validation = validateSmaCrossoverParams(params);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { fastPeriod, slowPeriod } = validation;

  if (!candles || candles.length < slowPeriod) {
    return [];
  }

  const fastSma = calculateSMA(candles, fastPeriod);
  const slowSma = calculateSMA(candles, slowPeriod);

  const signals = [];

  for (let i = 0; i < candles.length; i++) {
    let signal = null;

    // Must have at least slowPeriod candles to compare previous and current SMA
    if (i >= slowPeriod && fastSma[i] !== null && slowSma[i] !== null && fastSma[i - 1] !== null && slowSma[i - 1] !== null) {
      const prevFast = fastSma[i - 1];
      const prevSlow = slowSma[i - 1];
      const currFast = fastSma[i];
      const currSlow = slowSma[i];

      // Bullish Crossover: Fast crosses above Slow
      if (prevFast <= prevSlow && currFast > currSlow) {
        signal = "BUY";
      }
      // Bearish Crossover: Fast crosses below Slow
      else if (prevFast >= prevSlow && currFast < currSlow) {
        signal = "EXIT";
      }
    }

    signals.push({
      index: i,
      time: candles[i].time,
      signal,
      fastSma: fastSma[i],
      slowSma: slowSma[i],
    });
  }

  return signals;
};
