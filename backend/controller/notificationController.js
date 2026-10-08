import Notification from "../models/NotificationModel.js";

import NotificationPreference from "../models/NotificationPreferenceModel.js";


// ==================================================
// GET NOTIFICATIONS
// ==================================================

export const getNotifications = async (
      req,
      res,
      next,
) => {

      try {

            const userId =
                  req.user.userId;


            const {
                  page = 1,
                  limit = 10,
                  type = "all",
                  unread = "false",
            } = req.query;


            const pageNumber = Math.max(
                  Number(page) || 1,
                  1,
            );


            const limitNumber = Math.min(
                  Math.max(
                        Number(limit) || 10,
                        1,
                  ),
                  50,
            );


            const filter = {
                  userId,
            };


            // ==========================================
            // CATEGORY FILTER
            // ==========================================

            if (
                  type !== "all" &&
                  [
                        "order",
                        "fund",
                        "system",
                  ].includes(type)
            ) {
                  filter.type = type;
            }


            // ==========================================
            // UNREAD FILTER
            // ==========================================

            if (unread === "true") {
                  filter.isRead = false;
            }


            const skip =
                  (pageNumber - 1) *
                  limitNumber;


            const [
                  notifications,
                  total,
                  unreadCount,
            ] = await Promise.all([

                  Notification.find(
                        filter,
                  )
                        .sort({
                              createdAt: -1,
                        })
                        .skip(skip)
                        .limit(limitNumber)
                        .lean(),

                  Notification.countDocuments(
                        filter,
                  ),

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

                        totalPages:
                              Math.ceil(
                                    total /
                                    limitNumber,
                              ),

                        hasMore:
                              skip +
                              notifications.length <
                              total,
                  },

                  unreadCount,
            });

      } catch (error) {
            next(error);
      }
};


// ==================================================
// GET UNREAD COUNT
// ==================================================

export const getUnreadNotificationCount =
      async (
            req,
            res,
            next,
      ) => {

            try {

                  const unreadCount =
                        await Notification.countDocuments(
                              {
                                    userId:
                                          req.user
                                                .userId,

                                    isRead: false,
                              },
                        );


                  return res.status(200).json({
                        success: true,
                        unreadCount,
                  });

            } catch (error) {
                  next(error);
            }
      };


// ==================================================
// MARK ONE AS READ
// ==================================================

export const markNotificationAsRead =
      async (
            req,
            res,
            next,
      ) => {

            try {

                  const {
                        id,
                  } = req.params;


                  const notification =
                        await Notification.findOneAndUpdate(
                              {
                                    _id: id,

                                    userId:
                                          req.user
                                                .userId,
                              },

                              {
                                    $set: {
                                          isRead: true,
                                    },
                              },

                              {
                                    new: true,
                              },
                        );


                  if (!notification) {
                        return res.status(404).json({
                              success: false,

                              message:
                                    "Notification not found",
                        });
                  }


                  return res.status(200).json({
                        success: true,
                        notification,
                  });

            } catch (error) {
                  next(error);
            }
      };


// ==================================================
// MARK ALL AS READ
// ==================================================

export const markAllNotificationsAsRead =
      async (
            req,
            res,
            next,
      ) => {

            try {

                  await Notification.updateMany(
                        {
                              userId:
                                    req.user
                                          .userId,

                              isRead: false,
                        },

                        {
                              $set: {
                                    isRead: true,
                              },
                        },
                  );


                  return res.status(200).json({
                        success: true,

                        message:
                              "All notifications marked as read",
                  });

            } catch (error) {
                  next(error);
            }
      };


// ==================================================
// DELETE ONE
// ==================================================

export const deleteNotification = async (
      req,
      res,
      next,
) => {

      try {

            const {
                  id,
            } = req.params;


            const notification =
                  await Notification.findOneAndDelete(
                        {
                              _id: id,

                              userId:
                                    req.user
                                          .userId,
                        },
                  );


            if (!notification) {
                  return res.status(404).json({
                        success: false,

                        message:
                              "Notification not found",
                  });
            }


            return res.status(200).json({
                  success: true,

                  message:
                        "Notification deleted successfully",
            });

      } catch (error) {
            next(error);
      }
};


// ==================================================
// DELETE ALL
// ==================================================

export const deleteAllNotifications =
      async (
            req,
            res,
            next,
      ) => {

            try {

                  await Notification.deleteMany({
                        userId:
                              req.user.userId,
                  });


                  return res.status(200).json({
                        success: true,

                        message:
                              "All notifications deleted successfully",
                  });

            } catch (error) {
                  next(error);
            }
      };


// ==================================================
// GET PREFERENCES
// ==================================================

export const getNotificationPreferences =
      async (
            req,
            res,
            next,
      ) => {

            try {

                  const userId =
                        req.user.userId;


                  let preferences =
                        await NotificationPreference.findOne(
                              {
                                    userId,
                              },
                        );


                  if (!preferences) {

                        preferences =
                              await NotificationPreference.create(
                                    {
                                          userId,
                                    },
                              );
                  }


                  return res.status(200).json({
                        success: true,

                        preferences,
                  });

            } catch (error) {
                  next(error);
            }
      };


// ==================================================
// UPDATE PREFERENCES
// ==================================================

export const updateNotificationPreferences = async (
      req,
      res,
      next,
) => {

      try {

            const userId = req.user.userId;

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

            allowedFields.forEach((field) => {

                  if (
                        typeof req.body[field] === "boolean"
                  ) {
                        updateData[field] = req.body[field];
                  }

            });


            const preferences =
                  await NotificationPreference.findOneAndUpdate(
                        { userId },

                        {
                              $set: updateData,
                        },

                        {
                              new: true,
                              upsert: true,
                              setDefaultsOnInsert: true,
                        },
                  );


            return res.status(200).json({
                  success: true,
                  preferences,
            });

      } catch (error) {
            next(error);
      }
};