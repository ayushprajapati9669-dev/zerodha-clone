import PriceAlert from "../models/PriceAlertModel.js";
import Notification from "../models/NotificationModel.js";
import { emitNewNotification } from "../utils/notificationSocket.js";

const normalizeSymbol = (symbol) =>
      String(symbol || "")
            .trim()
            .toUpperCase()
            .replace(/^(NSE:|BSE:)/i, "");

// ==================================================
// GET ALERTS  –  GET /api/price-alerts
// ==================================================
export const getAlerts = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { active } = req.query; // ?active=true|false|all

            const filter = { userId };
            if (active === "true") filter.isActive = true;
            else if (active === "false") filter.isActive = false;

            const alerts = await PriceAlert.find(filter)
                  .sort({ createdAt: -1 })
                  .lean();

            return res.status(200).json({ success: true, alerts });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// CREATE ALERT  –  POST /api/price-alerts
// ==================================================
export const createAlert = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { symbol, companyName, condition, targetPrice } = req.body;

            if (!symbol) {
                  return res.status(400).json({ success: false, message: "Symbol is required." });
            }
            if (!companyName) {
                  return res.status(400).json({ success: false, message: "Company name is required." });
            }
            if (!["above", "below"].includes(condition)) {
                  return res.status(400).json({ success: false, message: "Condition must be 'above' or 'below'." });
            }
            const price = Number(targetPrice);
            if (!Number.isFinite(price) || price <= 0) {
                  return res.status(400).json({ success: false, message: "Target price must be a positive number." });
            }

            const normalizedSymbol = normalizeSymbol(symbol);

            // Limit: max 20 active alerts per user
            const activeCount = await PriceAlert.countDocuments({ userId, isActive: true });
            if (activeCount >= 20) {
                  return res.status(400).json({ success: false, message: "You can have at most 20 active price alerts." });
            }

            const alert = await PriceAlert.create({
                  userId,
                  symbol: normalizedSymbol,
                  companyName: companyName.trim(),
                  condition,
                  targetPrice: price,
            });

            return res.status(201).json({ success: true, alert });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// UPDATE ALERT  –  PATCH /api/price-alerts/:alertId
// ==================================================
export const updateAlert = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { alertId } = req.params;
            const { condition, targetPrice, isActive } = req.body;

            const alert = await PriceAlert.findOne({ _id: alertId, userId });
            if (!alert) {
                  return res.status(404).json({ success: false, message: "Alert not found." });
            }

            if (condition !== undefined) {
                  if (!["above", "below"].includes(condition)) {
                        return res.status(400).json({ success: false, message: "Condition must be 'above' or 'below'." });
                  }
                  alert.condition = condition;
            }

            if (targetPrice !== undefined) {
                  const price = Number(targetPrice);
                  if (!Number.isFinite(price) || price <= 0) {
                        return res.status(400).json({ success: false, message: "Target price must be a positive number." });
                  }
                  alert.targetPrice = price;
            }

            if (isActive !== undefined) {
                  alert.isActive = Boolean(isActive);
            }

            // Editing an alert resets the trigger state so it can fire again
            if (condition !== undefined || targetPrice !== undefined) {
                  alert.isTriggered = false;
                  alert.triggeredAt = null;
                  alert.triggeredPrice = null;
            }

            await alert.save();

            return res.status(200).json({ success: true, alert });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// DELETE ALERT  –  DELETE /api/price-alerts/:alertId
// ==================================================
export const deleteAlert = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { alertId } = req.params;

            const alert = await PriceAlert.findOneAndDelete({ _id: alertId, userId });
            if (!alert) {
                  return res.status(404).json({ success: false, message: "Alert not found." });
            }

            return res.status(200).json({ success: true, message: "Alert deleted." });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// EVALUATE ALERTS FOR A TICK  (called by trueDataService / market tick handler)
// NOT an HTTP handler — called internally.
// ==================================================
export const evaluateAlerts = async (symbol, currentPrice) => {
      if (!symbol || !Number.isFinite(currentPrice) || currentPrice <= 0) return;

      const normalizedSymbol = normalizeSymbol(symbol);

      // Find active, untriggered alerts for this symbol
      const alerts = await PriceAlert.find({
            symbol: normalizedSymbol,
            isActive: true,
            isTriggered: false,
      }).lean();

      if (!alerts.length) return;

      const triggered = alerts.filter((alert) => {
            if (alert.condition === "above") return currentPrice >= alert.targetPrice;
            if (alert.condition === "below") return currentPrice <= alert.targetPrice;
            return false;
      });

      if (!triggered.length) return;

      // Bulk-mark triggered to prevent duplicate notifications
      const triggeredIds = triggered.map((a) => a._id);
      await PriceAlert.updateMany(
            { _id: { $in: triggeredIds } },
            {
                  $set: {
                        isTriggered: true,
                        triggeredAt: new Date(),
                        triggeredPrice: currentPrice,
                  },
            }
      );

      // Create one notification per alert and push via Socket.IO
      for (const alert of triggered) {
            try {
                  const direction = alert.condition === "above" ? "crossed above" : "crossed below";
                  const notification = await Notification.create({
                        userId: alert.userId,
                        type: "price_alert",
                        event: "price_alert_triggered",
                        title: `Price Alert: ${alert.symbol}`,
                        message: `${alert.symbol} has ${direction} ₹${alert.targetPrice.toLocaleString("en-IN")}. Current price: ₹${currentPrice.toLocaleString("en-IN")}.`,
                        priority: "high",
                        metadata: {
                              symbol: alert.symbol,
                              companyName: alert.companyName,
                              condition: alert.condition,
                              targetPrice: alert.targetPrice,
                              triggeredPrice: currentPrice,
                        },
                  });

                  // Emit to the user's private Socket.IO room
                  emitNewNotification(notification);
            } catch (err) {
                  console.error(`Failed to create price alert notification for ${alert.symbol}:`, err.message);
            }
      }
};
