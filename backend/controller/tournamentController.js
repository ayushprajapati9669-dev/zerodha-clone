import Tournament from "../models/TournamentModel.js";
import TournamentParticipation from "../models/TournamentParticipationModel.js";
import TournamentOrder from "../models/TournamentOrderModel.js";
import User from "../models/UserModel.js";
import {
  syncTournamentStatus,
  recalculateTournamentLeaderboard,
  placeTournamentOrder,
  cancelTournamentOrder,
  getMarketDataStatus,
  finalizeTournamentCompletion,
} from "../services/tournamentService.js";
import { logAdminAction } from "../utils/adminAudit.js";
import Notification from "../models/NotificationModel.js";

/**
 * Fire-and-forget tournament notification helper.
 * Uses direct Notification.create to avoid requiring a session (tournament
 * actions do not run inside transactions). Failures are silently logged
 * so they never block the primary operation.
 */
const sendTournamentNotification = async ({ userId, event, title, message, metadata = {} }) => {
  try {
    await Notification.create({
      userId,
      type: "tournament",
      event,
      title,
      message,
      priority: "normal",
      metadata,
    });
  } catch (err) {
    console.error("Tournament notification failed:", err.message);
  }
};

/**
 * List tournaments with optional filtering and pagination
 */
export const listTournaments = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const currentUserId = req.user?.userId;

    const query = {};

    if (type && ["daily", "weekly", "monthly", "private"].includes(type)) {
      query.tournamentType = type;
    }

    if (search && typeof search === "string" && search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const tournaments = await Tournament.find(query).sort({
      status: 1,
      startDate: 1,
    });

    // Synchronize statuses dynamically based on current time
    for (const t of tournaments) {
      await syncTournamentStatus(t);
    }

    // Filter by computed status if requested
    let filtered = tournaments;
    if (status && status !== "all") {
      filtered = tournaments.filter((t) => t.status === status);
    }

    // Fetch user participation statuses if user is logged in
    let userParticipationsMap = new Map();
    if (currentUserId) {
      const userParts = await TournamentParticipation.find({
        userId: currentUserId,
        status: "active",
      }).select("tournamentId rank returnPercent portfolioValue");

      userParts.forEach((p) => {
        userParticipationsMap.set(p.tournamentId.toString(), p);
      });
    }

    const result = filtered.map((t) => {
      const userPart = userParticipationsMap.get(t._id.toString());
      return {
        _id: t._id,
        name: t.name,
        description: t.description,
        tournamentType: t.tournamentType,
        startDate: t.startDate,
        endDate: t.endDate,
        initialBalance: t.initialBalance,
        maxParticipants: t.maxParticipants,
        participantCount: t.participantCount,
        status: t.status,
        isPrivate: t.isPrivate,
        entryRules: t.entryRules,
        hasJoined: !!userPart,
        userRank: userPart?.rank || null,
        userReturn: userPart?.returnPercent ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
      totalCount: result.length,
      marketData: getMarketDataStatus(),
    });
  } catch (error) {
    console.error("Error listing tournaments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tournaments",
      error: error.message,
    });
  }
};

/**
 * Get tournament details by ID
 */
export const getTournamentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    await syncTournamentStatus(tournament);

    let userParticipation = null;
    if (currentUserId) {
      userParticipation = await TournamentParticipation.findOne({
        tournamentId: id,
        userId: currentUserId,
        status: "active",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          description: tournament.description,
          tournamentType: tournament.tournamentType,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          initialBalance: tournament.initialBalance,
          maxParticipants: tournament.maxParticipants,
          participantCount: tournament.participantCount,
          status: tournament.status,
          isPrivate: tournament.isPrivate,
          entryRules: tournament.entryRules,
        },
        hasJoined: !!userParticipation,
        participation: userParticipation
          ? {
              _id: userParticipation._id,
              initialBalance: userParticipation.initialBalance,
              availableCash: userParticipation.availableCash,
              reservedCash: userParticipation.reservedCash,
              portfolioValue: userParticipation.portfolioValue,
              returnPercent: userParticipation.returnPercent,
              realizedPnL: userParticipation.realizedPnL,
              unrealizedPnL: userParticipation.unrealizedPnL,
              tradeCount: userParticipation.tradeCount,
              rank: userParticipation.rank,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching tournament details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tournament details",
      error: error.message,
    });
  }
};

