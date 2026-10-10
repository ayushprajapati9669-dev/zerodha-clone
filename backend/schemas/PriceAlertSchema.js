import mongoose from "mongoose";

const priceAlertSchema = new mongoose.Schema(
      {
            userId: {
                  type: mongoose.Schema.Types.ObjectId,
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
                  required: true,
                  trim: true,
            },

            condition: {
                  type: String,
                  enum: ["above", "below"],
                  required: true,
            },

            targetPrice: {
                  type: Number,
                  required: true,
                  min: [0.01, "Target price must be positive"],
            },

            isTriggered: {
                  type: Boolean,
                  default: false,
                  index: true,
            },

            triggeredAt: {
                  type: Date,
                  default: null,
            },

            triggeredPrice: {
                  type: Number,
                  default: null,
            },

            isActive: {
                  type: Boolean,
                  default: true,
                  index: true,
            },
      },
      {
            timestamps: true,
      },
);

// Index for fast tick evaluation: find active, untriggered alerts for a symbol
priceAlertSchema.index({ symbol: 1, isActive: 1, isTriggered: 1 });

// Index for per-user alert listing
priceAlertSchema.index({ userId: 1, isActive: 1 });

export default priceAlertSchema;
