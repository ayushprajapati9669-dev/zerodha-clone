import { Schema } from "mongoose";

const PortfolioSnapshotSchema = new Schema({
      userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
      },
      // YYYY-MM-DD formatted date string for clean daily snapshot indexing
      date: {
            type: String,
            required: true,
      },
      timestamp: {
            type: Date,
            default: Date.now,
      },
      totalInvested: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
      },
      currentValue: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
      },
      cashBalance: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
      },
      totalPortfolioValue: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
      },
      realizedPnl: {
            type: Number,
            default: 0,
      },
      unrealizedPnl: {
            type: Number,
            default: 0,
      },
      totalPnl: {
            type: Number,
            default: 0,
      },
      returnPercentage: {
            type: Number,
            default: 0,
      },
      holdingsCount: {
            type: Number,
            default: 0,
            min: 0,
      },
}, { timestamps: true });

// Ensure unique daily snapshot per user
PortfolioSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });

export default PortfolioSnapshotSchema;
