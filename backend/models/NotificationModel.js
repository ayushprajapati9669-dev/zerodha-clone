import mongoose from "mongoose";
import notificationSchema from "../schemas/NotificationSchema.js";

const Notification = mongoose.model(
      "Notification",
      notificationSchema,
);

export default Notification;