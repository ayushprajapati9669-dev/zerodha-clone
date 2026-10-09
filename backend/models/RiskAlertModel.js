import mongoose from "mongoose";
import riskAlertSchema from "../schemas/RiskAlertSchema.js";

const RiskAlert = mongoose.models.RiskAlert || mongoose.model("RiskAlert", riskAlertSchema);

export default RiskAlert;
