import { Schema } from "mongoose";

const tournamentSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    tournamentType: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly", "private"],
      default: "daily",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      min: 10000,
      default: 1000000, // ₹10,00,000 virtual balance
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 2,
      default: 100,
    },
    participantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "completed", "cancelled"],
      default: "upcoming",
    },
    entryRules: {
      allowLateJoin: {
        type: Boolean,
        default: true,
      },
      allowedSymbols: {
        type: [String],
        default: [], // empty = all supported symbols
      },
      minTrades: {
        type: Number,
        default: 0,
      },
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    inviteCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
      sparse: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast listing and filtering
tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ tournamentType: 1, status: 1 });
tournamentSchema.index({ inviteCode: 1 });

export default tournamentSchema;
