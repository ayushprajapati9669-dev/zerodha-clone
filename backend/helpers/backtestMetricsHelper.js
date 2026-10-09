/**
 * Computes performance statistics and metrics for a completed backtest run
 * 
 * @param {Object} params
 * @param {number} params.initialCapital - Initial cash balance
 * @param {Array<Object>} params.trades - List of simulated completed trades
 * @param {Array<Object>} params.equityCurve - Equity curve points [{ time, equity }]
 * @returns {Object} Comprehensive performance metrics
 */
export const calculateBacktestMetrics = ({
  initialCapital,
  trades = [],
  equityCurve = [],
}) => {
  const cap = Number(initialCapital) > 0 ? Number(initialCapital) : 100000;
  const totalTrades = trades.length;

  if (totalTrades === 0) {
    return {
      initialCapital: cap,
      finalEquity: cap,
      netPnL: 0,
      returnPercent: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: "N/A",
      maxDrawdownPercent: 0,
      totalCosts: 0,
      avgTradeReturnPercent: 0,
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let totalCosts = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalReturnSum = 0;

  trades.forEach((tr) => {
    const net = Number(tr.netPnL || 0);
    const costs = Number(tr.costs || 0);
    totalCosts += costs;
    totalReturnSum += Number(tr.returnPercent || 0);

    if (net > 0) {
      winningTrades++;
      grossProfit += net;
    } else if (net < 0) {
      losingTrades++;
      grossLoss += Math.abs(net);
    }
  });

  const netPnL = Number((grossProfit - grossLoss).toFixed(2));
  const finalEquity = Number((cap + netPnL).toFixed(2));
  const returnPercent = Number(((netPnL / cap) * 100).toFixed(2));
  const winRate = Number(((winningTrades / totalTrades) * 100).toFixed(2));

  const avgWin = winningTrades > 0 ? Number((grossProfit / winningTrades).toFixed(2)) : 0;
  const avgLoss = losingTrades > 0 ? Number((grossLoss / losingTrades).toFixed(2)) : 0;

  let profitFactor = "N/A";
  if (grossLoss > 0) {
    profitFactor = Number((grossProfit / grossLoss).toFixed(2));
  } else if (grossProfit > 0) {
    profitFactor = "Max (No Loss)";
  }

  // Maximum Drawdown calculation from equity curve
  let maxPeak = cap;
  let maxDrawdownVal = 0;
  let maxDrawdownPercent = 0;

  equityCurve.forEach((point) => {
    const eq = Number(point.equity || cap);
    if (eq > maxPeak) {
      maxPeak = eq;
    }
    const drawdown = maxPeak - eq;
    const drawdownPct = maxPeak > 0 ? (drawdown / maxPeak) * 100 : 0;

    if (drawdownPct > maxDrawdownPercent) {
      maxDrawdownPercent = drawdownPct;
      maxDrawdownVal = drawdown;
    }
  });

  return {
    initialCapital: cap,
    finalEquity,
    netPnL,
    returnPercent,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    maxDrawdownValue: Number(maxDrawdownVal.toFixed(2)),
    totalCosts: Number(totalCosts.toFixed(2)),
    avgTradeReturnPercent: Number((totalReturnSum / totalTrades).toFixed(2)),
  };
};
