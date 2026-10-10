import axios from "axios";

const API_BASE = "http://localhost:3000/api/tournaments";

const withCreds = { withCredentials: true };

export const listTournaments = async (params = {}) => {
  const res = await axios.get(API_BASE, { ...withCreds, params });
  return res.data;
};

export const getTournamentDetails = async (id) => {
  const res = await axios.get(`${API_BASE}/${id}`, withCreds);
  return res.data.data;
};

export const joinTournament = async (id, inviteCode = null) => {
  const body = inviteCode ? { inviteCode } : {};
  const res = await axios.post(`${API_BASE}/${id}/join`, body, withCreds);
  return res.data;
};

export const leaveTournament = async (id) => {
  const res = await axios.delete(`${API_BASE}/${id}/leave`, withCreds);
  return res.data;
};

export const getMyParticipation = async (id) => {
  const res = await axios.get(`${API_BASE}/${id}/my-participation`, withCreds);
  return res.data.data;
};

export const getTournamentLeaderboard = async (id, page = 1, limit = 20) => {
  const res = await axios.get(`${API_BASE}/${id}/leaderboard`, {
    ...withCreds,
    params: { page, limit },
  });
  return res.data.data;
};

export const placeTrade = async (id, orderData) => {
  const res = await axios.post(`${API_BASE}/${id}/trades`, orderData, withCreds);
  return res.data;
};

export const cancelOrder = async (id, orderId) => {
  const res = await axios.patch(
    `${API_BASE}/${id}/orders/${orderId}/cancel`,
    {},
    withCreds
  );
  return res.data;
};

export const getTournamentOrders = async (id) => {
  const res = await axios.get(`${API_BASE}/${id}/orders`, withCreds);
  return res.data.data;
};

export const getMyTournamentHistory = async () => {
  const res = await axios.get(`${API_BASE}/my-history`, withCreds);
  return res.data.data;
};
