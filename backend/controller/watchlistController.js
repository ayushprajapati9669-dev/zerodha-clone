import Watchlist from "../models/WatchListModel.js";

export const addToWatchlist = async (req, res, next) => {
      try {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const { symbol, companyName } = req.body;
            const userId = req.user.userId;

            if (!symbol || !companyName) {
                  return res.status(400).json({
                        success: false,
                        message: "Symbol and company name are required",
                  });
            }

            const existingStock = await Watchlist.findOne({
                  userId,
                  symbol: symbol.toUpperCase(),
            });

            if (existingStock) {
                  return res.status(409).json({
                        success: false,
                        message: "Stock already exists in watchlist",
                  });
            }

            const watchlistItem = await Watchlist.create({
                  userId,
                  symbol: symbol.toUpperCase(),
                  companyName,
            });

            return res.status(201).json({
                  success: true,
                  message: "Stock added to watchlist",
                  watchlistItem,
            });
      } catch (error) {
            next(error);
      }
};

export const getWatchlist = async (req, res, next) => {
      try {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const userId = req.user.userId;

            const watchlist = await Watchlist.find({ userId })
                  .sort({ createdAt: 1 })
                  .lean();

            return res.status(200).json({
                  success: true,
                  watchlist,
            });
      } catch (error) {
            next(error);
      }
};

export const removeFromWatchlist = async (req, res, next) => {
      try {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const userId = req.user.userId;
            const { symbol } = req.params;

            const deletedStock = await Watchlist.findOneAndDelete({
                  userId,
                  symbol: symbol.toUpperCase(),
            });

            if (!deletedStock) {
                  return res.status(404).json({
                        success: false,
                        message: "Stock not found in watchlist",
                  });
            }

            return res.status(200).json({
                  success: true,
                  message: "Stock removed from watchlist",
            });
      } catch (error) {
            next(error);
      }
};