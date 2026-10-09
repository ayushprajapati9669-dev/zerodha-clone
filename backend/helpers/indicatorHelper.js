/**
 * Calculates Simple Moving Average (SMA) series for a given numerical array or candle array
 *
 * @param {Array<number|Object>} data - Array of price numbers or candle objects with .close
 * @param {number} period - SMA period window
 * @returns {Array<number|null>} Array of SMA values matching input length (null for indices < period - 1)
 */
export const calculateSMA = (data, period) => {
  if (!Array.isArray(data) || data.length === 0 || !period || period <= 0) {
    return [];
  }

  const prices = data.map((d) => (typeof d === "number" ? d : Number(d.close || d.price || 0)));
  const smaSeries = new Array(prices.length).fill(null);

  if (prices.length < period) {
    return smaSeries;
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  smaSeries[period - 1] = Number((sum / period).toFixed(4));

  for (let i = period; i < prices.length; i++) {
    sum = sum - prices[i - period] + prices[i];
    smaSeries[i] = Number((sum / period).toFixed(4));
  }

  return smaSeries;
};
