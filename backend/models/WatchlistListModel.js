import mongoose from "mongoose";
import watchlistListSchema, {
      MAX_WATCHLISTS_PER_USER,
      MAX_SYMBOLS_PER_WATCHLIST,
} from "../schemas/WatchlistListSchema.js";

const WatchlistList = mongoose.model("WatchlistList", watchlistListSchema);

export { MAX_WATCHLISTS_PER_USER, MAX_SYMBOLS_PER_WATCHLIST };
export default WatchlistList;
