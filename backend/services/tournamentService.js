import Tournament from "../models/TournamentModel.js";
import TournamentParticipation from "../models/TournamentParticipationModel.js";
import TournamentOrder from "../models/TournamentOrderModel.js";
import User from "../models/UserModel.js";
import { getTrueDataPrice, getTrueDataSymbols, isTrueDataConnected } from "./trueDataService.js";
import marketStocks from "../data/marketStocks.js";
import { io } from "../index.js";

/**
 * Finalizes a completed tournament by cancelling pending orders,
 * releasing reservations, calculating final ranks, and dispatching notifications.
 */
export const finalizeTournamentCompletion = async (tournamentId) => {
  if (!tournamentId) return;
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) return;

  // 1. Cancel all pending limit orders and release reserved cash atomically
  const pendingOrders = await TournamentOrder.find({
    tournamentId,
    status: "PENDING",
  });

  for (const order of pendingOrders) {
    const cancelled = await TournamentOrder.findOneAndUpdate(
      { _id: order._id, status: "PENDING" },
      { $set: { status: "CANCELLED", rejectionReason: "Tournament completed" } },
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

  // 2. Final recalculation of leaderboard & eligibility
  const ranked = await recalculateTournamentLeaderboard(tournamentId, { emitSocket: true });

  // 3. Set finalRank on each participant
  for (const part of ranked) {
    part.finalRank = part.rank;
    await part.save();

    // 4. Send tournament completion notification (deduplicated)
    try {
      const Notification = (await import("../models/NotificationModel.js")).default;
      const targetUserId = part.userId?._id || part.userId;
      const alreadyNotified = await Notification.findOne({
        userId: targetUserId,
        event: { $in: ["tournament_completed", "final_rank_available"] },
        "metadata.tournamentId": tournament._id,
      });

      if (!alreadyNotified) {
        await Notification.create({
          userId: targetUserId,
          type: "tournament",
          event: "tournament_completed",
          title: `Tournament Completed: ${tournament.name}`,
          message: `"${tournament.name}" has completed. Your final rank is #${part.rank} with a return of ${part.returnPercent}%.`,
          priority: "normal",
          metadata: {
            tournamentId: tournament._id,
            finalRank: part.rank,
            returnPercent: part.returnPercent,
            portfolioValue: part.portfolioValue,
          },
        });

        await Notification.create({
          userId: targetUserId,
          type: "tournament",
          event: "final_rank_available",
          title: `Final Rank Available: ${tournament.name}`,
          message: `Official final ranks are published for "${tournament.name}". You finished #${part.rank} with a return of ${part.returnPercent}%.`,
          priority: "normal",
          metadata: {
            tournamentId: tournament._id,
            finalRank: part.rank,
            returnPercent: part.returnPercent,
            portfolioValue: part.portfolioValue,
          },
        });
      }
    } catch (_err) {
      // Non-fatal
    }
  }
};

/**
 * Dynamically computes and synchronizes tournament status based on current time
 */
export const syncTournamentStatus = async (tournament) => {
  if (!tournament) return null;
  if (tournament.status === "cancelled") return tournament;

  const now = new Date();
  let computedStatus = tournament.status;

  if (now < new Date(tournament.startDate)) {
    computedStatus = "upcoming";
  } else if (now >= new Date(tournament.startDate) && now <= new Date(tournament.endDate)) {
    computedStatus = "active";
  } else if (now > new Date(tournament.endDate)) {
    computedStatus = "completed";
  }

  if (tournament.status !== computedStatus) {
    const prevStatus = tournament.status;
    tournament.status = computedStatus;
    if (typeof tournament.save === "function") {
      await tournament.save();
    }
    if (computedStatus === "active" && prevStatus === "upcoming") {
      try {
        const Notification = (await import("../models/NotificationModel.js")).default;
        const parts = await TournamentParticipation.find({
          tournamentId: tournament._id,
          status: "active",
        });
        for (const part of parts) {
          const targetUserId = part.userId?._id || part.userId;
          await Notification.create({
            userId: targetUserId,
            type: "tournament",
            event: "tournament_started",
            title: `Tournament Started: ${tournament.name}`,
            message: `"${tournament.name}" is now live! Trading has begun.`,
            priority: "normal",
            metadata: { tournamentId: tournament._id },
          }).catch(() => {});
        }
      } catch (_e) {
        // Non-fatal
      }
    }
    if (computedStatus === "completed" && prevStatus !== "completed") {
      await finalizeTournamentCompletion(tournament._id);
    }
  }

  return tournament;
};

/**
 * Safely fetches live market price for a symbol using TrueData
 */
export const getSafeMarketPrice = (symbol) => {
  if (!symbol) {
    throw new Error("Symbol is required");
  }

  const normalized = String(symbol).trim().toUpperCase();

  try {
    const liveData = getTrueDataPrice(normalized);
    if (
      liveData &&
      typeof liveData.currentPrice === "number" &&
      Number.isFinite(liveData.currentPrice) &&
      liveData.currentPrice > 0
    ) {
      return {
        price: Number(liveData.currentPrice.toFixed(2)),
        timestamp: liveData.timestamp || new Date(),
        isLive: true,
      };
    }
  } catch (_err) {
    // TrueData live tick may not be cached if market is closed or disconnected
  }

  throw new Error(`Live market price currently unavailable for ${normalized}. Orders require valid market data.`);
};

/**
 * Checks whether market data is currently active and gets cached quotes
 */
export const getMarketDataStatus = () => {
  return {
    connected: isTrueDataConnected(),
    supportedSymbols: getTrueDataSymbols(),
  };
};

/**
 * Recalculates portfolio valuation and updates ranking deterministically
 */
export const recalculateTournamentLeaderboard = async (
  tournamentId,
  { emitSocket = true } = {}
) => {
  if (!tournamentId) return [];

  const tournament = await Tournament.findById(tournamentId);

  const participations = await TournamentParticipation.find({
    tournamentId,
    status: "active",
  }).populate("userId", "name clientId");

  if (!participations.length) return [];

  const minTradesRequired = tournament?.entryRules?.minTrades || 0;
  const rankingMetric = tournament?.tradingRules?.rankingMetric || "returnPercent";

  // 1. Recalculate metrics for each participant
  for (const part of participations) {
    let holdingsMarketValue = 0;
    let totalUnrealizedPnL = 0;

    const updatedHoldings = part.virtualHoldings.map((h) => {
      let currentPrice = h.averagePrice;
      try {
        const quote = getSafeMarketPrice(h.symbol);
        currentPrice = quote.price;
      } catch (_e) {
        // When live market price is temporarily unavailable, use last known currentPrice or averagePrice
        currentPrice = h.currentPrice || h.averagePrice;
      }

      const marketVal = Number((h.quantity * currentPrice).toFixed(2));
      const unPnL = Number(((currentPrice - h.averagePrice) * h.quantity).toFixed(2));

      holdingsMarketValue += marketVal;
      totalUnrealizedPnL += unPnL;

      return {
        symbol: h.symbol,
        quantity: h.quantity,
        averagePrice: h.averagePrice,
        currentPrice,
        marketValue: marketVal,
        unrealizedPnL: unPnL,
      };
    });

    const portfolioVal = Number(
      (part.availableCash + (part.reservedCash || 0) + holdingsMarketValue).toFixed(2)
    );
    const totalPnL = Number((portfolioVal - part.initialBalance).toFixed(2));
    const retPercent =
      part.initialBalance > 0
        ? Number(((totalPnL / part.initialBalance) * 100).toFixed(2))
        : 0;

    // Minimum trades eligibility enforcement
    part.isEligible = Boolean(minTradesRequired === 0 || (part.tradeCount || 0) >= minTradesRequired);
    part.virtualHoldings = updatedHoldings;
    part.unrealizedPnL = Number(totalUnrealizedPnL.toFixed(2));
    part.portfolioValue = portfolioVal;
    part.returnPercent = retPercent;

    await part.save();
  }

  // 2. Deterministic sort:
  // - Eligible active participants rank before ineligible
  // - Primary criterion: rankingMetric (returnPercent, portfolioValue, or realizedPnL)
  // - Secondary tie-breaker: Portfolio Value DESC
  // - Tertiary tie-breaker: Earliest join date ASC
  participations.sort((a, b) => {
    if (a.isEligible !== b.isEligible) {
      return a.isEligible ? -1 : 1;
    }
    if (rankingMetric === "portfolioValue") {
      if (b.portfolioValue !== a.portfolioValue) return b.portfolioValue - a.portfolioValue;
    } else if (rankingMetric === "realizedPnL") {
      if ((b.realizedPnL || 0) !== (a.realizedPnL || 0)) return (b.realizedPnL || 0) - (a.realizedPnL || 0);
    } else {
      if (b.returnPercent !== a.returnPercent) return b.returnPercent - a.returnPercent;
    }
    if (b.portfolioValue !== a.portfolioValue) {
      return b.portfolioValue - a.portfolioValue;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  // 3. Update ranks
  for (let i = 0; i < participations.length; i++) {
    const rank = i + 1;
    if (participations[i].rank !== rank) {
      participations[i].rank = rank;
      await participations[i].save();
    }
  }

  // 4. Emit live update over Socket.IO if available and requested
  if (emitSocket) {
    try {
      if (io) {
        io.to(`tournament:${tournamentId}`).emit("tournament-leaderboard-update", {
          tournamentId,
          timestamp: new Date(),
        });
      }
    } catch (_socketErr) {
      // non-fatal
    }
  }

  return participations;
};

/**
 * Places an isolated paper BUY or SELL order
 */
export const placeTournamentOrder = async ({
  userId,
  tournamentId,
  symbol,
  action,
  orderType,
  quantity,
  limitPrice,
}) => {
  const normalizedSymbol = String(symbol).trim().toUpperCase();
  const validAction = String(action).toUpperCase();
  const validOrderType = orderType === "Limit" ? "Limit" : "Market";
  const numQty = Number(quantity);

  if (!["BUY", "SELL"].includes(validAction)) {
    throw new Error("Invalid order action. Must be BUY or SELL.");
  }
  if (!Number.isInteger(numQty) || numQty <= 0) {
    throw new Error("Quantity must be a positive integer.");
  }

  // 1. Verify tournament
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) {
    throw new Error("Tournament not found.");
  }
  await syncTournamentStatus(tournament);

  if (tournament.status !== "active") {
    throw new Error(`Trading is only allowed in active tournaments. Current status: ${tournament.status}`);
  }

  // Check allowed symbols rule
  const allowedSymbols = tournament.tradingRules?.allowedSymbols?.length
    ? tournament.tradingRules.allowedSymbols
    : tournament.entryRules?.allowedSymbols || [];
  if (allowedSymbols.length > 0 && !allowedSymbols.includes(normalizedSymbol)) {
    throw new Error(`Symbol ${normalizedSymbol} is not permitted in this tournament.`);
  }

  // Check allowed order types rule
  const allowedOrderTypes = tournament.tradingRules?.allowedOrderTypes?.length
    ? tournament.tradingRules.allowedOrderTypes
    : ["Market", "Limit"];
  if (!allowedOrderTypes.includes(validOrderType)) {
    throw new Error(`Order type ${validOrderType} is not permitted in this tournament.`);
  }

  // Check allowed actions rule
  const allowedActions = tournament.tradingRules?.allowedActions?.length
    ? tournament.tradingRules.allowedActions
    : ["BUY", "SELL"];
  if (!allowedActions.includes(validAction)) {
    throw new Error(`Action ${validAction} is not permitted in this tournament.`);
  }

  // Check max order quantity rule
  const maxOrderQty = tournament.tradingRules?.maxOrderQty;
  if (maxOrderQty > 0 && numQty > maxOrderQty) {
    throw new Error(`Order quantity (${numQty}) exceeds tournament maximum limit of ${maxOrderQty} shares.`);
  }

  // 2. Fetch participation
  const anyPart = await TournamentParticipation.findOne({
    tournamentId,
    userId,
  });

  if (!anyPart) {
    throw new Error("You must join this tournament before trading.");
  }
  if (anyPart.status === "disqualified") {
    throw new Error("You have been disqualified from this tournament and cannot trade.");
  }
  let participation = anyPart;

  // Check max total orders per participant rule
  const maxOrders = tournament.tradingRules?.maxOrders;
  if (maxOrders > 0) {
    const totalOrders = await TournamentOrder.countDocuments({
      participationId: participation._id,
    });
    if (totalOrders >= maxOrders) {
      throw new Error(`Maximum order limit (${maxOrders}) reached for this tournament.`);
    }
  }

  // Check max open positions rule for BUY orders
  if (validAction === "BUY") {
    const maxOpenPositions = tournament.tradingRules?.maxOpenPositions;
    if (maxOpenPositions > 0) {
      const alreadyHeld = participation.virtualHoldings.some(
        (h) => h.symbol === normalizedSymbol && h.quantity > 0
      );
      if (!alreadyHeld) {
        const currentActivePositions = participation.virtualHoldings.filter(
          (h) => h.quantity > 0
        ).length;
        if (currentActivePositions >= maxOpenPositions) {
          throw new Error(`Maximum open positions limit (${maxOpenPositions}) reached for this tournament.`);
        }
      }
    }

    // Check per-stock quantity limit rule
    const perStockQtyLimit = tournament.tradingRules?.perStockQtyLimit;
    if (perStockQtyLimit > 0) {
      const existingHolding = participation.virtualHoldings.find(
        (h) => h.symbol === normalizedSymbol
      );
      const currentQty = existingHolding ? existingHolding.quantity : 0;
      if (currentQty + numQty > perStockQtyLimit) {
        throw new Error(
          `Holding limit of ${perStockQtyLimit} shares exceeded for ${normalizedSymbol}. Currently held: ${currentQty}.`
        );
      }
    }
  }

  // 3. Obtain execution price or validate limit price
  const quote = getSafeMarketPrice(normalizedSymbol);
  const currentMarketPrice = quote.price;

  const stockInfo = marketStocks.find((s) => s.symbol === normalizedSymbol) || {
    companyName: normalizedSymbol,
  };

  let executionPrice = null;
  let orderStatus = "PENDING";
  let reservedAmount = 0;
  let realizedPnL = 0;

  if (validOrderType === "Market") {
    executionPrice = currentMarketPrice;
    orderStatus = "EXECUTED";
  } else {
    // Limit order
    const numLimitPrice = Number(limitPrice);
    if (!Number.isFinite(numLimitPrice) || numLimitPrice <= 0) {
      throw new Error("Valid limit price is required for Limit orders.");
    }

    if (validAction === "BUY") {
      if (currentMarketPrice <= numLimitPrice) {
        // Satisfies limit immediately
        executionPrice = numLimitPrice;
        orderStatus = "EXECUTED";
      } else {
        // Pending limit BUY: reserve cash
        orderStatus = "PENDING";
        reservedAmount = Number((numQty * numLimitPrice).toFixed(2));
      }
    } else {
      // SELL limit
      if (currentMarketPrice >= numLimitPrice) {
        executionPrice = numLimitPrice;
        orderStatus = "EXECUTED";
      } else {
        orderStatus = "PENDING";
      }
    }
  }

  // 4. Handle BUY Logic
  if (validAction === "BUY") {
    if (orderStatus === "EXECUTED") {
      const totalCost = Number((numQty * executionPrice).toFixed(2));

      // Atomic deduction to prevent concurrent overspend
      const partDoc = await TournamentParticipation.findOneAndUpdate(
        {
          _id: participation._id,
          userId,
          status: "active",
          availableCash: { $gte: totalCost },
        },
        {
          $inc: { availableCash: -totalCost },
        },
        { new: true }
      );

      if (!partDoc) {
        throw new Error(
          `Insufficient virtual cash. Required: ₹${totalCost.toLocaleString(
            "en-IN"
          )}, Available: ₹${participation.availableCash.toLocaleString("en-IN")}`
        );
      }

      // Add to virtual holdings
      const existingHoldingIndex = partDoc.virtualHoldings.findIndex(
        (h) => h.symbol === normalizedSymbol
      );

      if (existingHoldingIndex >= 0) {
        const existing = partDoc.virtualHoldings[existingHoldingIndex];
        const newTotalQty = existing.quantity + numQty;
        const newAvgPrice =
          (existing.quantity * existing.averagePrice + totalCost) / newTotalQty;

        existing.quantity = newTotalQty;
        existing.averagePrice = Number(newAvgPrice.toFixed(2));
        existing.currentPrice = executionPrice;
        existing.marketValue = Number((newTotalQty * executionPrice).toFixed(2));
        existing.unrealizedPnL = Number(
          ((executionPrice - existing.averagePrice) * newTotalQty).toFixed(2)
        );
      } else {
        partDoc.virtualHoldings.push({
          symbol: normalizedSymbol,
          quantity: numQty,
          averagePrice: executionPrice,
          currentPrice: executionPrice,
          marketValue: totalCost,
          unrealizedPnL: 0,
        });
      }

      partDoc.tradeCount += 1;
      await partDoc.save();
      participation = partDoc;
    } else {
      // Pending Limit BUY: reserve cash atomically
      const partDoc = await TournamentParticipation.findOneAndUpdate(
        {
          _id: participation._id,
          userId,
          status: "active",
          availableCash: { $gte: reservedAmount },
        },
        {
          $inc: {
            availableCash: -reservedAmount,
            reservedCash: reservedAmount,
          },
        },
        { new: true }
      );

      if (!partDoc) {
        throw new Error(
          `Insufficient virtual cash for limit order. Required: ₹${reservedAmount.toLocaleString(
            "en-IN"
          )}, Available: ₹${participation.availableCash.toLocaleString("en-IN")}`
        );
      }
      participation = partDoc;
    }
  }

  // 5. Handle SELL Logic
  if (validAction === "SELL") {
    const existingHolding = participation.virtualHoldings.find(
      (h) => h.symbol === normalizedSymbol
    );

    if (!existingHolding || existingHolding.quantity <= 0) {
      throw new Error(
        `You do not hold any shares of ${normalizedSymbol} to sell.`
      );
    }

    // Check currently pending SELL orders to prevent overselling holdings across concurrent/pending orders
    const pendingSellOrders = await TournamentOrder.find({
      participationId: participation._id,
      tournamentId,
      symbol: normalizedSymbol,
      action: "SELL",
      status: "PENDING",
    });
    const reservedQty = pendingSellOrders.reduce((sum, o) => sum + o.quantity, 0);
    const availableToSell = existingHolding.quantity - reservedQty;

    if (availableToSell < numQty) {
      throw new Error(
        `Insufficient available holding quantity for ${normalizedSymbol}. Total holding: ${existingHolding.quantity}, Reserved in pending orders: ${reservedQty}, Available to sell: ${availableToSell}`
      );
    }

    if (orderStatus === "EXECUTED") {
      const costBasis = Number((numQty * existingHolding.averagePrice).toFixed(2));
      const revenue = Number((numQty * executionPrice).toFixed(2));
      realizedPnL = Number((revenue - costBasis).toFixed(2));

      participation.availableCash = Number(
        (participation.availableCash + revenue).toFixed(2)
      );
      participation.realizedPnL = Number(
        (participation.realizedPnL + realizedPnL).toFixed(2)
      );

      // Deduct shares
      existingHolding.quantity -= numQty;
      if (existingHolding.quantity === 0) {
        participation.virtualHoldings = participation.virtualHoldings.filter(
          (h) => h.symbol !== normalizedSymbol
        );
      } else {
        existingHolding.marketValue = Number(
          (existingHolding.quantity * executionPrice).toFixed(2)
        );
        existingHolding.unrealizedPnL = Number(
          (
            (executionPrice - existingHolding.averagePrice) *
            existingHolding.quantity
          ).toFixed(2)
        );
      }

      participation.tradeCount += 1;
      await participation.save();
    }
  }

  // 6. Save order record
  const order = new TournamentOrder({
    participationId: participation._id,
    tournamentId,
    userId,
    symbol: normalizedSymbol,
    companyName: stockInfo.companyName,
    action: validAction,
    orderType: validOrderType,
    quantity: numQty,
    price: validOrderType === "Market" ? currentMarketPrice : Number(limitPrice),
    executionPrice,
    status: orderStatus,
    executedAt: orderStatus === "EXECUTED" ? new Date() : null,
    reservedAmount,
    realizedPnL,
  });

  await order.save();

  // 7. Update leaderboard valuations asynchronously
  recalculateTournamentLeaderboard(tournamentId).catch((err) =>
    console.error("Leaderboard recalculation error:", err.message)
  );

  return { order, participation };
};

/**
 * Cancels an eligible pending tournament limit order atomically
 */
export const cancelTournamentOrder = async ({ userId, tournamentId, orderId }) => {
  // Atomically find and mark order as CANCELLED to prevent race conditions & double-releases
  const order = await TournamentOrder.findOneAndUpdate(
    {
      _id: orderId,
      tournamentId,
      userId,
      status: "PENDING",
    },
    {
      $set: {
        status: "CANCELLED",
        rejectionReason: "Cancelled by user",
      },
    },
    { new: false }
  );

  if (!order) {
    throw new Error("Pending order not found or already processed.");
  }

  if (order.action === "BUY" && order.reservedAmount > 0) {
    // Atomically release reserved cash back to available
    await TournamentParticipation.findOneAndUpdate(
      {
        _id: order.participationId,
        userId,
      },
      {
        $inc: {
          availableCash: order.reservedAmount,
          reservedCash: -order.reservedAmount,
        },
      }
    );
  }

  // Recalculate leaderboard after cancellation
  recalculateTournamentLeaderboard(tournamentId).catch(() => {});

  const updatedOrder = await TournamentOrder.findById(orderId);
  return updatedOrder;
};

/**
 * Checks pending tournament limit orders against updated market prices
 */
export const checkPendingTournamentLimitOrders = async (symbol, currentPrice) => {
  if (!symbol || !Number.isFinite(currentPrice) || currentPrice <= 0) return;

  const normalized = String(symbol).trim().toUpperCase();
  const pendingOrders = await TournamentOrder.find({
    symbol: normalized,
    status: "PENDING",
    orderType: "Limit",
  });

  if (!pendingOrders.length) return;

  const executedTournaments = new Set();

  for (const order of pendingOrders) {
    try {
      const participation = await TournamentParticipation.findById(
        order.participationId
      );
      if (!participation || participation.status !== "active") continue;

      if (order.action === "BUY" && currentPrice <= order.price) {
        // Atomic lock check to prevent concurrent double-execution or race with cancellation
        const lockedOrder = await TournamentOrder.findOneAndUpdate(
          { _id: order._id, status: "PENDING" },
          { $set: { status: "PROCESSING" } },
          { new: true }
        );
        if (!lockedOrder) continue;

        // Execute BUY Limit Order
        const totalCost = Number((order.quantity * order.price).toFixed(2));
        participation.reservedCash = Math.max(
          0,
          Number(((participation.reservedCash || 0) - order.reservedAmount).toFixed(2))
        );

        const existingHolding = participation.virtualHoldings.find(
          (h) => h.symbol === normalized
        );

        if (existingHolding) {
          const newQty = existingHolding.quantity + order.quantity;
          const newAvg =
            (existingHolding.quantity * existingHolding.averagePrice + totalCost) /
            newQty;
          existingHolding.quantity = newQty;
          existingHolding.averagePrice = Number(newAvg.toFixed(2));
        } else {
          participation.virtualHoldings.push({
            symbol: normalized,
            quantity: order.quantity,
            averagePrice: order.price,
            currentPrice,
            marketValue: totalCost,
            unrealizedPnL: 0,
          });
        }

        participation.tradeCount += 1;
        await participation.save();

        order.status = "EXECUTED";
        order.executionPrice = order.price;
        order.executedAt = new Date();
        await order.save();

        executedTournaments.add(order.tournamentId.toString());

        // Notify participant about order execution
        try {
          const Notification = (await import("../models/NotificationModel.js")).default;
          await Notification.create({
            userId: order.userId,
            type: "tournament",
            event: "order_executed",
            title: `Limit BUY Executed: ${order.symbol}`,
            message: `Your pending Limit BUY order for ${order.quantity} ${order.symbol} @ ₹${order.price} has executed.`,
            priority: "normal",
            metadata: {
              tournamentId: order.tournamentId,
              orderId: order._id,
              symbol: order.symbol,
              action: "BUY",
            },
          });
        } catch (_nErr) {}
      } else if (order.action === "SELL" && currentPrice >= order.price) {
        const lockedOrder = await TournamentOrder.findOneAndUpdate(
          { _id: order._id, status: "PENDING" },
          { $set: { status: "PROCESSING" } },
          { new: true }
        );
        if (!lockedOrder) continue;

        // Execute SELL Limit Order
        const existingHolding = participation.virtualHoldings.find(
          (h) => h.symbol === normalized
        );

        if (existingHolding && existingHolding.quantity >= order.quantity) {
          const revenue = Number((order.quantity * order.price).toFixed(2));
          const costBasis = Number(
            (order.quantity * existingHolding.averagePrice).toFixed(2)
          );
          const pnl = Number((revenue - costBasis).toFixed(2));

          participation.availableCash = Number(
            (participation.availableCash + revenue).toFixed(2)
          );
          participation.realizedPnL = Number(
            (participation.realizedPnL + pnl).toFixed(2)
          );

          existingHolding.quantity -= order.quantity;
          if (existingHolding.quantity === 0) {
            participation.virtualHoldings = participation.virtualHoldings.filter(
              (h) => h.symbol !== normalized
            );
          }

          participation.tradeCount += 1;
          await participation.save();

          order.status = "EXECUTED";
          order.executionPrice = order.price;
          order.executedAt = new Date();
          order.realizedPnL = pnl;
          await order.save();

          executedTournaments.add(order.tournamentId.toString());

          // Notify participant about order execution
          try {
            const Notification = (await import("../models/NotificationModel.js")).default;
            await Notification.create({
              userId: order.userId,
              type: "tournament",
              event: "order_executed",
              title: `Limit SELL Executed: ${order.symbol}`,
              message: `Your pending Limit SELL order for ${order.quantity} ${order.symbol} @ ₹${order.price} has executed.`,
              priority: "normal",
              metadata: {
                tournamentId: order.tournamentId,
                orderId: order._id,
                symbol: order.symbol,
                action: "SELL",
              },
            });
          } catch (_nErr) {}
        } else {
          // Could not execute (e.g. holding changed); revert lock
          await TournamentOrder.updateOne({ _id: order._id }, { $set: { status: "PENDING" } });
        }
      }
    } catch (err) {
      console.error(`Error processing limit order ${order._id}:`, err.message);
      await TournamentOrder.updateOne(
        { _id: order._id, status: "PROCESSING" },
        { $set: { status: "PENDING" } }
      ).catch(() => {});
    }
  }

  // Recalculate valuations ONLY for tournaments that had executed orders!
  // This prevents socket tick floods when orders are simply pending.
  for (const tid of executedTournaments) {
    recalculateTournamentLeaderboard(tid).catch(() => {});
  }
};

/**
 * Background lifecycle worker: checks upcoming and active tournaments,
 * activates upcoming ones when startDate arrives, and finalizes completed ones
 * when endDate passes.
 */
export const syncActiveTournamentsLifecycle = async () => {
  try {
    const tournaments = await Tournament.find({
      status: { $in: ["upcoming", "active"] },
    });
    for (const t of tournaments) {
      await syncTournamentStatus(t);
    }
  } catch (err) {
    // Non-fatal background error
  }
};
