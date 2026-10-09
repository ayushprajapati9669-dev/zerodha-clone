import { Schema } from "mongoose";

const riskSettingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // Enforcement Mode: 'warning' (display warnings) vs 'strict' (reject violating orders)
    enforcementMode: {
      type: String,
      enum: ["warning", "strict"],
      default: "warning",
    },

    // Daily loss limit in INR (0 means disabled)
    maxDailyLoss: {
      type: Number,
      min: 0,
      default: 10000,
    },

    // Daily loss calculation basis: 'realized_only' vs 'realized_plus_unrealized'
    dailyLossBasis: {
      type: String,
      enum: ["realized_only", "realized_plus_unrealized"],
      default: "realized_plus_unrealized",
    },

    // Maximum portfolio allocation allowed for a single stock (%)
    maxSingleStockAllocationPercent: {
      type: Number,
      min: 1,
      max: 100,
      default: 30,
    },

    // Maximum value allowed for a single order/position in INR
    maxPositionSize: {
      type: Number,
      min: 0,
      default: 50000,
    },

    // Enable / disable daily loss guard check
    enableDailyLossGuard: {
      type: Boolean,
      default: true,
    },

    // Tracks the last YYYY-MM-DD date (in IST) on which a daily loss breach notification was fired
    lastDailyLossAlertDate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default riskSettingsSchema;
