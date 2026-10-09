import { Schema } from "mongoose";

const backtestHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    strategyName: {
      type: String,
      required: true,
      trim: true,
    },

    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    fromDate: {
      type: String,
      required: true,
    },

    toDate: {
      type: String,
      required: true,
    },

    interval: {
      type: String,
      required: true,
    },

    parameters: {
      type: Schema.Types.Mixed,
      required: true,
    },

    summary: {
      initialCapital: { type: Number, required: true },
      finalEquity: { type: Number, required: true },
      netPnL: { type: Number, required: true },
      returnPercent: { type: Number, required: true },
      totalTrades: { type: Number, required: true },
      winningTrades: { type: Number, required: true },
      losingTrades: { type: Number, required: true },
      winRate: { type: Number, required: true },
      profitFactor: { type: Schema.Types.Mixed, default: "N/A" },
      maxDrawdownPercent: { type: Number, required: true },
      totalCosts: { type: Number, required: true },
    },

    // Detailed simulated trade logs
    trades: {
      type: Array,
      default: [],
    },

    // Time series equity curve data
    equityCurve: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

export default backtestHistorySchema;
