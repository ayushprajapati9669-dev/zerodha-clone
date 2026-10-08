import mongoose from "mongoose";
import FundsSchema from "../schemas/FundsSchema.js";
const Fund = mongoose.model("Fund", FundsSchema);
export default Fund;