/**
 * Create a new tournament (Admin or authorized manager)
 */
export const createTournament = async (req, res) => {
  try {
    const {
      name,
      description,
      tournamentType = "daily",
      startDate,
      endDate,
      initialBalance = 100000,
      maxParticipants = 100,
      isPrivate = false,
      inviteCode,
      mode = "standard",
      entryRules = {},
      tradingRules = {},
    } = req.body;

    if (!name || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Name, description, start date, and end date are required.",
      });
    }

    const trimmedName = String(name).trim();
    const existing = await Tournament.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A tournament with the name "${trimmedName}" already exists.`,
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date format.",
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date.",
      });
    }

    const cleanInviteCode =
      isPrivate && inviteCode ? String(inviteCode).trim().toUpperCase() : null;

    if (isPrivate && !cleanInviteCode) {
      return res.status(400).json({
        success: false,
        message: "Invite code is required for private tournaments.",
      });
    }

    const numInitial = Number(initialBalance);
    if (!Number.isFinite(numInitial) || numInitial < 10000) {
      return res.status(400).json({
        success: false,
        message: "Initial virtual balance must be at least ₹10,000.",
      });
    }

    const numMax = Number(maxParticipants);
    if (!Number.isInteger(numMax) || numMax < 2) {
      return res.status(400).json({
        success: false,
        message: "Max participants must be at least 2.",
      });
    }

    const validTypes = ["daily", "weekly", "monthly", "private"];
    if (!validTypes.includes(tournamentType)) {
      return res.status(400).json({
        success: false,
        message: `Tournament type must be one of: ${validTypes.join(", ")}`,
      });
    }

    const tournament = new Tournament({
      name: trimmedName,
      description: String(description).trim(),
      tournamentType,
      startDate: start,
      endDate: end,
      initialBalance: numInitial,
      maxParticipants: numMax,
      isPrivate: Boolean(isPrivate),
      inviteCode: cleanInviteCode,
      mode: mode === "custom" ? "custom" : "standard",
      entryRules: {
        allowLateJoin: entryRules.allowLateJoin ?? true,
        allowedSymbols: entryRules.allowedSymbols || tradingRules.allowedSymbols || [],
        minTrades: Number(entryRules.minTrades || tradingRules.minTrades || 0),
      },
      tradingRules: {
        allowedSymbols: tradingRules.allowedSymbols || entryRules.allowedSymbols || [],
        allowedOrderTypes: tradingRules.allowedOrderTypes || ["Market", "Limit"],
        allowedActions: tradingRules.allowedActions || ["BUY", "SELL"],
        maxOrderQty: Number(tradingRules.maxOrderQty || 0),
        maxOrders: Number(tradingRules.maxOrders || 0),
        maxOpenPositions: Number(tradingRules.maxOpenPositions || 0),
        perStockQtyLimit: Number(tradingRules.perStockQtyLimit || 0),
        rankingMetric: tradingRules.rankingMetric || "returnPercent",
      },
      createdBy: req.user?.userId || null,
    });

    await syncTournamentStatus(tournament);
    await tournament.save();

    logAdminAction({
      adminId: req.user?.userId,
      action: "CREATE_TOURNAMENT",
      targetType: "Tournament",
      targetId: tournament._id,
      details: {
        name: tournament.name,
        tournamentType,
        startDate: start,
        endDate: end,
        isPrivate: tournament.isPrivate,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully.",
      data: tournament,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A tournament with this name already exists.",
      });
    }
    console.error("Error creating tournament:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create tournament",
      error: error.message,
    });
  }
};

/**
 * Join an existing tournament
 */
export const joinTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { inviteCode } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    await syncTournamentStatus(tournament);

    if (tournament.status === "completed" || tournament.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot join a ${tournament.status} tournament.`,
      });
    }

    if (tournament.status === "active" && tournament.entryRules?.allowLateJoin === false) {
      return res.status(400).json({
        success: false,
        message: "Late joining is disabled for this tournament.",
      });
    }

    if (tournament.participantCount >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "This tournament has reached its maximum participant capacity.",
      });
    }

    // Check private tournament invite code
    if (tournament.isPrivate) {
      const code = String(inviteCode || "").trim().toUpperCase();
      const expectedCode = String(tournament.inviteCode || "").trim().toUpperCase();
      if (!code || code !== expectedCode) {
        return res.status(403).json({
          success: false,
          message: "Invalid or missing invite code for this private tournament.",
        });
      }
    }

    // Check if user already joined or was disqualified
    const existing = await TournamentParticipation.findOne({
      tournamentId: id,
      userId,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === "disqualified"
            ? "You were disqualified from this tournament and cannot re-join."
            : "You have already joined this tournament.",
      });
    }

    // Create isolated participation account
    const participation = new TournamentParticipation({
      userId,
      tournamentId: id,
      initialBalance: tournament.initialBalance,
      availableCash: tournament.initialBalance,
      reservedCash: 0,
      virtualHoldings: [],
      portfolioValue: tournament.initialBalance,
      returnPercent: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      tradeCount: 0,
      rank: tournament.participantCount + 1,
      status: "active",
    });

    await participation.save();

    tournament.participantCount = await TournamentParticipation.countDocuments({
      tournamentId: id,
      status: "active",
    });
    await tournament.save();

    // Recalculate ranks
    recalculateTournamentLeaderboard(id).catch(() => {});

    // Notify user about successful join
    sendTournamentNotification({
      userId,
      event: "tournament_joined",
      title: "Tournament Joined",
      message: `You have successfully joined "${tournament.name}". Starting capital: ₹${Number(tournament.initialBalance).toLocaleString("en-IN")}. Good luck!`,
      metadata: { tournamentId: id, tournamentName: tournament.name },
    });

    return res.status(200).json({
      success: true,
      message: "Successfully joined tournament!",
      data: participation,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You are already a registered participant in this tournament.",
      });
    }
    console.error("Error joining tournament:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join tournament",
      error: error.message,
    });
  }
};

