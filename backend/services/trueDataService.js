import axios from "axios";
import WebSocket from "ws";

import checkPendingLimitOrders from "./checkPendingLimitOrders.js";
import { evaluateAlerts } from "../controller/priceAlertController.js";

// =====================================================
// TRUE DATA CREDENTIALS
// =====================================================

const username = process.env.TRUEDATA_USERNAME;
const password = process.env.TRUEDATA_PASSWORD;
const port = Number(process.env.TRUEDATA_LIVE_PORT || 8086);

// =====================================================
// HISTORICAL API
// =====================================================

const HISTORY_BASE_URL = "https://history.truedata.in";
const AUTH_URL = "https://auth.truedata.in/token";

// =====================================================
// SYMBOLS
// =====================================================

const symbols = [
      "RELIANCE",
      "TCS",
      "INFY",
      "HDFCBANK",
      "ICICIBANK",
      "SBIN",
      "ITC",
      "BHARTIARTL",
      "WIPRO",
      "AXISBANK",
      "KOTAKBANK",
      "MARUTI",
      "HINDUNILVR",
      "SUNPHARMA",
];

// =====================================================
// LIVE PRICE CACHE
// =====================================================

const latestTrueDataPrices = new Map();

// =====================================================
// LIMIT ORDER LOCK
// =====================================================

const limitOrderChecksInProgress = new Set();

// =====================================================
// HISTORICAL TOKEN
// =====================================================

let historicalAccessToken = null;
let historicalTokenExpiresAt = 0;
let wsConnection = null;

// =====================================================
// NORMALIZE SYMBOL
// =====================================================

const normalizeSymbol = (symbol) => {
      return String(symbol || "")
            .trim()
            .toUpperCase()
            .replace("NSE:", "")
            .replace("BSE:", "");
};

// =====================================================
// CONNECT TRUE DATA NATIVELY
// =====================================================

export const connectTrueData = () => {
      try {
            if (!username || !password) {
                  console.error("❌ TrueData credentials are missing");
                  return;
            }

            if (wsConnection && (wsConnection.readyState === WebSocket.OPEN || wsConnection.readyState === WebSocket.CONNECTING)) {
                  return;
            }

            console.log("Connecting to TrueData WebSocket...");
            const url = `wss://push.truedata.in:${port}?user=${username}&password=${password}`;
            
            // Mask credentials in logs
            const safeUrl = `wss://push.truedata.in:${port}?user=***&password=***`;
            
            wsConnection = new WebSocket(url);

            wsConnection.on('open', () => {
                  console.log(`TrueData WebSocket connected safely to ${safeUrl}`);
                  // Note: We DO NOT subscribe here yet. We wait for authentication success.
            });

            wsConnection.on('message', (data) => {
                  try {
                        const jsonObj = JSON.parse(data);
                        
                        if (jsonObj.success === false) {
                              console.error("TrueData Auth/Subscription Error:", jsonObj.message || jsonObj);
                              // Handle authentication failures without infinite retry loops
                              if (jsonObj.message === 'User Already Connected' || jsonObj.message?.includes('Invalid')) {
                                    console.error("Critical TrueData Error. Closing connection without auto-retry.");
                                    wsConnection.close();
                              }
                        } else if (jsonObj.success && jsonObj.message === 'TrueData Real Time Data Service') {
                              console.log("✅ TrueData Authenticated Successfully. Subscribing to symbols...");
                              // Subscribe to symbols only after successful authentication
                              wsConnection.send(JSON.stringify({
                                    method: 'addsymbol',
                                    symbols: symbols
                              }));
                        } else if (jsonObj.success && (jsonObj.message === 'symbols added' || jsonObj.message === 'touchline')) {
                              if (jsonObj.symbollist) {
                                    jsonObj.symbollist.forEach(item => {
                                          const stock = {
                                                Symbol: item[0],
                                                LastUpdateTime: item[2],
                                                LTP: +item[3],
                                                TickVolume: +item[4],
                                                ATP: +item[5],
                                                Volume: +item[6],
                                                Open: +item[7],
                                                High: +item[8],
                                                Low: +item[9],
                                                Previous_Close: +item[10],
                                                Turnover: +item[11],
                                          };
                                          processStockTick(stock);
                                    });
                              }
                        }
                  } catch (e) {
                        console.error("TrueData Parse Error:", e.message);
                  }
            });

            wsConnection.on('error', (err) => {
                  console.error("❌ TrueData connection error:", err.message);
            });

            wsConnection.on('close', () => {
                  console.log("TrueData WebSocket closed.");
                  wsConnection = null;
            });

      } catch (error) {
            console.error("❌ TrueData connection setup error:", error.message);
      }
};

