import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/backtest";

export const getAvailableStrategies = async () => {
  const res = await axios.get(`${API_BASE_URL}/strategies`, { withCredentials: true });
  return res.data.data;
};

export const runBacktestSimulation = async (config) => {
  const res = await axios.post(`${API_BASE_URL}/run`, config, { withCredentials: true });
  return res.data.data;
};

export const saveBacktestRun = async (backtestData) => {
  const res = await axios.post(`${API_BASE_URL}/save`, backtestData, { withCredentials: true });
  return res.data.data;
};

export const getSavedBacktestHistory = async (page = 1, limit = 10) => {
  const res = await axios.get(`${API_BASE_URL}/history`, {
    params: { page, limit },
    withCredentials: true,
  });
  return res.data;
};

export const getSavedBacktestRunById = async (id) => {
  const res = await axios.get(`${API_BASE_URL}/history/${id}`, { withCredentials: true });
  return res.data.data;
};

export const deleteSavedBacktestRun = async (id) => {
  const res = await axios.delete(`${API_BASE_URL}/history/${id}`, { withCredentials: true });
  return res.data;
};
