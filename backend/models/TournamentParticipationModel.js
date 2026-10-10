import mongoose from "mongoose";
import tournamentParticipationSchema from "../schemas/TournamentParticipationSchema.js";

const TournamentParticipation = mongoose.model(
  "TournamentParticipation",
  tournamentParticipationSchema
);

export default TournamentParticipation;
