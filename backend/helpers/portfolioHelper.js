const calculateAveragePrice = (
      oldQuantity,
      oldAveragePrice,
      newQuantity,
      newPrice
) => {
      const oldInvestment = oldQuantity * oldAveragePrice;
      const newInvestment = newQuantity * newPrice;

      const totalQuantity = oldQuantity + newQuantity;

      return {
            quantity: totalQuantity,
            averagePrice:
                  (oldInvestment + newInvestment) / totalQuantity,
      };
};

export const reducePortfolioQuantity = async (
      portfolio,
      quantity,
      session
) => {
      portfolio.quantity -= quantity;

      if (portfolio.quantity === 0) {
            await portfolio.deleteOne({ session });
      } else {
            await portfolio.save({ session });
      }
};
export const createOrUpdatePortfolio = async ({
      Model,
      existingPortfolio,
      userId,
      symbol,
      companyName,
      quantity,
      price,
      previousClose,
      product,
      type,
      session,
}) => {
      if (!existingPortfolio) {
            const portfolioData = {
                  userId,
                  symbol,
                  companyName,
                  quantity,
                  reservedQuantity: 0,
                  averagePrice: price,
                  currentPrice: price,
                  previousClose: previousClose

            };

            if (product === "MIS") {
                  portfolioData.product = product;
                  portfolioData.type = type;
            } else {
                  portfolioData.product = product;
                  portfolioData.type = type;
            }

            const [newPortfolio] = await Model.create(
                  [portfolioData],
                  { session }
            );
            console.log(newPortfolio);
            return newPortfolio;
      }

      const updatedPortfolio = calculateAveragePrice(
            existingPortfolio.quantity,
            existingPortfolio.averagePrice,
            quantity,
            price
      );

      existingPortfolio.quantity = updatedPortfolio.quantity;
      existingPortfolio.averagePrice = updatedPortfolio.averagePrice;
      existingPortfolio.currentPrice = price;

      await existingPortfolio.save({ session });

      return existingPortfolio;
};
export default { calculateAveragePrice, reducePortfolioQuantity, createOrUpdatePortfolio };