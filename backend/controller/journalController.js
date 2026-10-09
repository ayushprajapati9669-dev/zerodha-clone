import {
  getJournalEntriesService,
  createJournalEntryService,
  getJournalEntryByIdService,
  updateJournalEntryService,
  deleteJournalEntryService,
  getJournalCalendarService,
  getJournalAnalyticsService,
} from "../services/journalService.js";

export const getJournalEntries = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await getJournalEntriesService(userId, req.query);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("Error in getJournalEntries:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const createJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const entry = await createJournalEntryService(userId, req.body);
    return res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error("Error in createJournalEntry:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getJournalEntryById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const entry = await getJournalEntryByIdService(userId, req.params.id);
    return res.status(200).json({ success: true, data: entry });
  } catch (err) {
    console.error("Error in getJournalEntryById:", err);
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const updateJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updated = await updateJournalEntryService(userId, req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("Error in updateJournalEntry:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId;
    await deleteJournalEntryService(userId, req.params.id);
    return res.status(200).json({ success: true, message: "Journal entry deleted successfully" });
  } catch (err) {
    console.error("Error in deleteJournalEntry:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getJournalCalendar = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;
    const calendar = await getJournalCalendarService(userId, year, month);
    return res.status(200).json({ success: true, data: calendar });
  } catch (err) {
    console.error("Error in getJournalCalendar:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getJournalAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const analytics = await getJournalAnalyticsService(userId);
    return res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error("Error in getJournalAnalytics:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
