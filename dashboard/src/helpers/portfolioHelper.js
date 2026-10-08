
const calculatePortfolioSummary = (
      portfolioData,
      marketPrices = {}
) => {
      const totalInvestment = portfolioData.reduce(
            (total, portfolio) => {
                  return (
                        total +
                        portfolio.averagePrice * portfolio.quantity
                  );
            },
            0
      );

      const currentValue = portfolioData.reduce(
            (total, portfolio) => {
                  const marketData = marketPrices[portfolio.symbol];

                  const currentPrice =
                        marketData?.currentPrice ??
                        portfolio.currentPrice;

                  return (
                        total +
                        portfolio.quantity * currentPrice
                  );
            },
            0
      );

      const totalProfitLoss =
            currentValue - totalInvestment;

      const totalProfitLossPercent =
            totalInvestment > 0
                  ? (totalProfitLoss / totalInvestment) * 100
                  : 0;

      const totalDayProfitLoss = portfolioData.reduce(
            (total, portfolio) => {
                  const marketData = marketPrices[portfolio.symbol];

                  const currentPrice =
                        marketData?.currentPrice ??
                        portfolio.currentPrice;

                  const previousClose =
                        marketData?.previousClose ??
                        portfolio.previousClose;

                  return (
                        total +
                        (currentPrice - previousClose) *
                        portfolio.quantity
                  );
            },
            0
      );

      return {
            totalInvestment,
            currentValue,
            totalProfitLoss,
            totalProfitLossPercent,
            totalDayProfitLoss,
      };
};

const calculatePortfolioValues = (
      portfolio,
      marketPrices = {}
) => {
      const marketData = marketPrices[portfolio.symbol];

      const currentPrice =
            marketData?.currentPrice ??
            portfolio.currentPrice;

      const previousClose =
            marketData?.previousClose ??
            portfolio.previousClose;

      const investedValue =
            portfolio.averagePrice * portfolio.quantity;

      const currentValue =
            currentPrice * portfolio.quantity;

      const profitLoss =
            currentValue - investedValue;

      const dayProfitLoss =
            (currentPrice - previousClose) *
            portfolio.quantity;

      const profitLossPercentage =
            investedValue > 0
                  ? (profitLoss / investedValue) * 100
                  : 0;

      return {
            currentPrice,
            previousClose,
            investedValue,
            currentValue,
            profitLoss,
            dayProfitLoss,
            profitLossPercentage,
      };
};

export {
      calculatePortfolioSummary,
      calculatePortfolioValues,
};

