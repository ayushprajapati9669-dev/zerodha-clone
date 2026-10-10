import { Schema } from "mongoose";

const tournamentOrderSchema = new Schema(
  {
    participationId: {
      type: Schema.Types.ObjectId,
      ref: "TournamentParticipation",
      required: true,
      index: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    orderType: {
      type: String,
      enum: ["Market", "Limit"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    executionPrice: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ["PENDING", "EXECUTED", "CANCELLED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    executedAt: {
      type: Date,
      default: null,
    },
    reservedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

tournamentOrderSchema.index({ tournamentId: 1, userId: 1, createdAt: -1 });

export default tournamentOrderSchema;
