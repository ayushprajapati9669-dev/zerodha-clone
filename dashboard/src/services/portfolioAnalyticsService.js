import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/analytics";

// Configure axios instance with credentials for cookies
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const getAnalyticsSummary = async () => {
  const response = await api.get("/summary");
  return response.data;
};

export const getPerformanceHistory = async (range = "1M") => {
  const response = await api.get("/performance", {
    params: { range },
  });
  return response.data;
};

export const getPnLBreakdown = async (symbol = null) => {
  const params = {};
  if (symbol) {
    params.symbol = symbol;
  }
  const response = await api.get("/pnl-breakdown", { params });
  return response.data;
};

export const getStockRankings = async () => {
  const response = await api.get("/stock-rankings");
  return response.data;
};
