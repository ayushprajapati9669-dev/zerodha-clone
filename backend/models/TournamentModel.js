import mongoose from "mongoose";
import tournamentSchema from "../schemas/TournamentSchema.js";

const Tournament = mongoose.model("Tournament", tournamentSchema);

export default Tournament;
