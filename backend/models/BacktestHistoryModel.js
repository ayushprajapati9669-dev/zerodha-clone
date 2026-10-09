import mongoose from "mongoose";
import backtestHistorySchema from "../schemas/BacktestHistorySchema.js";

const BacktestHistory = mongoose.models.BacktestHistory || mongoose.model("BacktestHistory", backtestHistorySchema);

export default BacktestHistory;