/**
 * Leave an upcoming tournament before it starts
 */
export const leaveTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "Tournament not found",
      });
    }

    await syncTournamentStatus(tournament);

    if (tournament.status !== "upcoming") {
      return res.status(400).json({
        success: false,
        message: "Participants can only leave tournaments that have not yet started.",
      });
    }

    const participation = await TournamentParticipation.findOne({
      tournamentId: id,
      userId,
      status: "active",
    });

    if (!participation) {
      return res.status(400).json({
        success: false,
        message: "You are not participating in this tournament.",
      });
    }

    if (participation.tradeCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot leave a tournament after placing trades.",
      });
    }

    await TournamentParticipation.deleteOne({ _id: participation._id });

    tournament.participantCount = await TournamentParticipation.countDocuments({
      tournamentId: id,
      status: "active",
    });
    await tournament.save();

    return res.status(200).json({
      success: true,
      message: "Successfully left the tournament.",
    });
  } catch (error) {
    console.error("Error leaving tournament:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to leave tournament",
      error: error.message,
    });
  }
};

/**
 * Get current user's isolated participation in a tournament
 */
export const getMyParticipation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    console.log("Fetching participation for user:", userId, "in tournament:", id);
    const participation = await TournamentParticipation.findOne({
      tournamentId: id,
      userId,
      status: "active",
    });

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: "No active participation record found for this tournament.",
      });
    }

    const tournament = await Tournament.findById(id);
    await syncTournamentStatus(tournament);

    return res.status(200).json({
      success: true,
      data: {
        participation,
        tournament: tournament
          ? {
              _id: tournament._id,
              name: tournament.name,
              status: tournament.status,
              tournamentType: tournament.tournamentType,
              initialBalance: tournament.initialBalance,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching participation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch participation data",
      error: error.message,
    });
  }
};

/**
 * Get tournament leaderboard with safe sanitized participant data
 */
