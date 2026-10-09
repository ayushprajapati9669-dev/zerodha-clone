import {
  getAvailableStrategiesService,
  runBacktestSimulationService,
  saveBacktestRunService,
  getSavedBacktestHistoryService,
  getSavedBacktestRunByIdService,
  deleteSavedBacktestRunService,
} from "../services/backtestService.js";

export const getAvailableStrategies = async (req, res) => {
  try {
    const strategies = getAvailableStrategiesService();
    return res.status(200).json({ success: true, data: strategies });
  } catch (err) {
    console.error("Error in getAvailableStrategies:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const runBacktestSimulation = async (req, res) => {
  try {
    const result = await runBacktestSimulationService(req.body);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error in runBacktestSimulation:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const saveBacktestRun = async (req, res) => {
  try {
    const userId = req.user.userId;
    const saved = await saveBacktestRunService(userId, req.body);
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("Error in saveBacktestRun:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

export const getSavedBacktestHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const result = await getSavedBacktestHistoryService(userId, page, limit);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("Error in getSavedBacktestHistory:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getSavedBacktestRunById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const run = await getSavedBacktestRunByIdService(userId, req.params.id);
    return res.status(200).json({ success: true, data: run });
  } catch (err) {
    console.error("Error in getSavedBacktestRunById:", err);
    return res.status(404).json({ success: false, message: err.message });
  }
};

export const deleteSavedBacktestRun = async (req, res) => {
  try {
    const userId = req.user.userId;
    await deleteSavedBacktestRunService(userId, req.params.id);
    return res.status(200).json({ success: true, message: "Saved backtest run deleted successfully" });
  } catch (err) {
    console.error("Error in deleteSavedBacktestRun:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};
