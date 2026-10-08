import { Schema } from "mongoose";

const FundsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  availableBalance: {
    type: Number,
    min: 0,
    required: true,
  },

  usedBalance: {
    type: Number,
    min: 0,
    default: 0,
  },
  reservedBalance: {
    type: Number,
    min: 0,
    default: 0,
  },
});

export default FundsSchema;