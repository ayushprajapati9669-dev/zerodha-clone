import mongoose from "mongoose";

import notificationPreferenceSchema from "../schemas/NotificationPreferenceSchema.js";

const NotificationPreference =
      mongoose.model(
            "NotificationPreference",
            notificationPreferenceSchema,
      );

export default NotificationPreference;