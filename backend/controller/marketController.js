import marketStocks from "../data/marketStocks.js";

import {
      getTrueDataPrice,
      getTrueDataPrices,
} from "../services/trueDataService.js";

import {
      getTrueDataHistoricalPrices,
} from "../services/trueDataHistoricalService.js";

// ==================================================
// Get Single Market Price
// ==================================================

export const getMarketPrice = (
      req,
      res,
) => {
      try {
            const { symbol } = req.params;

            if (!symbol) {
                  return res.status(400).json({
                        success: false,
                        message:
                              "Stock symbol is required",
                  });
            }

            const normalizedSymbol =
                  symbol
                        .trim()
                        .toUpperCase();

            // ------------------------------------------
            // Get live TrueData price
            // ------------------------------------------

            const stock =
                  getTrueDataPrice(
                        normalizedSymbol,
                  );

            // ------------------------------------------
            // Find company information
            // ------------------------------------------

            const originalStock =
                  marketStocks.find(
                        (item) =>
                              item.symbol ===
                              normalizedSymbol,
                  );

            // ------------------------------------------
            // Response
            // ------------------------------------------

            return res.status(200).json({
                  success: true,

                  data: {
                        symbol:
                              stock.symbol,

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
                  },
            });
      } catch (error) {
            console.error(
                  "Get market price error:",
                  error.message,
            );

            return res.status(503).json({
                  success: false,

                  message:
                        error.message ||
                        "Unable to fetch market price",
            });
      }
};

// ==================================================
// Get All Market Prices
// ==================================================

export const getMarketPrices = (
      req,
      res,
) => {
      try {
            const trueDataPrices =
                  getTrueDataPrices();

            const successfulStocks = [];

            const failedStocks = [];

            // ------------------------------------------
            // Only stocks supported by TrueData
            // ------------------------------------------

            marketStocks
                  .filter(
                        (stock) =>
                              stock.symbol !==
                              "NIFTY 50" &&
                              stock.symbol !==
                              "SENSEX",
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

                              successfulStocks.push(
                                    {
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
                                    },
                              );
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

            return res.status(200).json({
                  success: true,

                  data: successfulStocks,

                  failedStocks,
            });
      } catch (error) {
            console.error(
                  "Get market prices error:",
                  error.message,
            );

            return res.status(503).json({
                  success: false,

                  message:
                        "Unable to fetch market prices",
            });
      }
};

// ==================================================
// Get Historical Market Prices
// ==================================================

export const getHistoricalMarketPricesController =
      async (
            req,
            res,
      ) => {
            try {
                  const { symbol } =
                        req.params;

                  const range =
                        req.query.range ||
                        "1M";

                  // ------------------------------------------
                  // Validate symbol
                  // ------------------------------------------

                  if (!symbol) {
                        return res.status(400).json({
                              success: false,

                              message:
                                    "Stock symbol is required",
                        });
                  }

                  const normalizedSymbol =
                        symbol
                              .trim()
                              .toUpperCase();

                  // ------------------------------------------
                  // Validate range
                  // ------------------------------------------

                  const allowedRanges = [
                        "1M",
                        "1Y",
                        "5Y",
                        "10Y",
                        "MAX",
                  ];

                  if (
                        !allowedRanges.includes(
                              range,
                        )
                  ) {
                        return res.status(400).json({
                              success: false,

                              message:
                                    "Invalid historical range. Allowed values: 1M, 1Y, 5Y, 10Y, MAX",
                        });
                  }

                  // ------------------------------------------
                  // Get historical data
                  // ------------------------------------------

                  const data =
                        await getTrueDataHistoricalPrices(
                              normalizedSymbol,
                              range,
                        );

                  // ------------------------------------------
                  // Response
                  // ------------------------------------------

                  return res.status(200).json({
                        success: true,

                        symbol:
                              normalizedSymbol,

                        range,

                        data,
                  });
            } catch (error) {
                  console.error(
                        "Get historical market prices error:",
                        error.message,
                  );

                  return res.status(503).json({
                        success: false,

                        message:
                              error.message ||
                              "Unable to fetch historical market prices",
                  });
            }
      };