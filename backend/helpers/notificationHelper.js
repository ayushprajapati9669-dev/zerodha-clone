import Notification from "../models/NotificationModel.js";
import NotificationPreference from "../models/NotificationPreferenceModel.js";

export const createNotificationIfEnabled = async ({
      userId,
      eventPreferenceKey,
      notificationData,
      session,
}) => {


      const preferences = await NotificationPreference.findOne({
            userId,
      }).session(session);



      if (
            preferences &&
            preferences[eventPreferenceKey] === false
      ) {
            console.log("❌ Notification disabled");
            return null;
      }



      const [notification] = await Notification.create(
            [
                  {
                        ...notificationData,
                        userId,
                  },
            ],
            { session }
      );


      return notification;
};