// =====================================================
// PROCESS TOUCHLINE DATA
// =====================================================

const processStockTick = (stock) => {
      if (!stock) return;

      const normalizedSymbol = normalizeSymbol(stock.Symbol);
      if (!normalizedSymbol) return;

      const currentPrice = Number(stock.LTP);
      const previousClose = Number(stock.Previous_Close);

      if (!Number.isFinite(currentPrice) || currentPrice <= 0) return;
      if (!Number.isFinite(previousClose) || previousClose <= 0) return;

      const priceChange = currentPrice - previousClose;
      const priceChangePercent = previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;

      const open = Number(stock.Open);
      const high = Number(stock.High);
      const low = Number(stock.Low);

      const latestPriceData = {
            symbol: normalizedSymbol,
            currentPrice: Number(currentPrice.toFixed(2)),
            previousClose: Number(previousClose.toFixed(2)),
            priceChange: Number(priceChange.toFixed(2)),
            priceChangePercent: Number(priceChangePercent.toFixed(2)),
            open: Number.isFinite(open) ? Number(open.toFixed(2)) : 0,
            high: Number.isFinite(high) ? Number(high.toFixed(2)) : 0,
            low: Number.isFinite(low) ? Number(low.toFixed(2)) : 0,
            volume: Number(stock.Volume || 0),
            lastUpdateTime: stock.LastUpdateTime,
            receivedAt: Date.now(),
      };

      latestTrueDataPrices.set(normalizedSymbol, latestPriceData);

      // Evaluate price alerts
      evaluateAlerts(normalizedSymbol, latestPriceData.currentPrice).catch((error) => {
            console.error(`❌ Alert evaluation failed for ${normalizedSymbol}:`, error.message);
      });

      // Check limit orders
      if (!limitOrderChecksInProgress.has(normalizedSymbol)) {
            limitOrderChecksInProgress.add(normalizedSymbol);

            checkPendingLimitOrders(
                  normalizedSymbol,
                  latestPriceData.currentPrice,
                  latestPriceData.previousClose
            )
                  .catch((error) => {
                        console.error(`❌ Limit order check failed for ${normalizedSymbol}:`, error.message);
                  })
                  .finally(() => {
                        limitOrderChecksInProgress.delete(normalizedSymbol);
                  });
      }
};


// =====================================================
// GET ONE TRUE DATA PRICE
// =====================================================

export const getTrueDataPrice = (
      symbol
) => {

      const normalizedSymbol =
            normalizeSymbol(
                  symbol
            );


      if (
            !normalizedSymbol
      ) {

            throw new Error(
                  "Invalid symbol"
            );

      }


      const stock =
            latestTrueDataPrices.get(
                  normalizedSymbol
            );


      // -------------------------------------------------
      // PRICE NOT AVAILABLE
      // -------------------------------------------------

      if (
            !stock
      ) {

            throw new Error(
                  `TrueData live price not available for ${normalizedSymbol}`
            );

      }


      // -------------------------------------------------
      // IMPORTANT
      //
      // NO 60 SECOND STALE CHECK
      //
      // TrueData may send the last valid tick when
      // market is closed.
      // -------------------------------------------------

      return stock;

};


// =====================================================
// GET ALL TRUE DATA PRICES
// =====================================================

export const getTrueDataPrices = () => {

      return Object.fromEntries(
            latestTrueDataPrices
      );

};

export const getAllLivePrices = () => {
      return getTrueDataPrices();
};


