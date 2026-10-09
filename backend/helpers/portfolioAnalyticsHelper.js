import Order from "../models/OrdersModel.js";

/**
 * Calculates realized P&L for a user across all completed sell orders.
 * Employs stored realizedPnl on orders if present, or reconstructs via weighted average cost matching.
 */
export const calculateRealizedPnLForUser = async (userId) => {
  const completedOrders = await Order.find({
    userId,
    status: "completed",
  }).sort({ createdAt: 1, executedAt: 1 });

  let totalRealizedPnl = 0;
  const stockRealizedMap = {};

  // Track inventory state for weighted average cost calculation fallback
  const inventory = {}; // symbol -> { quantity, totalCost }

  for (const order of completedOrders) {
    const symbol = order.symbol.toUpperCase();
    if (!inventory[symbol]) {
      inventory[symbol] = { quantity: 0, totalCost: 0 };
    }

    if (order.type === "buy") {
      const execPrice = order.executionPrice ?? order.price;
      inventory[symbol].quantity += order.quantity;
      inventory[symbol].totalCost += order.quantity * execPrice;
    } else if (order.type === "sell") {
      const execPrice = order.executionPrice ?? order.price;
      let pnl = 0;

      if (typeof order.realizedPnl === "number" && order.realizedPnl !== 0) {
        pnl = order.realizedPnl;
      } else {
        const currentQty = inventory[symbol].quantity;
        const avgCost = currentQty > 0 ? inventory[symbol].totalCost / currentQty : 0;
        pnl = (execPrice - avgCost) * order.quantity;
      }

      totalRealizedPnl += pnl;
      stockRealizedMap[symbol] = (stockRealizedMap[symbol] || 0) + pnl;

      // Reduce inventory
      if (inventory[symbol].quantity > 0) {
        const currentAvg = inventory[symbol].totalCost / inventory[symbol].quantity;
        inventory[symbol].quantity = Math.max(0, inventory[symbol].quantity - order.quantity);
        inventory[symbol].totalCost = inventory[symbol].quantity * currentAvg;
      }
    }
  }

  return {
    totalRealizedPnl,
    stockRealizedMap,
  };
};

/**
 * Analyzes holdings against live market prices to produce detailed analytics,
 * best/worst performers, stock contributions, and allocation data.
 */
export const calculateHoldingsAnalytics = (holdings = [], marketPrices = {}, realizedMap = {}) => {
  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalDayProfitLoss = 0;

  const stockAnalytics = holdings.map((holding) => {
    const symbol = holding.symbol.toUpperCase();
    const marketData = marketPrices[symbol] || marketPrices[holding.symbol];

    const currentPrice = Number(marketData?.currentPrice ?? holding.currentPrice ?? holding.averagePrice);
    const previousClose = Number(marketData?.previousClose ?? holding.previousClose ?? currentPrice);

    const investedValue = Number(holding.averagePrice) * Number(holding.quantity);
    const currentValue = currentPrice * Number(holding.quantity);
    const unrealizedPnl = currentValue - investedValue;
    const unrealizedPnlPercent = investedValue > 0 ? (unrealizedPnl / investedValue) * 100 : 0;

    const dayPnl = (currentPrice - previousClose) * Number(holding.quantity);
    const dayPnlPercent = previousClose > 0 ? ((currentPrice - previousClose) / previousClose) * 100 : 0;

    const realizedPnl = realizedMap[symbol] || 0;
    const totalPnl = unrealizedPnl + realizedPnl;

    totalInvested += investedValue;
    totalCurrentValue += currentValue;
    totalDayProfitLoss += dayPnl;

    return {
      symbol: holding.symbol,
      companyName: holding.companyName,
      product: holding.product,
      quantity: holding.quantity,
      reservedQuantity: holding.reservedQuantity || 0,
      averagePrice: holding.averagePrice,
      currentPrice,
      previousClose,
      investedValue,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      realizedPnl,
      totalPnl,
      dayPnl,
      dayPnlPercent,
      allocationPercent: 0, // Computed after totals
      contributionPercent: 0, // Computed after totals
    };
  });

  const totalUnrealizedPnl = totalCurrentValue - totalInvested;
  const totalUnrealizedPnlPercent = totalInvested > 0 ? (totalUnrealizedPnl / totalInvested) * 100 : 0;

  // Compute allocation and contribution percentages
  stockAnalytics.forEach((item) => {
    item.allocationPercent = totalCurrentValue > 0 ? (item.currentValue / totalCurrentValue) * 100 : 0;
    item.contributionPercent = Math.abs(totalUnrealizedPnl) > 0 ? (item.unrealizedPnl / Math.abs(totalUnrealizedPnl)) * 100 : 0;
  });

  // Best and worst performing stocks based on unrealized return %
  const sortedByReturn = [...stockAnalytics].sort((a, b) => b.unrealizedPnlPercent - a.unrealizedPnlPercent);
  const bestPerformer = sortedByReturn.length > 0 ? sortedByReturn[0] : null;
  const worstPerformer = sortedByReturn.length > 0 ? sortedByReturn[sortedByReturn.length - 1] : null;

  // Portfolio concentration: top holding
  const sortedByValue = [...stockAnalytics].sort((a, b) => b.currentValue - a.currentValue);
  const topHolding = sortedByValue.length > 0 ? sortedByValue[0] : null;
  const topHoldingPercentage = topHolding && totalCurrentValue > 0 ? (topHolding.currentValue / totalCurrentValue) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalUnrealizedPnl,
    totalUnrealizedPnlPercent,
    totalDayProfitLoss,
    stockAnalytics,
    bestPerformer,
    worstPerformer,
    topHolding,
    topHoldingPercentage,
  };
};
