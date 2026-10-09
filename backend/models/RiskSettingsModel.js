import mongoose from "mongoose";
import riskSettingsSchema from "../schemas/RiskSettingsSchema.js";

const RiskSettings = mongoose.models.RiskSettings || mongoose.model("RiskSettings", riskSettingsSchema);

export default RiskSettings;
