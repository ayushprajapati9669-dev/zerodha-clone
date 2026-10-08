import express from "express";

import {
      getNotifications,
      getUnreadNotificationCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      deleteNotification,
      deleteAllNotifications,
      getNotificationPreferences,
      updateNotificationPreferences,
} from "../controller/notificationController.js";

import isLoggedIn from "../middleware/isLoggedInMiddleware.js"

const router = express.Router();


// Notifications
router.get(
      "/",
      isLoggedIn,
      getNotifications,
);

router.get(
      "/unread-count",
      isLoggedIn,
      getUnreadNotificationCount,
);

router.patch(
      "/read-all",
      isLoggedIn,
      markAllNotificationsAsRead,
);

router.patch(
      "/:id/read",
      isLoggedIn,
      markNotificationAsRead,
);

router.delete(
      "/all",
      isLoggedIn,
      deleteAllNotifications,
);

router.delete(
      "/:id",
      isLoggedIn,
      deleteNotification,
);


// Preferences
router.get(
      "/preferences",
      isLoggedIn,
      getNotificationPreferences,
);

router.patch(
      "/preferences",
      isLoggedIn,
      updateNotificationPreferences,
);


export default router;