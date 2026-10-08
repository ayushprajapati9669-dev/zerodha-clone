import { io } from "../index.js";

export const emitNotification = (
      notification,
) => {
      if (!notification) {
            return;
      }

      const userId =
            notification.userId?.toString();

      if (!userId) {
            return;
      }

      io.to(`user:${userId}`).emit(
            "new-notification",
            notification,
      );
};