// =====================================================
// GET SYMBOL LIST
// =====================================================

export const getTrueDataSymbols = () => {

      return [
            ...symbols
      ];

};


// =====================================================
// CHECK CONNECTION
// =====================================================

export const isTrueDataConnected = () => {
      return wsConnection !== null && wsConnection.readyState === WebSocket.OPEN;
};


// =====================================================
// DISCONNECT
// =====================================================

export const disconnectTrueData = () => {
      try {
            if (wsConnection) {
                  wsConnection.close();
                  wsConnection = null;
            }
            latestTrueDataPrices.clear();
            limitOrderChecksInProgress.clear();
      } catch (error) {
            console.error("TrueData disconnect error:", error.message);
      }
};


// =====================================================
// HISTORICAL ACCESS TOKEN
// =====================================================

const getHistoricalAccessToken =
      async () => {

            // -------------------------------------------------
            // EXISTING VALID TOKEN
            // -------------------------------------------------

            if (
                  historicalAccessToken &&
                  Date.now() <
                  historicalTokenExpiresAt
            ) {

                  return historicalAccessToken;

            }


            // -------------------------------------------------
            // CREDENTIAL CHECK
            // -------------------------------------------------

            if (
                  !username ||
                  !password
            ) {

                  throw new Error(
                        "TrueData credentials are missing"
                  );

            }


            // -------------------------------------------------
            // REQUEST TOKEN
            // -------------------------------------------------

            const response =
                  await axios.post(

                        AUTH_URL,

                        new URLSearchParams({

                              username,

                              password,

                              grant_type:
                                    "password",

                        }).toString(),

                        {

                              headers: {

                                    "Content-Type":
                                          "application/x-www-form-urlencoded",

                              },

                        }

                  );


            const {
                  access_token,
                  expires_in,
            } =
                  response.data || {};


            if (
                  !access_token
            ) {

                  throw new Error(
                        "TrueData historical authentication failed"
                  );

            }


            historicalAccessToken =
                  access_token;


            historicalTokenExpiresAt =
                  Date.now() +

                  Math.max(

                        Number(
                              expires_in || 3600
                        ) - 30,

                        60

                  ) * 1000;


            return historicalAccessToken;

      };


// =====================================================
// FORMAT TRUE DATA DATE
// =====================================================

const formatTrueDataDate = (
      date
) => {

      const formatter =
            new Intl.DateTimeFormat(

                  "en-GB",

                  {

                        timeZone:
                              "Asia/Kolkata",

                        year: "2-digit",

                        month: "2-digit",

                        day: "2-digit",

                        hour: "2-digit",

                        minute: "2-digit",

                        second: "2-digit",

                        hourCycle: "h23",

                  }

            );


      const parts =
            formatter
                  .formatToParts(date)
                  .reduce(

                        (
                              result,
                              part
                        ) => {

                              result[
                                    part.type
                              ] =
                                    part.value;

                              return result;

                        },

                        {}

                  );


      return (

            `${parts.year}` +
            `${parts.month}` +
            `${parts.day}` +
            `T` +
            `${parts.hour}` +
            `:${parts.minute}` +
            `:${parts.second}`

      );

};


// =====================================================
// HISTORICAL RANGE CONFIG
// =====================================================

