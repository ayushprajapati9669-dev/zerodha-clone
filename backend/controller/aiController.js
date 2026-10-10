import generateAIResponse from "../services/aiService.js";

import Holding from "../models/HoldingsModel.js";
import Position from "../models/PositionsModel.js";
import Order from "../models/OrdersModel.js";
import Fund from "../models/FundsModel.js";
import Chat from "../models/ChatModel.js";
import WatchlistList from "../models/WatchlistListModel.js";

export const chatWithAI = async (req, res, next) => {
      try {
            const { message, chatId } = req.body;

            // --------------------
            // VALIDATE MESSAGE
            // --------------------

            if (!message || !message.trim()) {
                  return res.status(400).json({
                        success: false,
                        message: "Message is required",
                  });
            }

            // --------------------
            // AUTHENTICATED USER
            // --------------------

            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const userId = req.user.userId;

            console.log("User ID:", userId);

            // --------------------
            // GET USER DATA
            // --------------------

            const [
                  holdings,
                  positions,
                  orders,
                  funds,
                  watchlist,
            ] = await Promise.all([
                  Holding.find({ userId }).lean(),

                  Position.find({ userId }).lean(),

                  Order.find({ userId })
                        .sort({ createdAt: -1 })
                        .limit(20)
                        .lean(),

                  Fund.findOne({ userId }).lean(),

                  WatchlistList.find({ userId })
                        .sort({ isDefault: -1, createdAt: 1 })
                        .lean(),
            ]);

            // --------------------
            // HOLDINGS
            // --------------------

            const cleanHoldings = holdings.map((holding) => {
                  const investedValue =
                        holding.quantity *
                        holding.averagePrice;

                  const currentValue =
                        holding.quantity *
                        holding.currentPrice;

                  const pnl =
                        currentValue -
                        investedValue;

                  const pnlPercentage =
                        investedValue > 0
                              ? (pnl / investedValue) * 100
                              : 0;

                  return {
                        symbol: holding.symbol,

                        companyName:
                              holding.companyName,

                        quantity:
                              holding.quantity,

                        averagePrice:
                              holding.averagePrice,

                        currentPrice:
                              holding.currentPrice,

                        investedValue:
                              Number(
                                    investedValue.toFixed(2),
                              ),

                        currentValue:
                              Number(
                                    currentValue.toFixed(2),
                              ),

                        pnl:
                              Number(
                                    pnl.toFixed(2),
                              ),

                        pnlPercentage:
                              Number(
                                    pnlPercentage.toFixed(2),
                              ),
                  };
            });

            // --------------------
            // PORTFOLIO SUMMARY
            // --------------------

            const totalInvested =
                  cleanHoldings.reduce(
                        (total, holding) =>
                              total +
                              holding.investedValue,
                        0,
                  );

            const totalCurrentValue =
                  cleanHoldings.reduce(
                        (total, holding) =>
                              total +
                              holding.currentValue,
                        0,
                  );

            const totalPnl =
                  totalCurrentValue -
                  totalInvested;

            const totalPnlPercentage =
                  totalInvested > 0
                        ? (totalPnl /
                              totalInvested) *
                        100
                        : 0;

            // --------------------
            // POSITIONS
            // --------------------

            const cleanPositions =
                  positions.map((position) => ({
                        symbol:
                              position.symbol,

                        companyName:
                              position.companyName,

                        quantity:
                              position.quantity,

                        product:
                              position.product,

                        averagePrice:
                              position.averagePrice,

                        currentPrice:
                              position.currentPrice,
                  }));

            // --------------------
            // ORDERS
            // --------------------

            const cleanOrders =
                  orders.map((order) => ({
                        symbol:
                              order.symbol,

                        companyName:
                              order.companyName,

                        type:
                              order.type,

                        quantity:
                              order.quantity,

                        orderType:
                              order.orderType,

                        price:
                              order.price,

                        product:
                              order.product,

                        status:
                              order.status,
                  }));

            // --------------------
            // FUNDS
            // --------------------

            const cleanFunds = funds
                  ? {
                        availableBalance:
                              funds.availableBalance,

                        usedBalance:
                              funds.usedBalance,

                        reservedBalance:
                              funds.reservedBalance,
                  }
                  : null;

            // --------------------
            // WATCHLIST
            // --------------------

            const cleanWatchlists = (watchlist || []).map((list) => ({
                  name: list.name,
                  isDefault: Boolean(list.isDefault),
                  stocks: (list.symbols || []).map((stock) => ({
                        symbol: stock.symbol,
                        companyName: stock.companyName,
                  })),
            }));

            // Flattened list of watched stocks for prompt
            const cleanWatchlist = Array.from(
                  new Map(
                        cleanWatchlists
                              .flatMap((w) => w.stocks)
                              .map((s) => [s.symbol, s])
                  ).values()
            );

            // --------------------
            // WATCHLIST SUMMARY
            // --------------------

            const watchlistCount =
                  cleanWatchlist.length;

            // --------------------
            // AI CONTEXT
            // --------------------

            const context = `
USER PORTFOLIO DATA

Portfolio Summary:
Total Invested: ₹${totalInvested.toFixed(2)}
Current Value: ₹${totalCurrentValue.toFixed(2)}
Total P&L: ₹${totalPnl.toFixed(2)}
Total P&L Percentage: ${totalPnlPercentage.toFixed(2)}%

Holdings:
${JSON.stringify(cleanHoldings, null, 2)}

Positions:
${JSON.stringify(cleanPositions, null, 2)}

Recent Orders:
${JSON.stringify(cleanOrders, null, 2)}

Funds:
${JSON.stringify(cleanFunds, null, 2)}

Watchlist:
Total Watchlist Stocks: ${watchlistCount}

${JSON.stringify(cleanWatchlist, null, 2)}
`;

            // --------------------
            // GET / CREATE CHAT
            // --------------------

            let chat;

            if (chatId) {
                  // Existing chat

                  chat = await Chat.findOne({
                        _id: chatId,
                        userId,
                  });

                  if (!chat) {
                        return res.status(404).json({
                              success: false,
                              message: "Chat not found",
                        });
                  }
            } else {
                  // New chat

                  chat = await Chat.create({
                        userId,

                        title:
                              message.trim().length > 40
                                    ? `${message
                                          .trim()
                                          .slice(0, 40)}...`
                                    : message.trim(),

                        messages: [],
                  });
            }

            // --------------------
            // SAVE USER MESSAGE
            // --------------------

            chat.messages.push({
                  role: "user",
                  content: message.trim(),
            });

            // --------------------
            // GENERATE AI RESPONSE
            // --------------------

            const response =
                  await generateAIResponse(
                        message,
                        context,
                  );

            // --------------------
            // SAVE AI MESSAGE
            // --------------------

            chat.messages.push({
                  role: "assistant",
                  content: response,
            });

            await chat.save();

            // --------------------
            // RESPONSE
            // --------------------

            return res.status(200).json({
                  success: true,

                  chatId: chat._id,

                  message: response,

                  chat: {
                        _id: chat._id,
                        title: chat.title,
                  },
            });
      } catch (error) {
            next(error);
      }
};


