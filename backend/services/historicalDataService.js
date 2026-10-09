import { getTrueDataHistoricalPrices } from "./trueDataHistoricalService.js";
import axios from "axios";

const AUTH_URL = "https://auth.truedata.in/token";
const HISTORY_BASE_URL = "https://history.truedata.in";

const username = process.env.TRUEDATA_USERNAME;
const password = process.env.TRUEDATA_PASSWORD;

let cachedAccessToken = null;
let tokenExpiryTime = 0;

const getAccessToken = async () => {
  if (cachedAccessToken && Date.now() < tokenExpiryTime) {
    return cachedAccessToken;
  }
  if (!username || !password) {
    throw new Error("TrueData credentials missing in environment variables.");
  }
  const res = await axios.post(
    AUTH_URL,
    new URLSearchParams({ username, password, grant_type: "password" }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  cachedAccessToken = res.data?.access_token;
  const expiresIn = Number(res.data?.expires_in || 3600);
  tokenExpiryTime = Date.now() + Math.max(expiresIn - 60, 1) * 1000;
  return cachedAccessToken;
};

/**
 * Format Date to YYYYMMDD string
 */
const formatDateToTrueData = (date) => {
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
};

/**
 * Fetches and validates genuine historical OHLC candles from TrueData API for backtesting
 * 
 * @param {Object} params
 * @param {string} params.symbol - Stock symbol (e.g. RELIANCE)
 * @param {string} params.fromDate - Start date (YYYY-MM-DD)
 * @param {string} params.toDate - End date (YYYY-MM-DD)
 * @param {string} params.interval - Candle interval ('15min', 'eod', '1min', '5min', '60min')
 * @returns {Promise<Array<Object>>} Array of chronological candles: [{ time, open, high, low, close, volume }]
 */
export const getTrueDataHistoricalCandles = async ({
  symbol,
  fromDate,
  toDate,
  interval = "15min",
}) => {
  const sym = String(symbol || "").trim().toUpperCase();
  if (!sym) {
    throw new Error("Stock symbol is required for backtesting.");
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start or end date format. Use YYYY-MM-DD.");
  }
  if (start >= end) {
    throw new Error("Start date must be earlier than end date.");
  }

  const validIntervals = ["1min", "5min", "15min", "60min", "eod", "1day"];
  let apiInterval = interval.toLowerCase();
  if (apiInterval === "1day") apiInterval = "eod";
  if (!validIntervals.includes(apiInterval)) {
    throw new Error(`Unsupported interval '${interval}'. Supported: 1min, 5min, 15min, 60min, eod.`);
  }

  const formattedFrom = `${formatDateToTrueData(start)}T09:15:00`;
  const formattedTo = `${formatDateToTrueData(end)}T15:30:00`;

  let records = [];

  try {
    const token = await getAccessToken();
    const response = await axios.get(`${HISTORY_BASE_URL}/getbars`, {
      params: {
        symbol: sym,
        from: formattedFrom,
        to: formattedTo,
        response: "json",
        interval: apiInterval,
      },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 35000,
    });

    records = response.data?.Records;
  } catch (err) {
    console.error(`TrueData API error for ${sym}:`, err.response?.data || err.message);
    throw new Error(`Failed to fetch genuine TrueData historical candles for ${sym}: ${err.message}`);
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(`No historical market candles returned by TrueData for ${sym} in range ${fromDate} to ${toDate}.`);
  }

  // Parse and validate OHLC records
  const candles = [];
  const timeSet = new Set();

  for (const rec of records) {
    const [time, open, high, low, close, volume] = rec;
    const numOpen = Number(open);
    const numHigh = Number(high);
    const numLow = Number(low);
    const numClose = Number(close);

    if (!time || isNaN(numOpen) || isNaN(numClose) || numOpen <= 0 || numClose <= 0) {
      continue;
    }

    if (timeSet.has(time)) {
      continue; // Skip duplicate candles
    }
    timeSet.add(time);

    candles.push({
      time: String(time),
      open: Number(numOpen.toFixed(2)),
      high: Number((numHigh || Math.max(numOpen, numClose)).toFixed(2)),
      low: Number((numLow || Math.min(numOpen, numClose)).toFixed(2)),
      close: Number(numClose.toFixed(2)),
      volume: Number(volume || 0),
    });
  }

  // Sort chronologically (oldest to newest)
  candles.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  if (candles.length < 10) {
    throw new Error(`Insufficient historical candles (${candles.length}) retrieved for strategy execution.`);
  }

  return candles;
};
