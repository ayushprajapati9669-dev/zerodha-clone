import mongoose from "mongoose";
import watchlistSchema from "../schemas/WatchListSchema.js";
const Watchlist = mongoose.model("Watchlist", watchlistSchema);
export default Watchlist;