export const getTournamentLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 20));

    // Refresh valuations without broadcasting socket update to avoid feedback loops on read
    await recalculateTournamentLeaderboard(id, { emitSocket: false });

    const totalCount = await TournamentParticipation.countDocuments({
      tournamentId: id,
      status: "active",
    });

    const participations = await TournamentParticipation.find({
      tournamentId: id,
      status: "active",
    })
      .sort({ returnPercent: -1, portfolioValue: -1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("userId", "name clientId");

    let currentUserRow = null;
    if (currentUserId) {
      const myPart = await TournamentParticipation.findOne({
        tournamentId: id,
        userId: currentUserId,
        status: "active",
      }).populate("userId", "name clientId");

      if (myPart) {
        currentUserRow = {
          rank: myPart.rank,
          traderName: myPart.userId?.name || "You",
          portfolioValue: myPart.portfolioValue,
          returnPercent: myPart.returnPercent,
          totalPnL: Number((myPart.portfolioValue - myPart.initialBalance).toFixed(2)),
          tradeCount: myPart.tradeCount,
          isCurrentUser: true,
        };
      }
    }

    // Sanitize public leaderboard data: NEVER leak email, phone, JWT or private account details
    const sanitizedLeaderboard = participations.map((p) => {
      const isYou = currentUserId && p.userId?._id?.toString() === currentUserId;
      return {
        _id: p._id,
        rank: p.rank,
        traderName: isYou ? `${p.userId?.name || "Trader"} (You)` : (p.userId?.name || "Trader"),
        portfolioValue: p.portfolioValue,
        returnPercent: p.returnPercent,
        totalPnL: Number((p.portfolioValue - p.initialBalance).toFixed(2)),
        tradeCount: p.tradeCount,
        isCurrentUser: isYou,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        leaderboard: sanitizedLeaderboard,
        currentUser: currentUserRow,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
          totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error getting tournament leaderboard:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard",
      error: error.message,
    });
  }
};

/**
 * Place a paper trade in the tournament
 */
export const placeTrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { symbol, action, orderType, quantity, limitPrice } = req.body;
    const userId = req.user.userId;

    const result = await placeTournamentOrder({
      userId,
      tournamentId: id,
      symbol,
      action,
      orderType,
      quantity,
      limitPrice,
    });

    const isExecuted = result.order.status === "EXECUTED";
    sendTournamentNotification({
      userId,
      event: isExecuted ? "order_executed" : "order_placed",
      title: isExecuted ? `Tournament ${action} Executed` : `Tournament ${action} Order Placed`,
      message: isExecuted
        ? `${action} ${quantity} ${symbol} @ ₹${result.order.executionPrice || result.order.price} executed. Cash remaining: ₹${Number(result.participation.availableCash).toLocaleString("en-IN")}.`
        : `Limit ${action} ${quantity} ${symbol} @ ₹${result.order.price} placed. Cash reserved: ₹${Number(result.order.reservedAmount || 0).toLocaleString("en-IN")}.`,
      metadata: {
        tournamentId: id,
        orderId: result.order._id,
        symbol,
        action,
        orderType,
        quantity,
      },
    });

    return res.status(201).json({
      success: true,
      message: `Virtual ${action} order ${isExecuted ? "executed" : "placed"} successfully!`,
      data: {
        order: result.order,
        availableCash: result.participation.availableCash,
        portfolioValue: result.participation.portfolioValue,
        returnPercent: result.participation.returnPercent,
      },
    });
  } catch (error) {
    console.error("Error placing tournament trade:", error);
    if (req.user?.userId) {
      sendTournamentNotification({
        userId: req.user.userId,
        event: "order_rejected",
        title: `Order Rejected: ${req.body?.action || ""} ${req.body?.symbol || ""}`.trim(),
        message: error.message || "Failed to execute paper trade",
        metadata: { tournamentId: req.params.id, ...req.body },
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to execute paper trade",
    });
  }
};

/**
 * Cancel a pending limit order
 */
