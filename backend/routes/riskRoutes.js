import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
  getRiskOverview,
  getRiskSettings,
  updateRiskSettings,
  checkOrderRisk,
  getRiskAlerts,
  markAlertAsRead,
  calculateRiskReward,
} from "../controller/riskController.js";

const router = express.Router();

router.get("/overview", isLoggedIn, getRiskOverview);
router.get("/settings", isLoggedIn, getRiskSettings);
router.put("/settings", isLoggedIn, updateRiskSettings);
router.post("/check-order", isLoggedIn, checkOrderRisk);
router.get("/alerts", isLoggedIn, getRiskAlerts);
router.patch("/alerts/:id/read", isLoggedIn, markAlertAsRead);
router.post("/calculate", isLoggedIn, calculateRiskReward);

export default router;