const getHistoricalRangeConfig =
      (range) => {

            const now =
                  new Date();


            switch (range) {

                  // -------------------------------------------------
                  // 1 MONTH
                  // -------------------------------------------------

                  case "1M": {

                        const from =
                              new Date(now);


                        from.setMonth(
                              from.getMonth() - 1
                        );


                        return {

                              from,

                              interval:
                                    "15min",

                        };

                  }


                  // -------------------------------------------------
                  // 1 YEAR
                  // -------------------------------------------------

                  case "1Y": {

                        const from =
                              new Date(now);


                        from.setFullYear(
                              from.getFullYear() - 1
                        );


                        return {

                              from,

                              interval:
                                    "eod",

                        };

                  }


                  // -------------------------------------------------
                  // 5 YEARS
                  // -------------------------------------------------

                  case "5Y": {

                        const from =
                              new Date(now);


                        from.setFullYear(
                              from.getFullYear() - 5
                        );


                        return {

                              from,

                              interval:
                                    "eod",

                        };

                  }


                  // -------------------------------------------------
                  // 10 YEARS
                  // -------------------------------------------------

                  case "10Y": {

                        const from =
                              new Date(now);


                        from.setFullYear(
                              from.getFullYear() - 10
                        );


                        return {

                              from,

                              interval:
                                    "eod",

                        };

                  }


                  // -------------------------------------------------
                  // MAX
                  // -------------------------------------------------

                  case "MAX": {

                        const from =
                              new Date(
                                    "2000-01-01T00:00:00"
                              );


                        return {

                              from,

                              interval:
                                    "eod",

                        };

                  }


                  default:

                        throw new Error(
                              `Unsupported historical range: ${range}`
                        );

            }

      };


// =====================================================
// GET HISTORICAL MARKET PRICES
// =====================================================

export const getHistoricalMarketPrices =
      async (
            symbol,
            range = "1M"
      ) => {

            const normalizedSymbol =
                  normalizeSymbol(
                        symbol
                  );


            // -------------------------------------------------
            // RANGE
            // -------------------------------------------------

            const {
                  from,
                  interval,
            } =
                  getHistoricalRangeConfig(
                        range
                  );


            // -------------------------------------------------
            // TOKEN
            // -------------------------------------------------

            const accessToken =
                  await getHistoricalAccessToken();


            // -------------------------------------------------
            // DATES
            // -------------------------------------------------

            const fromDate =
                  formatTrueDataDate(
                        from
                  );


            const toDate =
                  formatTrueDataDate(
                        new Date()
                  );


            // -------------------------------------------------
            // API REQUEST
            // -------------------------------------------------

            const response =
                  await axios.get(

                        `${HISTORY_BASE_URL}/getbars`,

                        {

                              headers: {

                                    Authorization:
                                          `Bearer ${accessToken}`,

                              },


                              params: {

                                    symbol:
                                          normalizedSymbol,

                                    from:
                                          fromDate,

                                    to:
                                          toDate,

                                    response:
                                          "json",

                                    interval,

                              },


                              timeout:
                                    15000,

                        }

                  );


            // -------------------------------------------------
            // RESPONSE RECORDS
            // -------------------------------------------------

            const records =

                  response.data?.Records ||

                  response.data?.records ||

                  [];


            if (
                  !Array.isArray(records) ||
                  records.length === 0
            ) {

                  throw new Error(
                        `Historical price data not found for ${normalizedSymbol}`
                  );

            }


            // -------------------------------------------------
            // FORMAT RESPONSE
            // -------------------------------------------------

            const historicalData =
                  records

                        .map(
                              (record) => {

                                    if (
                                          !Array.isArray(record) ||
                                          record.length < 5
                                    ) {

                                          return null;

                                    }


                                    const time =
                                          record[0];


                                    const close =
                                          Number(
                                                record[4]
                                          );


                                    if (
                                          !time ||
                                          !Number.isFinite(close) ||
                                          close <= 0
                                    ) {

                                          return null;

                                    }


                                    return {

                                          time,

                                          price:
                                                Number(
                                                      close.toFixed(2)
                                                ),

                                    };

                              }
                        )

                        .filter(Boolean);


            if (
                  historicalData.length === 0
            ) {

                  throw new Error(
                        `Valid historical price data not found for ${normalizedSymbol}`
                  );

            }


            // -------------------------------------------------
            // OLDEST → NEWEST
            // -------------------------------------------------

            historicalData.sort(

                  (a, b) =>

                        new Date(a.time) -
                        new Date(b.time)

            );


            return historicalData;

      };


// =====================================================
// START TRUE DATA
// =====================================================

connectTrueData();

// Clean up socket gracefully on exit to prevent "User Already Connected"
const gracefulShutdown = () => {
      console.log("Shutting down TrueData connection gracefully...");
      disconnectTrueData();
      process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown); // For nodemon restarts