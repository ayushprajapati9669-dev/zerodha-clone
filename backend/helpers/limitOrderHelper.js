import Holding from "../models/HoldingsModel.js";
import Position from "../models/PositionsModel.js";

export const getOrderPortfolio = async (order, session) => {
      let PortfolioModel;
      let query;

      if (order.product === "CNC") {
            PortfolioModel = Holding;

            query = {
                  userId: order.userId,
                  symbol: order.symbol,
            };
      } else if (order.product === "MIS") {
            PortfolioModel = Position;

            query = {
                  userId: order.userId,
                  symbol: order.symbol,
                  product: "MIS",
            };
      } else {
            throw new Error("Invalid product type");
      }

      const portfolio = await PortfolioModel.findOne(
            query,
            null,
            { session },
      );

      return {
            PortfolioModel,
            portfolio,
      };
};