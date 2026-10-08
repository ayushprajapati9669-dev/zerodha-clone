import { io } from "../index.js";

export const emitNewNotification = (notification) => {
      if (!notification) {
            return;
      }

      const userId = notification.userId?.toString();

      if (!userId) {
            return;
      }

      io.to(`user:${userId}`).emit(
            "new-notification",
            notification,
      );
};

export const emitNotificationUpdate = (
      userId,
      notification,
) => {
      if (!userId) {
            return;
      }

      io.to(`user:${userId.toString()}`).emit(
            "notification:updated",
            notification,
      );
};

export const emitNotificationDeleted = (
      userId,
      notificationId,
) => {
      if (!userId) {
            return;
      }

      io.to(`user:${userId.toString()}`).emit(
            "notification:deleted",
            {
                  notificationId,
            },
      );
};

export const emitNotificationsReadAll = (userId) => {
      if (!userId) {
            return;
      }

      io.to(`user:${userId.toString()}`).emit(
            "notification:read-all",
      );
};