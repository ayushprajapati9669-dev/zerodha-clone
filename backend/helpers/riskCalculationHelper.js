/**
 * Sector classification dictionary for supported Indian stocks
 */
export const STOCK_SECTOR_MAP = {
  RELIANCE: "Oil & Gas / Energy",
  TCS: "IT Services",
  INFY: "IT Services",
  WIPRO: "IT Services",
  HDFCBANK: "Financial Services",
  ICICIBANK: "Financial Services",
  SBIN: "Financial Services",
  AXISBANK: "Financial Services",
  KOTAKBANK: "Financial Services",
  ITC: "FMCG / Consumer Goods",
  HINDUNILVR: "FMCG / Consumer Goods",
  BHARTIARTL: "Telecommunication",
  MARUTI: "Automobile",
  SUNPHARMA: "Pharmaceuticals",
};

/**
 * Returns current date string formatted as YYYY-MM-DD in IST (Asia/Kolkata)
 */
export const getISTDateString = (dateObj = new Date()) => {
  const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
  const formatter = new Intl.DateTimeFormat("en-CA", options); // en-CA gives YYYY-MM-DD format
  return formatter.format(dateObj);
};

/**
 * Calculates long and short stop-loss and risk-to-reward metrics.
 * 
 * @param {Object} params
 * @param {number} params.entryPrice
 * @param {number} params.quantity
 * @param {number} [params.stopLossPrice]
 * @param {number} [params.targetPrice]
 * @param {string} params.type - 'buy' (long) or 'sell' (short)
 */
export const calculateRiskRewardMetrics = ({
  entryPrice,
  quantity,
  stopLossPrice,
  targetPrice,
  type = "buy",
}) => {
  const numEntry = Number(entryPrice);
  const numQty = Number(quantity);
  const numSL = stopLossPrice !== undefined && stopLossPrice !== null && stopLossPrice !== "" ? Number(stopLossPrice) : null;
  const numTarget = targetPrice !== undefined && targetPrice !== null && targetPrice !== "" ? Number(targetPrice) : null;

  if (isNaN(numEntry) || numEntry <= 0 || isNaN(numQty) || numQty <= 0) {
    return {
      isValid: false,
      error: "Entry price and quantity must be positive numbers.",
      potentialLoss: null,
      potentialProfit: null,
      riskRewardRatio: null,
    };
  }

  const isLong = type.toLowerCase() === "buy";

  let potentialLoss = null;
  let potentialProfit = null;
  let riskRewardRatio = null;

  if (numSL !== null && !isNaN(numSL) && numSL > 0) {
    if (isLong) {
      potentialLoss = Math.max(0, numEntry - numSL) * numQty;
    } else {
      potentialLoss = Math.max(0, numSL - numEntry) * numQty;
    }
  }

  if (numTarget !== null && !isNaN(numTarget) && numTarget > 0) {
    if (isLong) {
      potentialProfit = Math.max(0, numTarget - numEntry) * numQty;
    } else {
      potentialProfit = Math.max(0, numEntry - numTarget) * numQty;
    }
  }

  if (potentialLoss !== null && potentialLoss > 0 && potentialProfit !== null) {
    riskRewardRatio = Number((potentialProfit / potentialLoss).toFixed(2));
  }

  return {
    isValid: true,
    entryPrice: numEntry,
    quantity: numQty,
    stopLossPrice: numSL,
    targetPrice: numTarget,
    type: isLong ? "buy" : "sell",
    potentialLoss: potentialLoss !== null ? Number(potentialLoss.toFixed(2)) : null,
    potentialProfit: potentialProfit !== null ? Number(potentialProfit.toFixed(2)) : null,
    riskRewardRatio,
    disclaimer: "Estimates exclude brokerage, taxes, and market slippage. Does not guarantee exchange execution.",
  };
};

/**
 * Calculates rule-based Portfolio Risk Score (0-100) and risk factors
 */
