import { Schema } from "mongoose";

const riskAlertSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "stock_concentration",
        "position_size",
        "daily_loss_breach",
        "stale_market_price",
        "insufficient_diversification",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "moderate", "high", "critical"],
      default: "moderate",
    },

    symbol: {
      type: String,
      uppercase: true,
      trim: true,
      default: null,
    },

    actualValue: {
      type: Number,
      required: true,
    },

    configuredThreshold: {
      type: Number,
      required: true,
    },

    explanation: {
      type: String,
      required: true,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default riskAlertSchema;
