import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api/journal";

export const getJournalEntries = async (params = {}) => {
  const res = await axios.get(API_BASE_URL, { params, withCredentials: true });
  return res.data;
};

export const createJournalEntry = async (entryData) => {
  const res = await axios.post(API_BASE_URL, entryData, { withCredentials: true });
  return res.data.data;
};

export const getJournalEntryById = async (id) => {
  const res = await axios.get(`${API_BASE_URL}/${id}`, { withCredentials: true });
  return res.data.data;
};

export const updateJournalEntry = async (id, updateData) => {
  const res = await axios.patch(`${API_BASE_URL}/${id}`, updateData, { withCredentials: true });
  return res.data.data;
};

export const deleteJournalEntry = async (id) => {
  const res = await axios.delete(`${API_BASE_URL}/${id}`, { withCredentials: true });
  return res.data;
};

export const getJournalCalendar = async (year, month) => {
  const res = await axios.get(`${API_BASE_URL}/calendar`, {
    params: { year, month },
    withCredentials: true,
  });
  return res.data.data;
};

export const getJournalAnalytics = async () => {
  const res = await axios.get(`${API_BASE_URL}/analytics`, { withCredentials: true });
  return res.data.data;
};
