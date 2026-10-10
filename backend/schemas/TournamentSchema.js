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
      default: 100000, // ₹1,00,000 virtual balance
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
    mode: {
      type: String,
      enum: ["standard", "custom"],
      default: "standard",
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
    tradingRules: {
      allowedSymbols: {
        type: [String],
        default: [], // empty = all supported symbols
      },
      allowedOrderTypes: {
        type: [String],
        default: ["Market", "Limit"],
      },
      allowedActions: {
        type: [String],
        default: ["BUY", "SELL"],
      },
      maxOrderQty: {
        type: Number,
        default: 0, // 0 = unlimited
      },
      maxOrders: {
        type: Number,
        default: 0, // 0 = unlimited
      },
      maxOpenPositions: {
        type: Number,
        default: 0, // 0 = unlimited
      },
      perStockQtyLimit: {
        type: Number,
        default: 0, // 0 = unlimited
      },
      rankingMetric: {
        type: String,
        enum: ["returnPercent", "portfolioValue", "realizedPnL"],
        default: "returnPercent",
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
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast listing, unique name constraint, and filtering
tournamentSchema.index({ name: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });
tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ tournamentType: 1, status: 1 });
tournamentSchema.index({ inviteCode: 1 }, { sparse: true });

export default tournamentSchema;
