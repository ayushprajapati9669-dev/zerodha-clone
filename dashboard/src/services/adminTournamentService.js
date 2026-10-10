import axios from "axios";

const API_BASE = "http://localhost:3000/api/tournaments";
const withCreds = { withCredentials: true };

/**
 * Fetch list of tournaments with admin filters and stats
 */
export const adminListTournaments = async (params = {}) => {
  const res = await axios.get(`${API_BASE}/admin/tournaments`, {
    ...withCreds,
    params,
  });
  return res.data;
};

/**
 * Get detailed tournament info for admin
 */
export const adminGetTournamentDetails = async (id) => {
  const res = await axios.get(`${API_BASE}/admin/tournaments/${id}`, withCreds);
  return res.data.data;
};

/**
 * Create a new tournament
 */
export const adminCreateTournament = async (tournamentData) => {
  const res = await axios.post(`${API_BASE}/admin/create`, tournamentData, withCreds);
  return res.data;
};

/**
 * Update tournament metadata
 */
export const adminUpdateTournament = async (id, updateData) => {
  const res = await axios.put(`${API_BASE}/admin/tournaments/${id}`, updateData, withCreds);
  return res.data;
};

/**
 * Update tournament lifecycle status (e.g. upcoming -> active, active -> completed, cancelled)
 */
export const adminUpdateTournamentStatus = async (id, status) => {
  const res = await axios.patch(
    `${API_BASE}/admin/tournaments/${id}/status`,
    { status },
    withCreds
  );
  return res.data;
};

/**
 * Get tournament participants (read-only for admin)
 */
export const adminGetTournamentParticipants = async (id, params = {}) => {
  const res = await axios.get(`${API_BASE}/admin/tournaments/${id}/participants`, {
    ...withCreds,
    params,
  });
  return res.data;
};

/**
 * Get tournament orders (read-only for admin)
 */
export const adminGetTournamentOrders = async (id, params = {}) => {
  const res = await axios.get(`${API_BASE}/admin/tournaments/${id}/orders`, {
    ...withCreds,
    params,
  });
  return res.data;
};

/**
 * Disqualify a participant
 */
export const adminDisqualifyParticipant = async (id, participationId, reason) => {
  const res = await axios.patch(
    `${API_BASE}/admin/tournaments/${id}/participants/${participationId}/disqualify`,
    { reason },
    withCreds
  );
  return res.data;
};

/**
 * Seed demo tournaments (development only)
 */
export const adminSeedTournaments = async () => {
  const res = await axios.post(`${API_BASE}/admin/seed`, {}, withCreds);
  return res.data;
};