// ==============================
// GET ALL USER CHATS
// ==============================

export const getUserChats = async (
      req,
      res,
      next,
) => {
      try {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const userId = req.user.userId;

            const chats =
                  await Chat.find({ userId })
                        .select(
                              "_id title createdAt updatedAt",
                        )
                        .sort({
                              updatedAt: -1,
                        })
                        .lean();

            return res.status(200).json({
                  success: true,
                  chats,
            });
      } catch (error) {
            next(error);
      }
};


// ==============================
// GET SINGLE CHAT
// ==============================

export const getChatById = async (
      req,
      res,
      next,
) => {
      try {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const userId = req.user.userId;
            const { chatId } = req.params;

            const chat =
                  await Chat.findOne({
                        _id: chatId,
                        userId,
                  }).lean();

            if (!chat) {
                  return res.status(404).json({
                        success: false,
                        message: "Chat not found",
                  });
            }

            return res.status(200).json({
                  success: true,
                  chat,
            });
      } catch (error) {
            next(error);
      }
};


// ==============================
// DELETE CHAT
// ==============================

export const deleteChat = async (
      req,
      res,
      next,
) => {
      try {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: "User is not authenticated",
                  });
            }

            const userId = req.user.userId;
            const { chatId } = req.params;

            const deletedChat =
                  await Chat.findOneAndDelete({
                        _id: chatId,
                        userId,
                  });

            if (!deletedChat) {
                  return res.status(404).json({
                        success: false,
                        message: "Chat not found",
                  });
            }

            return res.status(200).json({
                  success: true,
                  message: "Chat deleted successfully",
            });
      } catch (error) {
            next(error);
      }
};