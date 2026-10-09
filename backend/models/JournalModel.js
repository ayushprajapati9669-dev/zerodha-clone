import mongoose from "mongoose";
import journalSchema from "../schemas/JournalSchema.js";

const Journal = mongoose.models.Journal || mongoose.model("Journal", journalSchema);

export default Journal;