export const calculatePortfolioRiskScore = ({
  holdingsAnalytics,
  dailyLossData,
  riskSettings,
  stalePriceCount = 0,
}) => {
  const { totalCurrentValue = 0, stockAnalytics = [] } = holdingsAnalytics || {};
  const { maxDailyLoss = 10000 } = riskSettings || {};

  if (!stockAnalytics || stockAnalytics.length === 0) {
    return {
      score: 0,
      riskCategory: "Low",
      insufficientData: false,
      factors: [
        { name: "Portfolio Concentration", points: 0, description: "No holdings in portfolio" },
        { name: "Diversification Count", points: 0, description: "Clean portfolio state" },
        { name: "Daily Loss Limit", points: 0, description: "No daily loss incurred" },
      ],
      recommendations: ["Maintain a balanced investment strategy as you build your portfolio."],
      stalePriceCount: 0,
    };
  }

  let totalScore = 0;
  const factors = [];
  const recommendations = [];

  // Factor 1: Stock Concentration (0-35 points)
  const sortedHoldings = [...stockAnalytics].sort((a, b) => b.currentValue - a.currentValue);
  const topHolding = sortedHoldings[0];
  const topHoldingAllocation = totalCurrentValue > 0 ? (topHolding.currentValue / totalCurrentValue) * 100 : 0;

  let concentrationPoints = 0;
  if (topHoldingAllocation > 50) {
    concentrationPoints = 35;
    recommendations.push(`Reduce exposure to ${topHolding.symbol}, which accounts for ${topHoldingAllocation.toFixed(1)}% of your portfolio.`);
  } else if (topHoldingAllocation > 35) {
    concentrationPoints = 25;
    recommendations.push(`Consider rebalancing ${topHolding.symbol} (${topHoldingAllocation.toFixed(1)}% allocation) to lower stock risk.`);
  } else if (topHoldingAllocation > 25) {
    concentrationPoints = 15;
  } else if (topHoldingAllocation > 15) {
    concentrationPoints = 5;
  }

  totalScore += concentrationPoints;
  factors.push({
    name: "Stock Concentration",
    points: concentrationPoints,
    maxPoints: 35,
    description: topHolding ? `Largest holding (${topHolding.symbol}) represents ${topHoldingAllocation.toFixed(1)}% of portfolio.` : "Balanced allocation",
  });

  // Factor 2: Diversification (0-25 points)
  const holdingCount = stockAnalytics.length;
  let divPoints = 0;
  if (holdingCount === 1) {
    divPoints = 25;
    recommendations.push("Your portfolio is concentrated in a single stock. Add positions across different sectors.");
  } else if (holdingCount <= 3) {
    divPoints = 15;
    recommendations.push("Diversify across more uncorrelated symbols to reduce single-stock volatility.");
  } else if (holdingCount <= 5) {
    divPoints = 5;
  }

  totalScore += divPoints;
  factors.push({
    name: "Diversification Count",
    points: divPoints,
    maxPoints: 25,
    description: `Portfolio contains ${holdingCount} stock${holdingCount > 1 ? "s" : ""}.`,
  });

  // Factor 3: Daily Loss Limit Utilization (0-25 points)
  const currentDailyLoss = dailyLossData?.currentDailyLoss || 0;
  let dailyLossPoints = 0;

  if (maxDailyLoss > 0 && currentDailyLoss > 0) {
    const lossRatio = currentDailyLoss / maxDailyLoss;
    if (lossRatio >= 1.0) {
      dailyLossPoints = 25;
      recommendations.push("Daily loss limit has been breached! Pause trading or reduce position sizes.");
    } else if (lossRatio >= 0.75) {
      dailyLossPoints = 18;
      recommendations.push(`Daily loss has reached ${(lossRatio * 100).toFixed(0)}% of your ₹${maxDailyLoss.toLocaleString("en-IN")} daily budget.`);
    } else if (lossRatio >= 0.5) {
      dailyLossPoints = 10;
    } else if (lossRatio >= 0.25) {
      dailyLossPoints = 5;
    }
  }

  totalScore += dailyLossPoints;
  factors.push({
    name: "Daily Loss Budget",
    points: dailyLossPoints,
    maxPoints: 25,
    description: currentDailyLoss > 0 ? `Current daily loss is ₹${currentDailyLoss.toLocaleString("en-IN")} (${maxDailyLoss > 0 ? Math.min(100, Math.round((currentDailyLoss / maxDailyLoss) * 100)) : 0}% of limit).` : "No daily loss incurred.",
  });

  // Factor 4: Stale / Missing Prices Risk (0-15 points)
  let stalePoints = 0;
  if (stalePriceCount > 0) {
    stalePoints = Math.min(15, stalePriceCount * 5);
    recommendations.push("Some market prices could not be updated in real time. Exercise caution.");
  }
  totalScore += stalePoints;
  factors.push({
    name: "Market Data Health",
    points: stalePoints,
    maxPoints: 15,
    description: stalePriceCount > 0 ? `${stalePriceCount} symbol(s) using cached or previous close prices.` : "Live market feeds healthy.",
  });

  totalScore = Math.min(100, Math.max(0, totalScore));

  let riskCategory = "Low";
  if (totalScore >= 76) riskCategory = "Critical";
  else if (totalScore >= 51) riskCategory = "High";
  else if (totalScore >= 26) riskCategory = "Moderate";

  return {
    score: totalScore,
    riskCategory,
    insufficientData: false,
    factors,
    recommendations,
    stalePriceCount,
    thresholds: [
      { category: "Low", range: "0 - 25" },
      { category: "Moderate", range: "26 - 50" },
      { category: "High", range: "51 - 75" },
      { category: "Critical", range: "76 - 100" },
    ],
  };
};

