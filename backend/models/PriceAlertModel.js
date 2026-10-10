import mongoose from "mongoose";
import priceAlertSchema from "../schemas/PriceAlertSchema.js";

const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);
export default PriceAlert;
