import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
  getJournalEntries,
  createJournalEntry,
  getJournalEntryById,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalCalendar,
  getJournalAnalytics,
} from "../controller/journalController.js";

const router = express.Router();

router.get("/", isLoggedIn, getJournalEntries);
router.post("/", isLoggedIn, createJournalEntry);
router.get("/calendar", isLoggedIn, getJournalCalendar);
router.get("/analytics", isLoggedIn, getJournalAnalytics);
router.get("/:id", isLoggedIn, getJournalEntryById);
router.patch("/:id", isLoggedIn, updateJournalEntry);
router.delete("/:id", isLoggedIn, deleteJournalEntry);

export default router;
