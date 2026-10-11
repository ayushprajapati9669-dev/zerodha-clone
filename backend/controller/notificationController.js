
import mongoose from "mongoose";
import Notification from "../models/NotificationModel.js";
import NotificationPreference from "../models/NotificationPreferenceModel.js";
import {
      emitNotificationUpdate,
      emitNotificationDeleted,
      emitNotificationsReadAll,
} from "../utils/notificationSocket.js";

const ALLOWED_TYPES = [
      "order",
      "fund",
      "system",
      "price_alert",
      "tournament",
];

const getUserId = (req) => req.user.userId;

// Validates category and builds a user-scoped filter.
const buildNotificationFilter = (userId, type = "all") => {
      const filter = { userId };

      if (type === "all") {
            return filter;
      }

      if (!ALLOWED_TYPES.includes(type)) {
            const error = new Error("Invalid notification category");
            error.statusCode = 400;
            throw error;
      }

      filter.type = type;
      return filter;
};

// GET NOTIFICATIONS
export const getNotifications = async (req, res, next) => {
      try {
            const userId = getUserId(req);
            const {
                  page = 1,
                  limit = 10,
                  type = "all",
                  unread = "false",
            } = req.query;

            if (!["true", "false", true, false].includes(unread)) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid unread filter",
                  });
            }

            const pageNumber = Math.max(Number(page) || 1, 1);
            const limitNumber = Math.min(
                  Math.max(Number(limit) || 10, 1),
                  50
            );

            if (!Number.isFinite(pageNumber) || !Number.isFinite(limitNumber)) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid pagination parameters",
                  });
            }

            const filter = buildNotificationFilter(userId, type);

            if (unread === "true" || unread === true) {
                  filter.isRead = false;
            }

            const skip = (pageNumber - 1) * limitNumber;

            const [notifications, total, unreadCount] = await Promise.all([
                  Notification.find(filter)
                        .sort({ createdAt: -1, _id: -1 })
                        .skip(skip)
                        .limit(limitNumber)
                        .lean(),

                  Notification.countDocuments(filter),

                  Notification.countDocuments({
                        userId,
                        isRead: false,
                  }),
            ]);

            return res.status(200).json({
                  success: true,
                  notifications,
                  pagination: {
                        page: pageNumber,
                        limit: limitNumber,
                        total,
                        totalPages: Math.ceil(total / limitNumber),
                        hasMore: skip + notifications.length < total,
                  },
                  unreadCount,
            });
      } catch (error) {
            if (error.statusCode === 400) {
                  return res.status(400).json({
                        success: false,
                        message: error.message,
                  });
            }

            next(error);
      }
};

// GET UNREAD COUNT
export const getUnreadNotificationCount = async (req, res, next) => {
      try {
            const userId = getUserId(req);

            const unreadCount = await Notification.countDocuments({
                  userId,
                  isRead: false,
            });

            return res.status(200).json({
                  success: true,
                  unreadCount,
            });
      } catch (error) {
            next(error);
      }
};

// MARK ONE AS READ
export const markNotificationAsRead = async (req, res, next) => {
      try {
            const { id } = req.params;
            const userId = getUserId(req);

            if (!mongoose.isValidObjectId(id)) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid notification ID",
                  });
            }

            const notification = await Notification.findOneAndUpdate(
                  {
                        _id: id,
                        userId,
                  },
                  {
                        $set: { isRead: true },
                  },
                  {
                        new: true,
                        runValidators: true,
                  }
            );

            if (!notification) {
                  return res.status(404).json({
                        success: false,
                        message: "Notification not found",
                  });
            }

            emitNotificationUpdate(userId, notification);

            return res.status(200).json({
                  success: true,
                  notification,
            });
      } catch (error) {
            next(error);
      }
};

// MARK ALL AS READ
// Pass { type: "tournament" } to affect only tournament notifications.
export const markAllNotificationsAsRead = async (req, res, next) => {
      try {
            const userId = getUserId(req);
            const type = req.body?.type || "all";

            const filter = buildNotificationFilter(userId, type);
            filter.isRead = false;

            const result = await Notification.updateMany(
                  filter,
                  {
                        $set: { isRead: true },
                  }
            );

            emitNotificationsReadAll(userId);

            return res.status(200).json({
                  success: true,
                  message: "Notifications marked as read",
                  modifiedCount: result.modifiedCount,
            });
      } catch (error) {
            if (error.statusCode === 400) {
                  return res.status(400).json({
                        success: false,
                        message: error.message,
                  });
            }

            next(error);
      }
};

// DELETE ONE
export const deleteNotification = async (req, res, next) => {
      try {
            const { id } = req.params;
            const userId = getUserId(req);

            if (!mongoose.isValidObjectId(id)) {
                  return res.status(400).json({
                        success: false,
                        message: "Invalid notification ID",
                  });
            }

            const notification = await Notification.findOneAndDelete({
                  _id: id,
                  userId,
            });

            if (!notification) {
                  return res.status(404).json({
                        success: false,
                        message: "Notification not found",
                  });
            }

            emitNotificationDeleted(userId, id);

            return res.status(200).json({
                  success: true,
                  message: "Notification deleted successfully",
            });
      } catch (error) {
            next(error);
      }
};

// DELETE ALL
// Pass { type: "tournament" } to delete only tournament notifications.
export const deleteAllNotifications = async (req, res, next) => {
      try {
            const userId = getUserId(req);
            const type = req.body?.type || "all";

            const filter = buildNotificationFilter(userId, type);

            const result = await Notification.deleteMany(filter);

            emitNotificationsReadAll(userId);

            return res.status(200).json({
                  success: true,
                  message: "Notifications deleted successfully",
                  deletedCount: result.deletedCount,
            });
      } catch (error) {
            if (error.statusCode === 400) {
                  return res.status(400).json({
                        success: false,
                        message: error.message,
                  });
            }

            next(error);
      }
};

// GET PREFERENCES
export const getNotificationPreferences = async (req, res, next) => {
      try {
            const userId = getUserId(req);

            let preferences = await NotificationPreference.findOne({ userId });

            if (!preferences) {
                  preferences = await NotificationPreference.create({ userId });
            }

            return res.status(200).json({
                  success: true,
                  preferences,
            });
      } catch (error) {
            next(error);
      }
};

// UPDATE PREFERENCES
export const updateNotificationPreferences = async (req, res, next) => {
      try {
            const userId = getUserId(req);

            const allowedFields = [
                  "orderPlaced",
                  "orderExecuted",
                  "orderCancelled",
                  "fundAdded",
                  "fundWithdrawn",
                  "system",
                  "security",
            ];

            const updateData = {};

            for (const field of allowedFields) {
                  if (typeof req.body?.[field] === "boolean") {
                        updateData[field] = req.body[field];
                  }
            }

            if (Object.keys(updateData).length === 0) {
                  return res.status(400).json({
                        success: false,
                        message: "No valid notification preference provided",
                  });
            }

            const preferences = await NotificationPreference.findOneAndUpdate(
                  { userId },
                  { $set: updateData },
                  {
                        new: true,
                        upsert: true,
                        setDefaultsOnInsert: true,
                        runValidators: true,
                  }
            );

            return res.status(200).json({
                  success: true,
                  preferences,
            });
      } catch (error) {
            next(error);
      }
};
