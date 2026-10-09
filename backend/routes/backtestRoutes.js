import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
  getAvailableStrategies,
  runBacktestSimulation,
  saveBacktestRun,
  getSavedBacktestHistory,
  getSavedBacktestRunById,
  deleteSavedBacktestRun,
} from "../controller/backtestController.js";

const router = express.Router();

router.get("/strategies", isLoggedIn, getAvailableStrategies);
router.post("/run", isLoggedIn, runBacktestSimulation);
router.post("/save", isLoggedIn, saveBacktestRun);
router.get("/history", isLoggedIn, getSavedBacktestHistory);
router.get("/history/:id", isLoggedIn, getSavedBacktestRunById);
router.delete("/history/:id", isLoggedIn, deleteSavedBacktestRun);

export default router;
