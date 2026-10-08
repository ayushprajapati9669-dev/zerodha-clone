import marketStocks from "../data/marketStocks.js";

import {
      getTrueDataPrice,
      getTrueDataPrices,
} from "./trueDataService.js";

import {
      getTrueDataHistoricalPrices,
} from "./trueDataHistoricalService.js";

// ==================================================
// Get Single Market Price
// ==================================================

export const getMarketPrice = (
      symbol,
) => {
      const stock =
            getTrueDataPrice(symbol);

      const originalStock =
            marketStocks.find(
                  (item) =>
                        item.symbol === symbol,
            );

      return {
            symbol: stock.symbol,

            companyName:
                  originalStock?.companyName ||
                  stock.symbol,

            currentPrice:
                  stock.currentPrice,

            previousClose:
                  stock.previousClose,

            priceChange:
                  stock.priceChange,

            priceChangePercent:
                  stock.priceChangePercent,

            open: stock.open,

            high: stock.high,

            low: stock.low,

            volume: stock.volume,

            lastUpdateTime:
                  stock.lastUpdateTime,
      };
};

// ==================================================
// Get All Market Prices
// ==================================================

export const getAllMarketPrices = () => {
      const trueDataPrices =
            getTrueDataPrices();

      const successfulStocks = [];

      const failedStocks = [];

      // ------------------------------------------------
      // Only stocks supported by TrueData
      // ------------------------------------------------

      marketStocks
            .filter(
                  (stock) =>
                        stock.symbol !== "NIFTY 50" &&
                        stock.symbol !== "SENSEX",
            )
            .forEach((stock) => {
                  try {
                        const data =
                              trueDataPrices[
                              stock.symbol
                              ];

                        if (!data) {
                              throw new Error(
                                    `TrueData price not available for ${stock.symbol}`,
                              );
                        }

                        successfulStocks.push({
                              symbol:
                                    stock.symbol,

                              companyName:
                                    stock.companyName,

                              currentPrice:
                                    data.currentPrice,

                              previousClose:
                                    data.previousClose,

                              priceChange:
                                    data.priceChange,

                              priceChangePercent:
                                    data.priceChangePercent,

                              open:
                                    data.open,

                              high:
                                    data.high,

                              low:
                                    data.low,

                              volume:
                                    data.volume,

                              lastUpdateTime:
                                    data.lastUpdateTime,
                        });
                  } catch (error) {
                        failedStocks.push(
                              stock.symbol,
                        );

                        console.error(
                              `TrueData error for ${stock.symbol}:`,
                              error.message,
                        );
                  }
            });

      return {
            successfulStocks,
            failedStocks,
      };
};

// ==================================================
// Historical Market Prices
// ==================================================

export const getHistoricalMarketPrices =
      async (
            symbol,
            range = "1M",
      ) => {
            return await getTrueDataHistoricalPrices(
                  symbol,
                  range,
            );
      };