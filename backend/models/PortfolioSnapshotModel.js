import { model } from "mongoose";
import PortfolioSnapshotSchema from "../schemas/PortfolioSnapshotSchema.js";

const PortfolioSnapshot = model("PortfolioSnapshot", PortfolioSnapshotSchema);

export default PortfolioSnapshot;