export const cancelOrder = async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const userId = req.user.userId;

    const cancelled = await cancelTournamentOrder({
      userId,
      tournamentId: id,
      orderId,
    });

    sendTournamentNotification({
      userId,
      event: "order_cancelled",
      title: "Tournament Order Cancelled",
      message: `Your virtual pending ${cancelled.action} order for ${cancelled.quantity} ${cancelled.symbol} was cancelled.`,
      metadata: { tournamentId: id, orderId },
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: cancelled,
    });
  } catch (error) {
    console.error("Error cancelling tournament order:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};

/**
 * Get user's trade history for a tournament
 */
export const getTournamentOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const orders = await TournamentOrder.find({
      tournamentId: id,
      userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching tournament orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

/**
 * Get current user's history of all joined tournaments
 */
export const getMyTournamentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const participations = await TournamentParticipation.find({ userId })
      .populate("tournamentId")
      .sort({ createdAt: -1 });

    const history = participations
      .filter((p) => p.tournamentId)
      .map((p) => {
        const t = p.tournamentId;
        return {
          participationId: p._id,
          tournamentId: t._id,
          name: t.name,
          tournamentType: t.tournamentType,
          status: t.status,
          startDate: t.startDate,
          endDate: t.endDate,
          initialBalance: p.initialBalance,
          portfolioValue: p.portfolioValue,
          returnPercent: p.returnPercent,
          totalPnL: Number((p.portfolioValue - p.initialBalance).toFixed(2)),
          tradeCount: p.tradeCount,
          finalRank: p.rank,
          totalParticipants: t.participantCount,
        };
      });

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching tournament history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tournament history",
      error: error.message,
    });
  }
};

/**
 * Seed demonstration tournaments for testing & development
 */
