import { Schema } from "mongoose";

const ordersSchema = new Schema({
      userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
      },

      symbol: {
            type: String,
            required: true,
      },

      companyName: {
            type: String,
            required: true,
      },

      type: {
            type: String,
            required: true,
            enum: ["buy", "sell"],
      },

      quantity: {
            type: Number,
            min: 1,
            required: true,
      },

      orderType: {
            type: String,
            required: true,
            enum: ["Market", "Limit"],
      },

      // For Limit Order:
      // user's original limit price
      //
      // For Market Order:
      // actual market execution price
      price: {
            type: Number,
            min: 0,
            required: true,
      },

      // Actual price at which the order was executed
      //
      // Market Order:
      // same as price
      //
      // Limit Order:
      // actual TrueData market price
      executionPrice: {
            type: Number,
            min: 0,
            default: null,
      },

      status: {
            type: String,
            required: true,
            enum: [
                  "pending",
                  "processing",
                  "completed",
                  "cancelled",
            ],
      },

      createdAt: {
            type: Date,
            default: Date.now,
      },

      executedAt: {
            type: Date,
            default: null,
      },

      // Money reserved for BUY Limit Order
      reservedAmount: {
            type: Number,
            min: 0,
            default: 0,
      },

      // true when reservation has been released
      reservationReleased: {
            type: Boolean,
            default: false,
      },

      product: {
            type: String,
            required: true,
            enum: ["CNC", "MIS"],
      },
});

export default ordersSchema;