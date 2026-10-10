import { Schema } from "mongoose";

const virtualHoldingSchema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    averagePrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currentPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    marketValue: {
      type: Number,
      min: 0,
      default: 0,
    },
    unrealizedPnL: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const tournamentParticipationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      min: 0,
    },
    availableCash: {
      type: Number,
      required: true,
      min: 0,
    },
    reservedCash: {
      type: Number,
      min: 0,
      default: 0,
    },
    virtualHoldings: {
      type: [virtualHoldingSchema],
      default: [],
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    unrealizedPnL: {
      type: Number,
      default: 0,
    },
    portfolioValue: {
      type: Number,
      required: true,
      min: 0,
    },
    returnPercent: {
      type: Number,
      default: 0,
    },
    tradeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    rank: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ["active", "left", "disqualified"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Prevent duplicate joining by the same user in the same tournament
tournamentParticipationSchema.index(
  { tournamentId: 1, userId: 1 },
  { unique: true }
);

// Efficient ranking and leaderboard lookup
tournamentParticipationSchema.index({
  tournamentId: 1,
  returnPercent: -1,
  portfolioValue: -1,
  createdAt: 1,
});

export default tournamentParticipationSchema;