export const seedTournaments = async (req, res) => {
  try {
    const now = new Date();

    const seedConfigs = [
      {
        name: "Nifty 50 Pro Traders Championship",
        description:
          "Daily high-octane trading tournament focused on top Indian large-caps. Compete with top paper traders for the highest return %.",
        tournamentType: "daily",
        startDate: new Date(now.getTime() - 2 * 3600 * 1000), // Started 2 hours ago
        endDate: new Date(now.getTime() + 22 * 3600 * 1000), // Ends in 22 hours
        initialBalance: 100000,
        maxParticipants: 150,
        isPrivate: false,
        entryRules: { allowLateJoin: true, minTrades: 1 },
      },
      {
        name: "Weekly Equity Bull Run",
        description:
          "7-day strategic paper trading marathon. Test swing setups, risk management, and portfolio discipline across all market sectors.",
        tournamentType: "weekly",
        startDate: new Date(now.getTime() - 24 * 3600 * 1000), // Started yesterday
        endDate: new Date(now.getTime() + 6 * 24 * 3600 * 1000), // Ends in 6 days
        initialBalance: 150000,
        maxParticipants: 250,
        isPrivate: false,
        entryRules: { allowLateJoin: true, minTrades: 3 },
      },
      {
        name: "Monthly Wealth Sprint - Oct 2026",
        description:
          "Prestigious monthly benchmark tournament. Build an institutional-grade portfolio and claim the Master Trader title on the global leaderboard.",
        tournamentType: "monthly",
        startDate: new Date(now.getTime() - 3 * 24 * 3600 * 1000), // Started 3 days ago
        endDate: new Date(now.getTime() + 27 * 24 * 3600 * 1000), // Ends in 27 days
        initialBalance: 250000,
        maxParticipants: 500,
        isPrivate: false,
        entryRules: { allowLateJoin: true, minTrades: 5 },
      },
      {
        name: "Next-Gen Traders Cup",
        description:
          "Upcoming weekend challenge for emerging algorithmic and discretionary traders. Registration is now open!",
        tournamentType: "weekly",
        startDate: new Date(now.getTime() + 2 * 24 * 3600 * 1000), // Starts in 2 days
        endDate: new Date(now.getTime() + 9 * 24 * 3600 * 1000),
        initialBalance: 100000,
        maxParticipants: 100,
        isPrivate: false,
        entryRules: { allowLateJoin: false, minTrades: 2 },
      },
      {
        name: "Private Alpha League",
        description:
          "Exclusive private trading arena for invited traders. Requires invite code: ALPHA2026.",
        tournamentType: "private",
        startDate: new Date(now.getTime() - 1 * 3600 * 1000),
        endDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
        initialBalance: 200000,
        maxParticipants: 50,
        isPrivate: true,
        inviteCode: "ALPHA2026",
        entryRules: { allowLateJoin: true, minTrades: 1 },
      },
    ];

    const created = [];
    for (const conf of seedConfigs) {
      let tourney = await Tournament.findOne({ name: conf.name });
      if (!tourney) {
        tourney = new Tournament(conf);
      } else {
        Object.assign(tourney, conf);
      }
      await syncTournamentStatus(tourney);
      await tourney.save();
      created.push(tourney);
    }

    logAdminAction({
      adminId: req.user?.userId,
      action: "SEED_TOURNAMENTS",
      targetType: "System",
      targetId: "demo-seeds",
      details: { seededCount: created.length },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully seeded ${created.length} demonstration tournaments.`,
      data: created,
    });
  } catch (error) {
    console.error("Error seeding tournaments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to seed tournaments",
      error: error.message,
    });
  }
};

/**
 * Admin: List tournaments with filters, pagination, and overview statistics
 */
export const adminListTournaments = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const query = {};
    if (type && ["daily", "weekly", "monthly", "private"].includes(type)) {
      query.tournamentType = type;
    }
    if (search && typeof search === "string" && search.trim()) {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    const allTournaments = await Tournament.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email clientId");

    // Sync statuses
    for (const t of allTournaments) {
      await syncTournamentStatus(t);
    }

    let filtered = allTournaments;
    if (status && status !== "all") {
      filtered = allTournaments.filter((t) => t.status === status);
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    const stats = {
      total: allTournaments.length,
      upcoming: allTournaments.filter((t) => t.status === "upcoming").length,
      active: allTournaments.filter((t) => t.status === "active").length,
      completed: allTournaments.filter((t) => t.status === "completed").length,
      cancelled: allTournaments.filter((t) => t.status === "cancelled").length,
      totalParticipants: allTournaments.reduce((sum, t) => sum + (t.participantCount || 0), 0),
    };

    return res.status(200).json({
      success: true,
      data: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
      stats,
    });
  } catch (error) {
    console.error("Admin list tournaments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tournaments for admin",
      error: error.message,
    });
  }
};

/**
 * Admin: Get detailed tournament information
 */
export const adminGetTournamentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id).populate("createdBy", "name email clientId");
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }
    await syncTournamentStatus(tournament);

    const activeParticipantsCount = await TournamentParticipation.countDocuments({
      tournamentId: id,
      status: "active",
    });
    const totalOrdersCount = await TournamentOrder.countDocuments({ tournamentId: id });

    return res.status(200).json({
      success: true,
      data: {
        ...tournament.toObject(),
        activeParticipantsCount,
        totalOrdersCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Update tournament metadata safely
 */
export const adminUpdateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    if (tournament.status === "completed" || tournament.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a ${tournament.status} tournament.`,
      });
    }

    const {
      name,
      description,
      tournamentType,
      maxParticipants,
      isPrivate,
      inviteCode,
      startDate,
      endDate,
      mode,
      entryRules,
      tradingRules,
    } = req.body;

    if (name) {
      const trimmedName = String(name).trim();
      if (trimmedName.toLowerCase() !== tournament.name.toLowerCase()) {
        const existing = await Tournament.findOne({
          _id: { $ne: tournament._id },
          name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: `Another tournament with the name "${trimmedName}" already exists.`,
          });
        }
      }
      tournament.name = trimmedName;
    }

    if (description) tournament.description = String(description).trim();
    if (tournamentType && ["daily", "weekly", "monthly", "private"].includes(tournamentType)) {
      tournament.tournamentType = tournamentType;
    }
    if (mode && ["standard", "custom"].includes(mode)) {
      tournament.mode = mode;
    }

    if (startDate && tournament.status === "upcoming") {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid start date format." });
      }
      if (start >= new Date(tournament.endDate)) {
        return res.status(400).json({ success: false, message: "Start date must be before end date." });
      }
      tournament.startDate = start;
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid end date format." });
      }
      if (end <= new Date(tournament.startDate)) {
        return res.status(400).json({ success: false, message: "End date must be after start date." });
      }
      tournament.endDate = end;
    }

    if (maxParticipants !== undefined) {
      const numMax = Number(maxParticipants);
      if (isNaN(numMax) || numMax < Math.max(2, tournament.participantCount)) {
        return res.status(400).json({
          success: false,
          message: `Max participants cannot be less than current participant count (${tournament.participantCount}) or 2.`,
        });
      }
      tournament.maxParticipants = numMax;
    }
    if (isPrivate !== undefined) {
      tournament.isPrivate = Boolean(isPrivate);
      if (tournament.isPrivate && inviteCode) {
        tournament.inviteCode = String(inviteCode).trim().toUpperCase();
      } else if (!tournament.isPrivate) {
        tournament.inviteCode = null;
      }
    }
    if (entryRules && typeof entryRules === "object") {
      tournament.entryRules = {
        ...tournament.entryRules,
        ...entryRules,
      };
    }
    if (tradingRules && typeof tradingRules === "object") {
      tournament.tradingRules = {
        ...tournament.tradingRules,
        ...tradingRules,
      };
    }

    await syncTournamentStatus(tournament);
    await tournament.save();

    logAdminAction({
      adminId: req.user?.userId,
      action: "UPDATE_TOURNAMENT_METADATA",
      targetType: "Tournament",
      targetId: tournament._id,
      details: { name: tournament.name, maxParticipants: tournament.maxParticipants },
    });

    return res.status(200).json({
      success: true,
      message: "Tournament updated successfully",
      data: tournament,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another tournament with this name already exists.",
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Enforce valid lifecycle status transitions
 */
export const adminUpdateTournamentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    const validStatuses = ["upcoming", "active", "completed", "cancelled"];
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${targetStatus}. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const currentStatus = tournament.status;

    if (currentStatus === targetStatus) {
      return res.status(200).json({
        success: true,
        message: `Tournament is already in status: ${targetStatus}`,
        data: tournament,
      });
    }

    if (currentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot change status of an already completed tournament.",
      });
    }

    if (currentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot change status of a cancelled tournament.",
      });
    }

    if (currentStatus === "upcoming" && targetStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "Upcoming tournament must be started before it can be completed.",
      });
    }

    const now = new Date();

    if (targetStatus === "active") {
      // Start tournament: if start date was in future, set to now
      if (tournament.startDate > now) {
        tournament.startDate = now;
      }
      tournament.status = "active";
      await tournament.save();
      await recalculateTournamentLeaderboard(id, { emitSocket: true });

      if (currentStatus === "upcoming") {
        try {
          const parts = await TournamentParticipation.find({
            tournamentId: id,
            status: "active",
          });
          for (const part of parts) {
            sendTournamentNotification({
              userId: part.userId,
              event: "tournament_started",
              title: `Tournament Started: ${tournament.name}`,
              message: `"${tournament.name}" is now live! Trading has begun.`,
              metadata: { tournamentId: id },
            });
          }
        } catch (_e) {}
      }
    } else if (targetStatus === "completed") {
      // End tournament: set end date to now, recalculate final leaderboard and release reservations
      tournament.endDate = now;
      tournament.status = "completed";
      await tournament.save();
      await finalizeTournamentCompletion(id);
    } else if (targetStatus === "cancelled") {
      tournament.status = "cancelled";
      await tournament.save();

      // Cancel all pending limit orders and release reserved cash atomically
      const pendingOrders = await TournamentOrder.find({
        tournamentId: id,
        status: "PENDING",
      });

      for (const order of pendingOrders) {
        const cancelled = await TournamentOrder.findOneAndUpdate(
          { _id: order._id, status: "PENDING" },
          { $set: { status: "CANCELLED", rejectionReason: "Tournament cancelled by administrator" } },
          { new: false }
        );
        if (!cancelled) continue;

        if (cancelled.action === "BUY" && cancelled.reservedAmount > 0) {
          await TournamentParticipation.findOneAndUpdate(
            { _id: cancelled.participationId },
            {
              $inc: {
                availableCash: cancelled.reservedAmount,
                reservedCash: -cancelled.reservedAmount,
              },
            }
          );
        }
      }

      await recalculateTournamentLeaderboard(id, { emitSocket: true });
    }

    logAdminAction({
      adminId: req.user?.userId,
      action: "UPDATE_TOURNAMENT_STATUS",
      targetType: "Tournament",
      targetId: tournament._id,
      details: { previousStatus: currentStatus, newStatus: targetStatus },
    });

    return res.status(200).json({
      success: true,
      message: `Tournament status updated from ${currentStatus} to ${targetStatus}`,
      data: tournament,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: View participants in a tournament (read-only)
 */
export const adminGetTournamentParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    const query = { tournamentId: id };
    if (status && status !== "all") {
      query.status = status;
    }

    const totalCount = await TournamentParticipation.countDocuments(query);
    const participants = await TournamentParticipation.find(query)
      .sort({ rank: 1, returnPercent: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("userId", "name email mobile clientId");

    return res.status(200).json({
      success: true,
      data: participants,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: View all orders placed in a tournament (read-only)
 */
export const adminGetTournamentOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, status, symbol } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

    const query = { tournamentId: id };
    if (status && status !== "all") {
      query.status = status;
    }
    if (symbol) {
      query.symbol = String(symbol).trim().toUpperCase();
    }

    const totalCount = await TournamentOrder.countDocuments(query);
    const orders = await TournamentOrder.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("userId", "name clientId email");

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin: Disqualify a participant and cancel their pending orders
 */
export const adminDisqualifyParticipant = async (req, res) => {
  try {
    const { id, participationId } = req.params;
    const { reason = "Disqualified by administrator" } = req.body;

    const participation = await TournamentParticipation.findOne({
      _id: participationId,
      tournamentId: id,
    }).populate("userId", "name email clientId");

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: "Participant record not found in this tournament.",
      });
    }

    if (participation.status === "disqualified") {
      return res.status(400).json({
        success: false,
        message: "Participant is already disqualified.",
      });
    }

    participation.status = "disqualified";
    await participation.save();

    // Cancel any pending limit orders and release reserved cash
    const pendingOrders = await TournamentOrder.find({
      participationId,
      tournamentId: id,
      status: "PENDING",
    });

    for (const order of pendingOrders) {
      order.status = "CANCELLED";
      order.rejectionReason = `Disqualification: ${reason}`;
      await order.save();

      if (order.action === "BUY" && order.reservedAmount > 0) {
        participation.availableCash = Number(
          (participation.availableCash + order.reservedAmount).toFixed(2)
        );
        participation.reservedCash = Math.max(
          0,
          Number(((participation.reservedCash || 0) - order.reservedAmount).toFixed(2))
        );
      }
    }
    await participation.save();

    const tournament = await Tournament.findById(id);
    if (tournament) {
      tournament.participantCount = await TournamentParticipation.countDocuments({
        tournamentId: id,
        status: "active",
      });
      await tournament.save();
    }

    await recalculateTournamentLeaderboard(id, { emitSocket: true });

    logAdminAction({
      adminId: req.user?.userId,
      action: "DISQUALIFY_PARTICIPANT",
      targetType: "TournamentParticipation",
      targetId: participationId,
      details: {
        tournamentId: id,
        userId: participation.userId?._id,
        userName: participation.userId?.name,
        reason,
      },
    });

    // Notify the disqualified user
    if (participation.userId?._id) {
      sendTournamentNotification({
        userId: participation.userId._id,
        event: "tournament_disqualified",
        title: "Tournament Disqualification",
        message: `You have been disqualified from "${tournament?.name || "a tournament"}". Reason: ${reason}`,
        metadata: {
          tournamentId: id,
          tournamentName: tournament?.name,
          reason,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Participant ${participation.userId?.name || ""} has been disqualified.`,
      data: participation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
