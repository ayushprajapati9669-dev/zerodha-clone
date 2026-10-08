import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
      {
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: "User",
                  required: true,
                  index: true,
            },

            type: {
                  type: String,
                  enum: [
                        "order",
                        "fund",
                        "system",
                  ],
                  required: true,
            },

            event: {
                  type: String,
                  enum: [
                        "order_placed",
                        "order_executed",
                        "order_cancelled",
                        "fund_added",
                        "fund_withdrawn",
                        "system",
                        "security",
                  ],
                  default: "system",
            },

            title: {
                  type: String,
                  required: true,
                  trim: true,
            },

            message: {
                  type: String,
                  required: true,
                  trim: true,
            },

            priority: {
                  type: String,
                  enum: [
                        "low",
                        "normal",
                        "high",
                  ],
                  default: "normal",
            },

            metadata: {
                  type: mongoose.Schema.Types.Mixed,
                  default: {},
            },

            isRead: {
                  type: Boolean,
                  default: false,
                  index: true,
            },
      },
      {
            timestamps: true,
      },
);

export default notificationSchema;