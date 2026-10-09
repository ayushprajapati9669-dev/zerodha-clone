import { Schema } from "mongoose";

const journalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },

    entryDate: {
      type: Date,
      default: Date.now,
    },

    exitDate: {
      type: Date,
      default: null,
    },

    entryPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    exitPrice: {
      type: Number,
      default: null,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    realizedPnl: {
      type: Number,
      default: 0,
    },

    strategyName: {
      type: String,
      trim: true,
      default: "Discretionary",
    },

    entryReason: {
      type: String,
      trim: true,
      default: "",
    },

    exitReason: {
      type: String,
      trim: true,
      default: "",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    lessonsLearned: {
      type: String,
      trim: true,
      default: "",
    },

    tags: {
      type: [String],
      default: [],
    },

    // Self-assessment rating (1-5 stars)
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },

    // Did I follow my pre-defined trading plan?
    ruleFollowed: {
      type: Boolean,
      default: true,
    },

    // Self-reported mistake categorization
    mistakeCategory: {
      type: String,
      enum: [
        "None",
        "FOMO Entry",
        "Early Exit",
        "Overtrading",
        "Chasing Price",
        "Ignored Stop Loss",
        "Improper Sizing",
        "Other",
      ],
      default: "None",
    },
  },
  { timestamps: true }
);

export default journalSchema;
