
const toNumber = (value) => {
      const parsedValue = Number(value);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const calculatePortfolioSummary = (
      portfolioData = [],
      marketPrices = {}
) => {
      const totalInvestment = portfolioData.reduce(
            (total, portfolio) => {
                  return (
                        total +
                        toNumber(portfolio?.averagePrice) *
                        toNumber(portfolio?.quantity)
                  );
            },
            0
      );

      const currentValue = portfolioData.reduce(
            (total, portfolio) => {
                  const marketData = marketPrices[portfolio?.symbol];

                  const currentPrice =
                        toNumber(
                              marketData?.currentPrice ??
                              portfolio?.currentPrice
                        );

                  return total + toNumber(portfolio?.quantity) * currentPrice;
            },
            0
      );

      const totalProfitLoss = currentValue - totalInvestment;

      const totalProfitLossPercent =
            totalInvestment > 0
                  ? (totalProfitLoss / totalInvestment) * 100
                  : 0;

      const totalDayProfitLoss = portfolioData.reduce(
            (total, portfolio) => {
                  const marketData = marketPrices[portfolio?.symbol];

                  const currentPrice =
                        toNumber(
                              marketData?.currentPrice ??
                              portfolio?.currentPrice
                        );

                  const previousClose =
                        toNumber(
                              marketData?.previousClose ??
                              portfolio?.previousClose
                        );

                  return (
                        total +
                        (currentPrice - previousClose) *
                        toNumber(portfolio?.quantity)
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
      portfolio = {},
      marketPrices = {}
) => {
      const marketData = marketPrices[portfolio.symbol];

      const currentPrice = toNumber(
            marketData?.currentPrice ?? portfolio.currentPrice
      );

      const previousClose = toNumber(
            marketData?.previousClose ?? portfolio.previousClose
      );

      const investedValue =
            toNumber(portfolio.averagePrice) * toNumber(portfolio.quantity);

      const currentValue = currentPrice * toNumber(portfolio.quantity);

      const profitLoss = currentValue - investedValue;

      const dayProfitLoss =
            (currentPrice - previousClose) * toNumber(portfolio.quantity);

      const profitLossPercentage =
            investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

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

