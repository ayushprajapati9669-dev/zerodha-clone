import mongoose from "mongoose";
import HoldingsSchema from "../schemas/HoldingsSchema.js";
const Holding = mongoose.model("holdings", HoldingsSchema);
export default Holding;