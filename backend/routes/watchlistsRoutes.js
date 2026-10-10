import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
      getWatchlists,
      getWatchlist,
      createWatchlist,
      renameWatchlist,
      deleteWatchlist,
      addSymbol,
      removeSymbol,
} from "../controller/watchlistsController.js";

const router = express.Router();

// Named watchlist CRUD
router.get("/", isLoggedIn, getWatchlists);
router.get("/:listId", isLoggedIn, getWatchlist);
router.post("/", isLoggedIn, createWatchlist);
router.patch("/:listId", isLoggedIn, renameWatchlist);
router.delete("/:listId", isLoggedIn, deleteWatchlist);

// Symbol management within a watchlist
router.post("/:listId/symbols", isLoggedIn, addSymbol);
router.delete("/:listId/symbols/:symbol", isLoggedIn, removeSymbol);

export default router;
