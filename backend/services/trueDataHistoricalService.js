import axios from "axios";

// ==================================================
// TrueData API URLs
// ==================================================

const AUTH_URL =
      "https://auth.truedata.in/token";

const HISTORY_BASE_URL =
      "https://history.truedata.in";

// ==================================================
// TrueData Credentials
// ==================================================

const username =
      process.env.TRUEDATA_USERNAME;

const password =
      process.env.TRUEDATA_PASSWORD;

// ==================================================
// Access Token Cache
// ==================================================

let cachedAccessToken = null;
let tokenExpiryTime = 0;

// ==================================================
// Get REST Access Token
// ==================================================

const getTrueDataAccessToken = async () => {
      try {
            // Reuse token if still valid
            if (
                  cachedAccessToken &&
                  Date.now() < tokenExpiryTime
            ) {
                  return cachedAccessToken;
            }

            // Check credentials
            if (!username || !password) {
                  throw new Error(
                        "TrueData username or password is missing",
                  );
            }

            const response =
                  await axios.post(
                        AUTH_URL,

                        new URLSearchParams({
                              username,
                              password,
                              grant_type: "password",
                        }),

                        {
                              headers: {
                                    "Content-Type":
                                          "application/x-www-form-urlencoded",
                              },
                        },
                  );

            const accessToken =
                  response.data?.access_token;

            if (!accessToken) {
                  throw new Error(
                        "TrueData access token not received",
                  );
            }

            // Save token
            cachedAccessToken =
                  accessToken;

            // Token expiry
            const expiresIn =
                  Number(
                        response.data?.expires_in,
                  ) || 3600;

            // Refresh 60 seconds before expiry
            tokenExpiryTime =
                  Date.now() +
                  Math.max(
                        expiresIn - 60,
                        1,
                  ) *
                  1000;

            return cachedAccessToken;
      } catch (error) {
            console.error(
                  "TrueData authentication error:",
                  error.response?.data ||
                  error.message,
            );

            cachedAccessToken = null;
            tokenExpiryTime = 0;

            throw new Error(
                  "TrueData historical authentication failed",
            );
      }
};

// ==================================================
// Get Historical Data
// ==================================================

const getTrueDataHistoricalData = async ({
      symbol,
      from,
      to,
      interval,
}) => {
      try {
            const accessToken =
                  await getTrueDataAccessToken();

            const response =
                  await axios.get(
                        `${HISTORY_BASE_URL}/getbars`,
                        {
                              params: {
                                    symbol,
                                    from,
                                    to,
                                    response: "json",
                                    interval,
                              },

                              headers: {
                                    Authorization:
                                          `Bearer ${accessToken}`,
                              },

                              timeout: 30000,
                        },
                  );

            const records =
                  response.data?.Records;

            // ------------------------------------------
            // TrueData error / empty response
            // ------------------------------------------

            if (
                  !Array.isArray(records) ||
                  records.length === 0
            ) {
                  console.error(
                        "TrueData response:",
                        response.data,
                  );

                  throw new Error(
                        `TrueData historical data not available for ${symbol}`,
                  );
            }

          
            return records;
      } catch (error) {
            console.error(
                  `TrueData historical API error (${symbol}):`,
                  error.response?.data ||
                  error.message,
            );

            throw new Error(
                  `Unable to fetch historical data for ${symbol}`,
            );
      }
};

// ==================================================
// Format TrueData Date
// ==================================================

const formatTrueDataDate = (date) => {
      const year =
            String(
                  date.getFullYear(),
            ).slice(-2);

      const month =
            String(
                  date.getMonth() + 1,
            ).padStart(2, "0");

      const day =
            String(
                  date.getDate(),
            ).padStart(2, "0");

      return `${year}${month}${day}`;
};

// ==================================================
// Get Historical Market Prices
// ==================================================

export const getTrueDataHistoricalPrices =
      async (
            symbol,
            range = "1M",
      ) => {
            try {
                  // ==========================================
                  // Validate symbol
                  // ==========================================

                  if (!symbol) {
                        throw new Error(
                              "Symbol is required",
                        );
                  }

                  // ==========================================
                  // Current date
                  // ==========================================

                  const now =
                        new Date();

                  // ==========================================
                  // Range Configuration
                  // ==========================================

                  const rangeConfig = {
                        "1M": {
                              months: 1,
                              interval: "15min",
                              intraday: true,
                        },

                        "1Y": {
                              years: 1,
                              interval: "eod",
                              intraday: false,
                        },

                        "5Y": {
                              years: 5,
                              interval: "eod",
                              intraday: false,
                        },

                        "10Y": {
                              years: 10,
                              interval: "eod",
                              intraday: false,
                        },

                        MAX: {
                              years: 10,
                              interval: "eod",
                              intraday: false,
                        },
                  };

                  // ==========================================
                  // Get selected range
                  // ==========================================

                  const config =
                        rangeConfig[range];

                  if (!config) {
                        throw new Error(
                              `Unsupported historical range: ${range}`,
                        );
                  }

                  // ==========================================
                  // Calculate From Date
                  // ==========================================

                  const fromDate =
                        new Date(now);

                  if (config.months) {
                        fromDate.setMonth(
                              fromDate.getMonth() -
                              config.months,
                        );
                  }

                  if (config.years) {
                        fromDate.setFullYear(
                              fromDate.getFullYear() -
                              config.years,
                        );
                  }

                  // ==========================================
                  // Format From / To
                  // ==========================================

                  const from =
                        `${formatTrueDataDate(
                              fromDate,
                        )}T09:15:00`;

                  const to =
                        `${formatTrueDataDate(
                              now,
                        )}T15:30:00`;


                 
                  // ==========================================
                  // Fetch records
                  // ==========================================

                  const records =
                        await getTrueDataHistoricalData({
                              symbol,
                              from,
                              to,
                              interval:
                                    config.interval,
                        });

                  // ==========================================
                  // Convert records
                  // ==========================================

                  const historicalData =
                        records
                              .map(
                                    (record) => {
                                          /*
                                           * TrueData:
                                           *
                                           * [
                                           *   time,
                                           *   open,
                                           *   high,
                                           *   low,
                                           *   close,
                                           *   volume,
                                           *   oi
                                           * ]
                                           */

                                          const [
                                                time,
                                                open,
                                                high,
                                                low,
                                                close,
                                                volume,
                                                oi,
                                          ] = record;

                                          const price =
                                                Number(
                                                      close,
                                                );

                                          // Ignore invalid records
                                          if (
                                                !time ||
                                                !Number.isFinite(
                                                      price,
                                                )
                                          ) {
                                                return null;
                                          }

                                          return {
                                                time,
                                                price:
                                                      Number(
                                                            price.toFixed(
                                                                  2,
                                                            ),
                                                      ),
                                          };
                                    },
                              )
                              .filter(
                                    Boolean,
                              );

                  // ==========================================
                  // Validate data
                  // ==========================================

                  if (
                        historicalData.length ===
                        0
                  ) {
                        throw new Error(
                              `Valid TrueData historical data not found for ${symbol}`,
                        );
                  }

                  // ==========================================
                  // Latest first
                  // ==========================================

                  historicalData.reverse();

                 

                  return historicalData;
            } catch (error) {
                  console.error(
                        `TrueData historical prices error (${symbol}, ${range}):`,
                        error.message,
                  );

                  throw new Error(
                        `Unable to load ${range} historical data for ${symbol}`,
                  );
            }
      };