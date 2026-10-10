import mongoose from "mongoose";
import WatchlistList, {
      MAX_WATCHLISTS_PER_USER,
      MAX_SYMBOLS_PER_WATCHLIST,
} from "../models/WatchlistListModel.js";

// ----------------------------------------------------------------
// Normalize a stock symbol consistently (uppercase, strip exchange prefix)
// ----------------------------------------------------------------
const normalizeSymbol = (symbol) =>
      String(symbol || "")
            .trim()
            .toUpperCase()
            .replace(/^(NSE:|BSE:)/i, "");

// ----------------------------------------------------------------
// Ensure user has a default watchlist, creating one if needed.
// Returns the default list document.
// ----------------------------------------------------------------
const ensureDefaultWatchlist = async (userId) => {
      let defaultList = await WatchlistList.findOne({ userId, isDefault: true });
      if (!defaultList) {
            // Check if user already had legacy watchlist items and migrate them
            let initialSymbols = [];
            try {
                  if (mongoose.connection?.db) {
                        const query = mongoose.Types.ObjectId.isValid(userId)
                              ? { $or: [{ userId }, { userId: new mongoose.Types.ObjectId(userId) }] }
                              : { userId };
                        const legacyItems = await mongoose.connection.db
                              .collection("watchlists")
                              .find(query)
                              .toArray();
                        if (legacyItems && legacyItems.length > 0) {
                              initialSymbols = legacyItems.map((item) => ({
                                    symbol: normalizeSymbol(item.symbol),
                                    companyName: item.companyName || item.symbol,
                              }));
                        }
                  }
            } catch (err) {
                  // Ignore legacy lookup errors
            }

            defaultList = await WatchlistList.create({
                  userId,
                  name: "Watchlist 1",
                  isDefault: true,
                  symbols: initialSymbols,
            });
      }
      return defaultList;
};

// ==================================================
// GET ALL WATCHLISTS  –  GET /api/watchlists
// ==================================================
export const getWatchlists = async (req, res, next) => {
      try {
            const userId = req.user.userId;

            // Make sure the user always has at least one list
            await ensureDefaultWatchlist(userId);

            const lists = await WatchlistList.find({ userId })
                  .sort({ isDefault: -1, createdAt: 1 })
                  .lean();

            return res.status(200).json({ success: true, watchlists: lists });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// GET ONE WATCHLIST  –  GET /api/watchlists/:listId
// ==================================================
export const getWatchlist = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { listId } = req.params;

            const list = await WatchlistList.findOne({ _id: listId, userId }).lean();
            if (!list) {
                  return res.status(404).json({ success: false, message: "Watchlist not found." });
            }

            return res.status(200).json({ success: true, watchlist: list });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// CREATE WATCHLIST  –  POST /api/watchlists
// ==================================================
export const createWatchlist = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { name } = req.body;

            if (!name || typeof name !== "string" || !name.trim()) {
                  return res.status(400).json({ success: false, message: "Watchlist name is required." });
            }

            const trimmedName = name.trim();

            const count = await WatchlistList.countDocuments({ userId });
            if (count >= MAX_WATCHLISTS_PER_USER) {
                  return res.status(400).json({
                        success: false,
                        message: `You can have at most ${MAX_WATCHLISTS_PER_USER} watchlists.`,
                  });
            }

            const newList = await WatchlistList.create({ userId, name: trimmedName });

            return res.status(201).json({ success: true, watchlist: newList });
      } catch (error) {
            if (error.code === 11000) {
                  return res.status(409).json({ success: false, message: "A watchlist with this name already exists." });
            }
            next(error);
      }
};

// ==================================================
// RENAME WATCHLIST  –  PATCH /api/watchlists/:listId
// ==================================================
export const renameWatchlist = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { listId } = req.params;
            const { name } = req.body;

            if (!name || typeof name !== "string" || !name.trim()) {
                  return res.status(400).json({ success: false, message: "Watchlist name is required." });
            }

            const list = await WatchlistList.findOne({ _id: listId, userId });
            if (!list) {
                  return res.status(404).json({ success: false, message: "Watchlist not found." });
            }

            list.name = name.trim();
            await list.save();

            return res.status(200).json({ success: true, watchlist: list });
      } catch (error) {
            if (error.code === 11000) {
                  return res.status(409).json({ success: false, message: "A watchlist with this name already exists." });
            }
            next(error);
      }
};

// ==================================================
// DELETE WATCHLIST  –  DELETE /api/watchlists/:listId
// ==================================================
export const deleteWatchlist = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { listId } = req.params;

            const list = await WatchlistList.findOne({ _id: listId, userId });
            if (!list) {
                  return res.status(404).json({ success: false, message: "Watchlist not found." });
            }

            const total = await WatchlistList.countDocuments({ userId });
            if (total <= 1) {
                  return res.status(400).json({
                        success: false,
                        message: "You cannot delete your last watchlist.",
                  });
            }

            await WatchlistList.findByIdAndDelete(listId);

            // If we deleted the default, promote the oldest remaining list
            if (list.isDefault) {
                  const oldest = await WatchlistList.findOne({ userId }).sort({ createdAt: 1 });
                  if (oldest) {
                        oldest.isDefault = true;
                        await oldest.save();
                  }
            }

            return res.status(200).json({ success: true, message: "Watchlist deleted." });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// ADD SYMBOL  –  POST /api/watchlists/:listId/symbols
// ==================================================
export const addSymbol = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { listId } = req.params;
            const { symbol, companyName } = req.body;

            if (!symbol) {
                  return res.status(400).json({ success: false, message: "Symbol is required." });
            }
            if (!companyName) {
                  return res.status(400).json({ success: false, message: "Company name is required." });
            }

            const normalizedSymbol = normalizeSymbol(symbol);
            if (!normalizedSymbol) {
                  return res.status(400).json({ success: false, message: "Invalid symbol." });
            }

            const list = await WatchlistList.findOne({ _id: listId, userId });
            if (!list) {
                  return res.status(404).json({ success: false, message: "Watchlist not found." });
            }

            if (list.symbols.length >= MAX_SYMBOLS_PER_WATCHLIST) {
                  return res.status(400).json({
                        success: false,
                        message: `Watchlist can contain at most ${MAX_SYMBOLS_PER_WATCHLIST} symbols.`,
                  });
            }

            const alreadyExists = list.symbols.some(
                  (s) => s.symbol === normalizedSymbol
            );
            if (alreadyExists) {
                  return res.status(409).json({ success: false, message: "Symbol already in this watchlist." });
            }

            list.symbols.push({ symbol: normalizedSymbol, companyName: companyName.trim() });
            await list.save();

            return res.status(201).json({ success: true, watchlist: list });
      } catch (error) {
            next(error);
      }
};

// ==================================================
// REMOVE SYMBOL  –  DELETE /api/watchlists/:listId/symbols/:symbol
// ==================================================
export const removeSymbol = async (req, res, next) => {
      try {
            const userId = req.user.userId;
            const { listId, symbol } = req.params;

            const normalizedSymbol = normalizeSymbol(symbol);

            const list = await WatchlistList.findOne({ _id: listId, userId });
            if (!list) {
                  return res.status(404).json({ success: false, message: "Watchlist not found." });
            }

            const before = list.symbols.length;
            list.symbols = list.symbols.filter((s) => s.symbol !== normalizedSymbol);

            if (list.symbols.length === before) {
                  return res.status(404).json({ success: false, message: "Symbol not found in this watchlist." });
            }

            await list.save();

            return res.status(200).json({ success: true, watchlist: list });
      } catch (error) {
            next(error);
      }
};
