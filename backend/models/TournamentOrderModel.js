import mongoose from "mongoose";
import tournamentOrderSchema from "../schemas/TournamentOrderSchema.js";

const TournamentOrder = mongoose.model(
  "TournamentOrder",
  tournamentOrderSchema
);

export default TournamentOrder;
