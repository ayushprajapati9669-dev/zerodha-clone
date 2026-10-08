import mongoose from "mongoose";
import { Schema } from "mongoose";

const fundTransactionSchema = new Schema({
      userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
      },
      type: {
            type: String,
            required: true,
            enum: ["add", "withdraw"]
      },
      amount: {
            type: Number,
            required: true,
            min: 1
      },
      status: {
            type: String,
            required: true,
            enum: ["completed", "failed"]
      },
      createdAt: {
            type: Date,
            default: Date.now
      }
});
export default fundTransactionSchema;