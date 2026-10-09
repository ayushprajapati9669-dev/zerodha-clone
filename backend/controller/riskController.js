import {
  getRiskOverviewService,
  getOrCreateRiskSettings,
  updateRiskSettingsService,
  evaluateOrderRiskService,
  getRiskAlertsService,
  markAlertAsReadService,
  calculateRiskRewardService,
} from "../services/riskService.js";

/**
 * GET /api/risk/overview
 */
export const getRiskOverview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const overview = await getRiskOverviewService(userId);
    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Error in getRiskOverview:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch risk overview",
      error: error.message,
    });
  }
};

/**
 * GET /api/risk/settings
 */
export const getRiskSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = await getOrCreateRiskSettings(userId);
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error in getRiskSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch risk settings",
      error: error.message,
    });
  }
};

/**
 * PUT /api/risk/settings
 */
export const updateRiskSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updated = await updateRiskSettingsService(userId, req.body);
    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error in updateRiskSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update risk settings",
      error: error.message,
    });
  }
};

/**
 * POST /api/risk/check-order
 */
export const checkOrderRisk = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { symbol, type, quantity, orderType, price, product, stopLossPrice, targetPrice } = req.body;

    if (!symbol || !type || !quantity || !orderType || !price) {
      return res.status(400).json({
        success: false,
        message: "Missing required order fields (symbol, type, quantity, orderType, price)",
      });
    }

    const evaluation = await evaluateOrderRiskService(userId, {
      symbol,
      type,
      quantity: Number(quantity),
      orderType,
      price: Number(price),
      product: product || "CNC",
      stopLossPrice,
      targetPrice,
    });

    return res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error("Error in checkOrderRisk:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to evaluate order risk",
      error: error.message,
    });
  }
};

/**
 * GET /api/risk/alerts
 */
export const getRiskAlerts = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alerts = await getRiskAlertsService(userId);
    return res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Error in getRiskAlerts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch risk alerts",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/risk/alerts/:id/read
 */
export const markAlertAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertId = req.params.id;

    const updatedAlert = await markAlertAsReadService(userId, alertId);
    if (!updatedAlert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found or access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedAlert,
    });
  } catch (error) {
    console.error("Error in markAlertAsRead:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark alert as read",
      error: error.message,
    });
  }
};

/**
 * POST /api/risk/calculate
 */
export const calculateRiskReward = async (req, res) => {
  try {
    const { entryPrice, quantity, stopLossPrice, targetPrice, type } = req.body;
    const result = calculateRiskRewardService({
      entryPrice,
      quantity,
      stopLossPrice,
      targetPrice,
      type,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in calculateRiskReward:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate risk reward metrics",
      error: error.message,
    });
  }
};
