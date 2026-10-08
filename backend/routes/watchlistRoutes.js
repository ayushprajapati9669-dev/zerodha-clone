import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";

import {
      addToWatchlist,
      getWatchlist,
      removeFromWatchlist,
} from "../controller/watchlistController.js";

const router = express.Router();

router.post("/", isLoggedIn, addToWatchlist);

router.get("/", isLoggedIn, getWatchlist);

router.delete("/:symbol", isLoggedIn, removeFromWatchlist);

export default router;