/**
 * Calculates sector breakdown for holdings based on STOCK_SECTOR_MAP
 */
export const calculateSectorConcentration = (stockAnalytics = [], totalCurrentValue = 0) => {
  if (!stockAnalytics.length || totalCurrentValue <= 0) {
    return {
      sectorBreakdown: [],
      hasReliableData: true,
    };
  }

  const sectorMap = {};
  stockAnalytics.forEach((holding) => {
    const symbol = holding.symbol.toUpperCase();
    const sector = STOCK_SECTOR_MAP[symbol] || "Unclassified / Other";
    sectorMap[sector] = (sectorMap[sector] || 0) + holding.currentValue;
  });

  const sectorBreakdown = Object.entries(sectorMap).map(([sector, val]) => ({
    sector,
    value: Number(val.toFixed(2)),
    percentage: Number(((val / totalCurrentValue) * 100).toFixed(2)),
  })).sort((a, b) => b.value - a.value);

  return {
    sectorBreakdown,
    hasReliableData: true,
  };
};

/**
 * Evaluates Pre-Trade Risk for a proposed order against user risk settings & portfolio limits
 */
export const evaluatePreTradeRisk = ({
  order,
  userFunds,
  holdingsAnalytics,
  riskSettings,
  dailyLossData,
}) => {
  const {
    symbol,
    type,
    quantity,
    orderType,
    price,
    product = "CNC",
    stopLossPrice,
    targetPrice,
  } = order;

  const numQty = Number(quantity);
  const numPrice = Number(price);

  const warnings = [];
  const violations = [];
  const explanations = [];

  const estimatedTradeValue = numQty * numPrice;

  // Calculate stop loss & risk-reward metrics if provided
  const riskRewardMetrics = calculateRiskRewardMetrics({
    entryPrice: numPrice,
    quantity: numQty,
    stopLossPrice,
    targetPrice,
    type,
  });

  const estimatedLoss = riskRewardMetrics.potentialLoss;
  const riskRewardRatio = riskRewardMetrics.riskRewardRatio;

  const enforcementMode = riskSettings?.enforcementMode || "warning";
  const maxPositionSize = Number(riskSettings?.maxPositionSize || 50000);
  const maxSingleStockAllocationPercent = Number(riskSettings?.maxSingleStockAllocationPercent || 30);
  const maxDailyLoss = Number(riskSettings?.maxDailyLoss || 10000);
  const currentDailyLoss = Number(dailyLossData?.currentDailyLoss || 0);

  // 1. Check Max Position Size
  if (maxPositionSize > 0 && estimatedTradeValue > maxPositionSize) {
    const msg = `Order value (₹${estimatedTradeValue.toLocaleString("en-IN")}) exceeds maximum position limit of ₹${maxPositionSize.toLocaleString("en-IN")}.`;
    violations.push(msg);
    explanations.push(msg);
  } else if (maxPositionSize > 0 && estimatedTradeValue > maxPositionSize * 0.8) {
    const msg = `Order value is near your maximum position limit (₹${maxPositionSize.toLocaleString("en-IN")}).`;
    warnings.push(msg);
    explanations.push(msg);
  }

  // 2. Check Stock Allocation after trade
  const totalCurrentValue = holdingsAnalytics?.totalCurrentValue || 0;
  const existingHolding = holdingsAnalytics?.stockAnalytics?.find(
    (h) => h.symbol.toUpperCase() === symbol.trim().toUpperCase()
  );
  const currentHoldingValue = existingHolding ? existingHolding.currentValue : 0;
  const projectedHoldingValue = type.toLowerCase() === "buy" ? currentHoldingValue + estimatedTradeValue : Math.max(0, currentHoldingValue - estimatedTradeValue);
  const projectedTotalPortfolio = totalCurrentValue + (type.toLowerCase() === "buy" ? estimatedTradeValue : 0);

  if (projectedTotalPortfolio > 0 && type.toLowerCase() === "buy") {
    const projectedAllocation = (projectedHoldingValue / projectedTotalPortfolio) * 100;
    if (projectedAllocation > maxSingleStockAllocationPercent) {
      const msg = `This buy order would increase ${symbol.toUpperCase()} portfolio allocation to ${projectedAllocation.toFixed(1)}%, exceeding your max limit of ${maxSingleStockAllocationPercent}%.`;
      violations.push(msg);
      explanations.push(msg);
    } else if (projectedAllocation > maxSingleStockAllocationPercent * 0.85) {
      const msg = `Projected allocation for ${symbol.toUpperCase()} will be ${projectedAllocation.toFixed(1)}% (limit: ${maxSingleStockAllocationPercent}%).`;
      warnings.push(msg);
      explanations.push(msg);
    }
  }

  // 3. Check Daily Loss Limit
  const remainingRiskBudget = maxDailyLoss > 0 ? Math.max(0, maxDailyLoss - currentDailyLoss) : Infinity;

  if (riskSettings?.enableDailyLossGuard && maxDailyLoss > 0) {
    if (currentDailyLoss >= maxDailyLoss) {
      const msg = `Daily loss limit breached! Current daily loss (₹${currentDailyLoss.toLocaleString("en-IN")}) meets or exceeds max limit of ₹${maxDailyLoss.toLocaleString("en-IN")}.`;
      violations.push(msg);
      explanations.push(msg);
    } else if (estimatedLoss !== null && estimatedLoss > remainingRiskBudget) {
      const msg = `Potential trade loss at stop-loss (₹${estimatedLoss.toLocaleString("en-IN")}) exceeds remaining daily risk budget (₹${remainingRiskBudget.toLocaleString("en-IN")}).`;
      warnings.push(msg);
      explanations.push(msg);
    }
  }

  // Determine allowed status
  let allowed = true;
  if (enforcementMode === "strict" && violations.length > 0) {
    allowed = false;
  }

  let riskLevel = "low";
  if (violations.length > 0) riskLevel = "critical";
  else if (warnings.length > 1) riskLevel = "high";
  else if (warnings.length === 1) riskLevel = "moderate";

  if (orderType === "Market") {
    explanations.push("Market Order: Price-based calculations are estimates based on current market price and execution price may vary.");
  }

  return {
    allowed,
    enforcementMode,
    riskLevel,
    warnings,
    violations,
    estimatedTradeValue: Number(estimatedTradeValue.toFixed(2)),
    estimatedLoss,
    riskRewardRatio,
    remainingDailyRiskBudget: remainingRiskBudget === Infinity ? null : Number(remainingRiskBudget.toFixed(2)),
    explanations,
  };
};
