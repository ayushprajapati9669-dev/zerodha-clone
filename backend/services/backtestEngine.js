import { generateSmaCrossoverSignals, validateSmaCrossoverParams } from "../strategies/smaCrossover.js";
import { calculateBacktestMetrics } from "../helpers/backtestMetricsHelper.js";

/**
 * Runs a modular strategy backtest simulation over genuine historical candles
 * 
 * @param {Object} config
 * @param {string} config.strategyName - Strategy identifier (e.g. 'sma_crossover')
 * @param {Array<Object>} config.candles - Chronological array of candles [{ time, open, high, low, close, volume }]
 * @param {Object} config.parameters - Strategy parameters (e.g. { fastPeriod: 9, slowPeriod: 21 })
 * @param {number} config.initialCapital - Initial virtual cash (default 100000)
 * @param {number} config.maxAllocationPercent - Max % allocation per trade (default 50)
 * @param {number} config.brokerage - Flat brokerage fee per order fill in INR (default 20)
 * @param {number} config.slippagePercent - Market slippage percentage per fill (default 0.05)
 */
export const runBacktestEngine = ({
  strategyName = "sma_crossover",
  candles = [],
  parameters = {},
  initialCapital = 100000,
  maxAllocationPercent = 50,
  brokerage = 20,
  slippagePercent = 0.05,
}) => {
  const cap = Number(initialCapital) > 0 ? Number(initialCapital) : 100000;
  const maxAllocPct = Math.min(100, Math.max(5, Number(maxAllocationPercent || 50)));
  const flatFee = Math.max(0, Number(brokerage || 0));
  const slipPct = Math.max(0, Number(slippagePercent || 0)) / 100;

  if (!Array.isArray(candles) || candles.length === 0) {
    throw new Error("No historical candles provided for backtesting engine.");
  }

  // 1. Generate Strategy Signals
  let signalResults = [];
  if (strategyName === "sma_crossover") {
    const val = validateSmaCrossoverParams(parameters);
    if (!val.isValid) {
      throw new Error(val.error);
    }
    signalResults = generateSmaCrossoverSignals(candles, parameters);
  } else {
    throw new Error(`Unsupported backtesting strategy: '${strategyName}'`);
  }

  let currentCapital = cap;
  let activePosition = null;
  const trades = [];
  const equityCurve = [];

  let maxPeakEquity = cap;

  // 2. Event-driven Simulation Loop (Next-Candle Execution to avoid look-ahead bias)
  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const signalObj = signalResults[i] || {};
    const pendingSignal = signalObj.signal;

    // Check if we need to execute a pending signal at current candle's OPEN
    if (activePosition && activePosition.pendingExitSignal && i > activePosition.entryIndex) {
      // Execute EXIT at candle's OPEN price
      const rawExitPrice = candle.open;
      const executionExitPrice = rawExitPrice * (1 - slipPct);
      const exitCosts = flatFee;
      const totalTradeCosts = activePosition.entryCosts + exitCosts;

      const grossPnl = (executionExitPrice - activePosition.executionEntryPrice) * activePosition.quantity;
      const netPnl = grossPnl - totalTradeCosts;
      const returnPct = activePosition.investedCapital > 0 ? (netPnl / activePosition.investedCapital) * 100 : 0;

      currentCapital += activePosition.investedCapital + netPnl;

      trades.push({
        tradeNumber: trades.length + 1,
        entryTime: activePosition.entryTime,
        entryPrice: Number(activePosition.rawEntryPrice.toFixed(2)),
        executionEntryPrice: Number(activePosition.executionEntryPrice.toFixed(2)),
        exitTime: candle.time,
        exitPrice: Number(rawExitPrice.toFixed(2)),
        executionExitPrice: Number(executionExitPrice.toFixed(2)),
        quantity: activePosition.quantity,
        investedCapital: Number(activePosition.investedCapital.toFixed(2)),
        grossPnL: Number(grossPnl.toFixed(2)),
        costs: Number(totalTradeCosts.toFixed(2)),
        netPnL: Number(netPnl.toFixed(2)),
        returnPercent: Number(returnPct.toFixed(2)),
        exitReason: "SMA Bearish Crossover",
      });

      activePosition = null;
    } else if (!activePosition && signalObj.pendingBuySignal && i > signalObj.pendingBuyIndex) {
      // Execute BUY at candle's OPEN price
      const rawEntryPrice = candle.open;
      const executionEntryPrice = rawEntryPrice * (1 + slipPct);
      const availableTradeCapital = currentCapital * (maxAllocPct / 100);
      const qty = Math.floor(availableTradeCapital / executionEntryPrice);

      if (qty >= 1) {
        const entryCosts = flatFee;
        const invested = qty * executionEntryPrice;

        currentCapital -= invested;
        activePosition = {
          entryIndex: i,
          entryTime: candle.time,
          rawEntryPrice,
          executionEntryPrice,
          quantity: qty,
          investedCapital: invested,
          entryCosts,
          pendingExitSignal: false,
        };
      }
    }

    // Process current candle's signal for next candle execution
    if (activePosition && pendingSignal === "EXIT") {
      activePosition.pendingExitSignal = true;
    } else if (!activePosition && pendingSignal === "BUY") {
      signalObj.pendingBuySignal = true;
      signalObj.pendingBuyIndex = i;
    }

    // Calculate current mark-to-market equity
    let currentEquity = currentCapital;
    if (activePosition) {
      const mtmPrice = candle.close;
      const mtmValue = activePosition.quantity * mtmPrice;
      currentEquity += mtmValue;
    }

    if (currentEquity > maxPeakEquity) {
      maxPeakEquity = currentEquity;
    }
    const currentDrawdownPct = maxPeakEquity > 0 ? ((maxPeakEquity - currentEquity) / maxPeakEquity) * 100 : 0;

    equityCurve.push({
      time: candle.time,
      equity: Number(currentEquity.toFixed(2)),
      drawdownPercent: Number(currentDrawdownPct.toFixed(2)),
    });
  }

  // 3. Handle Open Position at End of Test (Mark-to-Market Exit at final candle close)
  if (activePosition) {
    const finalCandle = candles[candles.length - 1];
    const rawExitPrice = finalCandle.close;
    const executionExitPrice = rawExitPrice * (1 - slipPct);
    const exitCosts = flatFee;
    const totalTradeCosts = activePosition.entryCosts + exitCosts;

    const grossPnl = (executionExitPrice - activePosition.executionEntryPrice) * activePosition.quantity;
    const netPnl = grossPnl - totalTradeCosts;
    const returnPct = activePosition.investedCapital > 0 ? (netPnl / activePosition.investedCapital) * 100 : 0;

    currentCapital += activePosition.investedCapital + netPnl;

    trades.push({
      tradeNumber: trades.length + 1,
      entryTime: activePosition.entryTime,
      entryPrice: Number(activePosition.rawEntryPrice.toFixed(2)),
      executionEntryPrice: Number(activePosition.executionEntryPrice.toFixed(2)),
      exitTime: finalCandle.time,
      exitPrice: Number(rawExitPrice.toFixed(2)),
      executionExitPrice: Number(executionExitPrice.toFixed(2)),
      quantity: activePosition.quantity,
      investedCapital: Number(activePosition.investedCapital.toFixed(2)),
      grossPnL: Number(grossPnl.toFixed(2)),
      costs: Number(totalTradeCosts.toFixed(2)),
      netPnL: Number(netPnl.toFixed(2)),
      returnPercent: Number(returnPct.toFixed(2)),
      exitReason: "End of Backtest (Mark-to-Market Exit)",
    });

    activePosition = null;
  }

  // 4. Calculate Final Performance Summary Metrics
  const summary = calculateBacktestMetrics({
    initialCapital: cap,
    trades,
    equityCurve,
  });

  return {
    strategyName,
    parameters,
    candleCount: candles.length,
    summary,
    trades,
    equityCurve,
    simulationAssumptions: {
      nextCandleExecution: "Signals execute at next candle Open price (no look-ahead bias)",
      brokeragePerFill: flatFee,
      slippagePercent: slipPct * 100,
      maxAllocationPercent: maxAllocPct,
    },
  };
};
