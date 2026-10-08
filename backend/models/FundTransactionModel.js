import mongoose from "mongoose";
import fundTransactionSchema from "../schemas/FundTransactionSchema.js";
const FundTransaction = mongoose.model("FundTransaction", fundTransactionSchema);
export default FundTransaction;