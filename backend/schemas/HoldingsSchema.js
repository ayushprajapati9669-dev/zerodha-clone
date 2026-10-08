import { Schema } from "mongoose";

const HoldingsSchema = new Schema({
      userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
      },
      symbol: {
            type: String,
            required: true
      },
      companyName: {
            type: String,
            required: true
      },
      quantity: {
            type: Number,
            min: 1,
            required: true
      },
      averagePrice: {
            type: Number,
            min: 0,
            required: true
      },
      currentPrice: {
            type: Number,
            min: 0,
            required: true
      },
      reservedQuantity: {
            type: Number,
            min: 0,
            default: 0
      },
      product: {
            type: String,
            enum: ["MIS", "CNC"],
            required: true
      },
      previousClose: {
            type: Number,
            required: true,
            min: 0,
      },
});
export default HoldingsSchema;