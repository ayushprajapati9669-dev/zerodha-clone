import mongoose from "mongoose";
import positionsSchema from "../schemas/positionsSchema.js";
const Position = mongoose.model("Positions", positionsSchema);
export default Position;