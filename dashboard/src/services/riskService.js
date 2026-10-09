import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/risk";

export const getRiskOverview = async () => {
  const res = await axios.get(`${API_BASE_URL}/overview`, { withCredentials: true });
  return res.data.data;
};

export const getRiskSettings = async () => {
  const res = await axios.get(`${API_BASE_URL}/settings`, { withCredentials: true });
  return res.data.data;
};

export const updateRiskSettings = async (settingsData) => {
  const res = await axios.put(`${API_BASE_URL}/settings`, settingsData, { withCredentials: true });
  return res.data.data;
};

export const checkOrderRisk = async (orderData) => {
  const res = await axios.post(`${API_BASE_URL}/check-order`, orderData, { withCredentials: true });
  return res.data.data;
};

export const getRiskAlerts = async () => {
  const res = await axios.get(`${API_BASE_URL}/alerts`, { withCredentials: true });
  return res.data.data;
};

export const markAlertAsRead = async (alertId) => {
  const res = await axios.patch(`${API_BASE_URL}/alerts/${alertId}/read`, {}, { withCredentials: true });
  return res.data.data;
};

export const calculateRiskReward = async (calcData) => {
  const res = await axios.post(`${API_BASE_URL}/calculate`, calcData, { withCredentials: true });
  return res.data.data;
};
