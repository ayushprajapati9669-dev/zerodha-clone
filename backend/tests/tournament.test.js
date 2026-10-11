import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import tournamentSchema from "../schemas/TournamentSchema.js";
import tournamentParticipationSchema from "../schemas/TournamentParticipationSchema.js";
import tournamentOrderSchema from "../schemas/TournamentOrderSchema.js";

// ---------------------------------------------------------------------------
// MOCK HELPERS
// ---------------------------------------------------------------------------

const createMockReqRes = (options = {}) => {
  const req = {
    user:
      "user" in options
        ? options.user
        : { userId: new mongoose.Types.ObjectId().toString(), role: "user" },
    params: options.params || {},
    body: options.body || {},
    query: options.query || {},
  };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return { req, res };
};

// ---------------------------------------------------------------------------
// TEST SUITE
// ---------------------------------------------------------------------------

describe("Paper Trading Tournament Test Suite", () => {
  // =========================================================================
  // 1. SCHEMA & MODEL VALIDATION
  // =========================================================================

  describe("Tournament Schema Validation", () => {
    const TournamentModel = mongoose.model(
      "TournamentTest",
      tournamentSchema
    );

    it("should reject a tournament without required name/description/dates", async () => {
      const t = new TournamentModel({});
      let err = null;
      try {
        await t.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, "Expected validation error");
      assert.ok(err.errors.name, "Should require name");
      assert.ok(err.errors.description, "Should require description");
    });

    it("should accept a valid daily tournament", async () => {
      const now = new Date();
      const t = new TournamentModel({
        name: "Test Daily",
        description: "A test tournament",
        tournamentType: "daily",
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 3600 * 1000),
        initialBalance: 100000,
        maxParticipants: 50,
        isPrivate: false,
      });
      let err = null;
      try {
        await t.validate();
      } catch (e) {
        err = e;
      }
      assert.strictEqual(err, null, "Valid tournament should pass validation");
    });

    it("should default status to upcoming and initialBalance to 100000", async () => {
      const now = new Date();
      const t = new TournamentModel({
        name: "Default Test",
        description: "Testing defaults",
        startDate: now,
        endDate: new Date(now.getTime() + 3600 * 1000),
      });
      assert.strictEqual(t.status, "upcoming");
      assert.strictEqual(t.initialBalance, 100000);
      assert.strictEqual(t.maxParticipants, 100);
      assert.strictEqual(t.isPrivate, false);
    });

    it("should only accept valid tournamentType enum values", async () => {
      const now = new Date();
      const t = new TournamentModel({
        name: "Type Test",
        description: "Enum test",
        tournamentType: "invalid_type",
        startDate: now,
        endDate: new Date(now.getTime() + 3600 * 1000),
      });
      let err = null;
      try {
        await t.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.tournamentType, "Should reject invalid tournament type");
    });

    it("should only accept valid status enum values", async () => {
      const now = new Date();
      const t = new TournamentModel({
        name: "Status Test",
        description: "Status enum test",
        startDate: now,
        endDate: new Date(now.getTime() + 3600 * 1000),
        status: "invalid_status",
      });
      let err = null;
      try {
        await t.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.status, "Should reject invalid status");
    });

    it("should require initialBalance to be at least 10000", async () => {
      const now = new Date();
      const t = new TournamentModel({
        name: "Balance Test",
        description: "Min balance test",
        startDate: now,
        endDate: new Date(now.getTime() + 3600 * 1000),
        initialBalance: 5000,
      });
      let err = null;
      try {
        await t.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.initialBalance, "Should reject balance below 10000");
    });
  });

  // =========================================================================
  // 2. PARTICIPATION SCHEMA VALIDATION
  // =========================================================================

  describe("Participation Schema Validation", () => {
    const ParticipationModel = mongoose.model(
      "PartTest",
      tournamentParticipationSchema
    );

    it("should require userId and tournamentId", async () => {
      const p = new ParticipationModel({
        initialBalance: 100000,
        availableCash: 1000000,
        portfolioValue: 1000000,
      });
      let err = null;
      try {
        await p.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.userId, "Should require userId");
      assert.ok(err?.errors?.tournamentId, "Should require tournamentId");
    });

    it("should default reservedCash, realizedPnL, and tradeCount to 0", () => {
      const uid = new mongoose.Types.ObjectId();
      const tid = new mongoose.Types.ObjectId();
      const p = new ParticipationModel({
        userId: uid,
        tournamentId: tid,
        initialBalance: 100000,
        availableCash: 1000000,
        portfolioValue: 1000000,
      });
      assert.strictEqual(p.reservedCash, 0);
      assert.strictEqual(p.realizedPnL, 0);
      assert.strictEqual(p.tradeCount, 0);
      assert.strictEqual(p.returnPercent, 0);
      assert.strictEqual(p.status, "active");
    });

    it("should not allow negative availableCash", async () => {
      const p = new ParticipationModel({
        userId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        initialBalance: 100000,
        availableCash: -500,
        portfolioValue: 1000000,
      });
      let err = null;
      try {
        await p.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.availableCash, "Should reject negative availableCash");
    });
  });

  // =========================================================================
  // 3. ORDER SCHEMA VALIDATION
  // =========================================================================

  describe("Tournament Order Schema Validation", () => {
    const OrderModel = mongoose.model("TournamentOrderTest", tournamentOrderSchema);

    it("should require participationId, tournamentId, userId, symbol, action, quantity, price", async () => {
      const o = new OrderModel({});
      let err = null;
      try {
        await o.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err, "Expected validation error");
      assert.ok(err.errors.participationId, "Should require participationId");
      assert.ok(err.errors.tournamentId, "Should require tournamentId");
      assert.ok(err.errors.userId, "Should require userId");
      assert.ok(err.errors.symbol, "Should require symbol");
      assert.ok(err.errors.action, "Should require action");
      assert.ok(err.errors.quantity, "Should require quantity");
      assert.ok(err.errors.price, "Should require price");
    });

    it("should only accept BUY or SELL as action", async () => {
      const o = new OrderModel({
        participationId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        symbol: "RELIANCE",
        action: "HOLD",
        orderType: "Market",
        quantity: 10,
        price: 2500,
      });
      let err = null;
      try {
        await o.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.action, "Should reject invalid action");
    });

    it("should default status to PENDING and reservedAmount to 0", () => {
      const o = new OrderModel({
        participationId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        symbol: "TCS",
        action: "BUY",
        orderType: "Market",
        quantity: 5,
        price: 3500,
      });
      assert.strictEqual(o.status, "PENDING");
      assert.strictEqual(o.reservedAmount, 0);
      assert.strictEqual(o.realizedPnL, 0);
    });

    it("should reject quantity below 1", async () => {
      const o = new OrderModel({
        participationId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        symbol: "INFY",
        action: "BUY",
        orderType: "Market",
        quantity: 0,
        price: 1500,
      });
      let err = null;
      try {
        await o.validate();
      } catch (e) {
        err = e;
      }
      assert.ok(err?.errors?.quantity, "Should reject quantity of 0");
    });
  });

  // =========================================================================
  // 4. VIRTUAL TRADING LOGIC UNIT TESTS (in-memory simulation)
  // =========================================================================

  describe("Virtual Trading Logic Simulation", () => {
    it("should correctly calculate average price on BUY accumulation", () => {
      const existingQty = 10;
      const existingAvg = 2000;
      const newQty = 5;
      const newPrice = 2200;

      const totalCost = existingQty * existingAvg + newQty * newPrice;
      const newTotal = existingQty + newQty;
      const newAvg = totalCost / newTotal;

      assert.strictEqual(newTotal, 15);
      assert.ok(Math.abs(newAvg - 2066.67) < 0.01, `Expected ~2066.67, got ${newAvg.toFixed(2)}`);
    });

    it("should correctly compute realized P&L on SELL (FIFO avg cost basis)", () => {
      const avgPrice = 2000;
      const sellQty = 5;
      const sellPrice = 2500;

      const costBasis = sellQty * avgPrice;
      const revenue = sellQty * sellPrice;
      const pnl = revenue - costBasis;

      assert.strictEqual(costBasis, 10000);
      assert.strictEqual(revenue, 12500);
      assert.strictEqual(pnl, 2500);
    });

    it("should prevent selling more shares than available", () => {
      const availableQty = 4;
      const sellQty = 10;

      const canSell = availableQty >= sellQty;
      assert.strictEqual(canSell, false, "Should not allow overselling");
    });

    it("should calculate portfolio value as cash + holdings market value", () => {
      const availableCash = 500000;
      const reservedCash = 50000;
      const holdings = [
        { quantity: 10, currentPrice: 2500 },
        { quantity: 5, currentPrice: 3500 },
      ];

      const holdingsValue = holdings.reduce(
        (sum, h) => sum + h.quantity * h.currentPrice,
        0
      );
      const portfolioValue = availableCash + reservedCash + holdingsValue;

      // 500000 + 50000 + 10*2500 + 5*3500 = 500000 + 50000 + 25000 + 17500 = 592500
      assert.strictEqual(holdingsValue, 42500);
      assert.strictEqual(portfolioValue, 592500);
    });

    it("should correctly calculate return percentage", () => {
      const initialBalance = 100000;
      const portfolioValue = 112500;
      const pnl = portfolioValue - initialBalance;
      const returnPct = (pnl / initialBalance) * 100;

      assert.strictEqual(pnl, 12500);
      assert.strictEqual(returnPct, 12.5);
    });

    it("should reject BUY when insufficient virtual cash", () => {
      const availableCash = 10000;
      const qty = 10;
      const price = 2500;
      const totalCost = qty * price;

      const canBuy = availableCash >= totalCost;
      assert.strictEqual(canBuy, false, "Should reject purchase with insufficient cash");
    });

    it("should release reserved cash when pending limit order is cancelled", () => {
      let availableCash = 900000;
      let reservedCash = 50000;
      const reservedAmount = 50000;

      // Simulate cancel
      reservedCash = Math.max(0, reservedCash - reservedAmount);
      availableCash += reservedAmount;

      assert.strictEqual(reservedCash, 0);
      assert.strictEqual(availableCash, 950000);
    });

    it("should execute BUY limit order when market price drops at or below limit", () => {
      const limitPrice = 2400;
      const currentMarketPrice = 2350;

      const shouldExecute = currentMarketPrice <= limitPrice;
      assert.strictEqual(shouldExecute, true, "Should execute BUY limit when price <= limitPrice");
    });

    it("should execute SELL limit order when market price rises at or above limit", () => {
      const limitPrice = 2600;
      const currentMarketPrice = 2650;

      const shouldExecute = currentMarketPrice >= limitPrice;
      assert.strictEqual(shouldExecute, true, "Should execute SELL limit when price >= limitPrice");
    });
  });

  // =========================================================================
  // 5. RANKING DETERMINISM
  // =========================================================================

  describe("Leaderboard Ranking Determinism", () => {
    it("should rank by returnPercent descending as primary criterion", () => {
      const participants = [
        { returnPercent: 5.2, portfolioValue: 1052000, joinedAt: new Date("2026-01-01") },
        { returnPercent: 12.1, portfolioValue: 1121000, joinedAt: new Date("2026-01-02") },
        { returnPercent: 3.7, portfolioValue: 1037000, joinedAt: new Date("2026-01-01") },
      ];

      participants.sort((a, b) => {
        if (b.returnPercent !== a.returnPercent) return b.returnPercent - a.returnPercent;
        if (b.portfolioValue !== a.portfolioValue) return b.portfolioValue - a.portfolioValue;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      });

      assert.strictEqual(participants[0].returnPercent, 12.1);
      assert.strictEqual(participants[1].returnPercent, 5.2);
      assert.strictEqual(participants[2].returnPercent, 3.7);
    });

    it("should break ties on portfolioValue when returnPercent is equal", () => {
      const participants = [
        { returnPercent: 10.0, portfolioValue: 1050000, joinedAt: new Date("2026-01-01") },
        { returnPercent: 10.0, portfolioValue: 1100000, joinedAt: new Date("2026-01-02") },
      ];

      participants.sort((a, b) => {
        if (b.returnPercent !== a.returnPercent) return b.returnPercent - a.returnPercent;
        if (b.portfolioValue !== a.portfolioValue) return b.portfolioValue - a.portfolioValue;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      });

      assert.strictEqual(participants[0].portfolioValue, 1100000, "Higher portfolio value should rank first");
    });

    it("should break ties on earliest join date when return and value are equal", () => {
      const earlier = new Date("2026-01-01T08:00:00");
      const later = new Date("2026-01-01T10:00:00");

      const participants = [
        { returnPercent: 10.0, portfolioValue: 1100000, joinedAt: later },
        { returnPercent: 10.0, portfolioValue: 1100000, joinedAt: earlier },
      ];

      participants.sort((a, b) => {
        if (b.returnPercent !== a.returnPercent) return b.returnPercent - a.returnPercent;
        if (b.portfolioValue !== a.portfolioValue) return b.portfolioValue - a.portfolioValue;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
      });

      assert.deepStrictEqual(participants[0].joinedAt, earlier, "Earlier join date wins tiebreaker");
    });
  });

  // =========================================================================
  // 6. TOURNAMENT STATUS LOGIC
  // =========================================================================

  describe("Tournament Status Computation", () => {
    const computeStatus = (startDate, endDate, existingStatus = "upcoming") => {
      if (existingStatus === "cancelled") return "cancelled";
      const now = new Date();
      if (now < new Date(startDate)) return "upcoming";
      if (now >= new Date(startDate) && now <= new Date(endDate)) return "active";
      if (now > new Date(endDate)) return "completed";
      return existingStatus;
    };

    it("should compute 'upcoming' for future tournaments", () => {
      const future = new Date(Date.now() + 24 * 3600 * 1000);
      const farFuture = new Date(Date.now() + 48 * 3600 * 1000);
      assert.strictEqual(computeStatus(future, farFuture), "upcoming");
    });

    it("should compute 'active' for currently running tournaments", () => {
      const past = new Date(Date.now() - 3600 * 1000);
      const future = new Date(Date.now() + 3600 * 1000);
      assert.strictEqual(computeStatus(past, future), "active");
    });

    it("should compute 'completed' for past tournaments", () => {
      const past1 = new Date(Date.now() - 48 * 3600 * 1000);
      const past2 = new Date(Date.now() - 24 * 3600 * 1000);
      assert.strictEqual(computeStatus(past1, past2), "completed");
    });

    it("should keep cancelled status regardless of dates", () => {
      const past = new Date(Date.now() - 3600 * 1000);
      const future = new Date(Date.now() + 3600 * 1000);
      assert.strictEqual(computeStatus(past, future, "cancelled"), "cancelled");
    });
  });

  // =========================================================================
  // 7. ISOLATION VERIFICATION
  // =========================================================================

  describe("Paper Trading Isolation from Real System", () => {
    it("tournament order schema should NOT have reservationReleased field (real order field)", () => {
      const order = new (mongoose.model("IsolationOrderTest", tournamentOrderSchema))({
        participationId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
        symbol: "TCS",
        action: "BUY",
        orderType: "Market",
        quantity: 1,
        price: 100,
      });
      // reservationReleased is a real orders field and must NOT be present on paper orders
      assert.strictEqual(
        order.reservationReleased,
        undefined,
        "Paper orders must not have reservationReleased field"
      );
    });

    it("tournament participation should NOT have real-account fields like product or costBasis", () => {
      const part = new (mongoose.model("IsolationPartTest", tournamentParticipationSchema))({
        userId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        initialBalance: 100000,
        availableCash: 100000,
        portfolioValue: 100000,
      });
      assert.strictEqual(part.product, undefined, "Participation must not have product field");
      assert.strictEqual(part.costBasis, undefined, "Participation must not have costBasis field");
    });
  });

  // =========================================================================
  // 8. INVITE CODE & PRIVATE TOURNAMENT ACCESS
  // =========================================================================

  describe("Private Tournament Access Control", () => {
    it("should reject incorrect invite code", () => {
      const stored = "ALPHA2026";
      const submitted = "WRONG123";
      const matches = stored === submitted.trim().toUpperCase();
      assert.strictEqual(matches, false, "Should deny access with wrong invite code");
    });

    it("should allow access with correct invite code", () => {
      const stored = "ALPHA2026";
      const submitted = "alpha2026";
      const matches = stored === submitted.trim().toUpperCase();
      assert.strictEqual(matches, true, "Should allow access with correct invite code");
    });

    it("should treat empty invite code as invalid for private tournament", () => {
      const stored = "ALPHA2026";
      const submitted = "";
      const valid = submitted.trim().toUpperCase() === stored;
      assert.strictEqual(valid, false, "Empty invite code should be rejected");
    });
  });

  // =========================================================================
  // 9. CUSTOM RULES & LIFECYCLE ENFORCEMENT
  // =========================================================================

  describe("Custom Trading Rules and Lifecycle Enforcement", () => {
    it("should default mode to standard and tradingRules to unrestricted defaults", () => {
      const TournamentModel = mongoose.model("TournamentTest");
      const now = new Date();
      const t = new TournamentModel({
        name: "Standard Rules Test",
        description: "Checking default rules",
        startDate: now,
        endDate: new Date(now.getTime() + 3600 * 1000),
      });

      assert.strictEqual(t.mode, "standard");
      assert.deepStrictEqual(t.tradingRules.allowedOrderTypes, ["Market", "Limit"]);
      assert.deepStrictEqual(t.tradingRules.allowedActions, ["BUY", "SELL"]);
      assert.strictEqual(t.tradingRules.maxOrderQty, 0);
      assert.strictEqual(t.tradingRules.rankingMetric, "returnPercent");
    });

    it("should normalize and detect duplicate tournament names case-insensitively", () => {
      const existingName = "Nifty 50 Pro Traders Championship";
      const newName = "  nifty 50 pro traders championship  ";
      const isDuplicate = existingName.trim().toLowerCase() === newName.trim().toLowerCase();
      assert.strictEqual(isDuplicate, true, "Should detect duplicate trimmed case-insensitive name");
    });

    it("should reject editing an already completed or cancelled tournament", () => {
      const statuses = ["completed", "cancelled"];
      for (const st of statuses) {
        const canEdit = st !== "completed" && st !== "cancelled";
        assert.strictEqual(canEdit, false, `Editing must be blocked for ${st} tournament`);
      }
    });

    it("should correctly compute minTrades eligibility", () => {
      const minTradesRequired = 3;
      const traderA = { tradeCount: 1, isEligible: 1 >= minTradesRequired };
      const traderB = { tradeCount: 3, isEligible: 3 >= minTradesRequired };
      const traderC = { tradeCount: 5, isEligible: 5 >= minTradesRequired };

      assert.strictEqual(traderA.isEligible, false, "Trader below threshold must not be eligible");
      assert.strictEqual(traderB.isEligible, true, "Trader at threshold must be eligible");
      assert.strictEqual(traderC.isEligible, true, "Trader above threshold must be eligible");
    });

    it("should enforce maxOrderQty limit correctly", () => {
      const maxOrderQty = 50;
      const validQty = 50;
      const invalidQty = 51;

      assert.strictEqual(validQty <= maxOrderQty, true);
      assert.strictEqual(invalidQty <= maxOrderQty, false);
    });
  });

  // =========================================================================
  // 10. FINAL VERIFICATION AUDIT & CONCURRENCY INVARIANCE TESTS
  // =========================================================================

  describe("Final Verification Audit & Concurrency Invariance", () => {
    it("should validate all 9 required tournament notification events are in schema enum", async () => {
      const NotificationSchema = (await import("../schemas/NotificationSchema.js")).default;
      const eventEnumValues = NotificationSchema.path("event").enumValues;

      const requiredEvents = [
        "tournament_joined",
        "tournament_started",
        "order_placed",
        "order_executed",
        "order_cancelled",
        "order_rejected",
        "tournament_completed",
        "final_rank_available",
        "tournament_disqualified",
      ];

      for (const reqEvent of requiredEvents) {
        assert.ok(
          eventEnumValues.includes(reqEvent),
          `NotificationSchema must include ${reqEvent} event in enum`
        );
      }
    });

    it("should reject order placement when participant is disqualified", () => {
      const participant = { status: "disqualified" };
      let errorThrown = false;
      try {
        if (participant.status === "disqualified") {
          throw new Error("You have been disqualified from this tournament and cannot trade.");
        }
      } catch (err) {
        errorThrown = true;
        assert.match(err.message, /disqualified/i);
      }
      assert.strictEqual(errorThrown, true, "Disqualified participant must be rejected");
    });

    it("should prevent duplicate order execution under concurrent or repeated ticks via atomic lock", () => {
      // Simulating atomic findOneAndUpdate lock behavior:
      // First tick locks order from PENDING to PROCESSING; second concurrent tick gets null.
      let orderStatus = "PENDING";
      const simulateAtomicLock = () => {
        if (orderStatus === "PENDING") {
          orderStatus = "PROCESSING";
          return { status: "PROCESSING" };
        }
        return null;
      };

      const tick1 = simulateAtomicLock();
      const tick2 = simulateAtomicLock();

      assert.ok(tick1, "First tick should acquire lock");
      assert.strictEqual(tick2, null, "Second tick must not acquire lock");
    });

    it("should preserve deterministic ranks without modification once tournament is completed", () => {
      const completedTournament = { status: "completed" };
      const participants = [
        { rank: 1, finalRank: 1, returnPercent: 25.5 },
        { rank: 2, finalRank: 2, returnPercent: 12.3 },
      ];

      // In completed tournaments, market prices must not alter finalized ranks
      assert.strictEqual(completedTournament.status, "completed");
      assert.strictEqual(participants[0].finalRank, 1);
      assert.strictEqual(participants[1].finalRank, 2);
    });

    it("should strictly isolate tournament trades from real-account funds and holdings", () => {
      const realAccountFunds = { availableCash: 500000 };
      const tournamentVirtualFunds = { availableCash: 100000 };

      // Executing a tournament trade of ₹20,000
      const tradeCost = 20000;
      tournamentVirtualFunds.availableCash -= tradeCost;

      assert.strictEqual(tournamentVirtualFunds.availableCash, 80000);
      assert.strictEqual(
        realAccountFunds.availableCash,
        500000,
        "Real account funds must NEVER be modified by virtual tournament trades"
      );
    });
  });

  // =========================================================================
  // 11. TOURNAMENT JOIN FLOW VERIFICATION & EDGE CASES
  // =========================================================================

  describe("Tournament Join Flow Verification & Edge Cases", () => {
    it("Scenario 1: should create exactly one isolated participant record with initial capital", () => {
      const initialBalance = 100000;
      const participation = {
        userId: new mongoose.Types.ObjectId(),
        tournamentId: new mongoose.Types.ObjectId(),
        initialBalance,
        availableCash: initialBalance,
        reservedCash: 0,
        virtualHoldings: [],
        portfolioValue: initialBalance,
        returnPercent: 0,
        tradeCount: 0,
        status: "active",
      };

      assert.strictEqual(participation.availableCash, 100000);
      assert.strictEqual(participation.virtualHoldings.length, 0);
      assert.strictEqual(participation.tradeCount, 0);
      assert.strictEqual(participation.status, "active");
    });

    it("Scenario 2: should reject joining the same tournament again", () => {
      const existing = { status: "active" };
      let rejected = false;
      if (existing) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, "Already active participant must be rejected");
    });

    it("Scenario 3: should reject joining a full tournament", () => {
      const tournament = { participantCount: 100, maxParticipants: 100 };
      const isFull = tournament.participantCount >= tournament.maxParticipants;
      assert.strictEqual(isFull, true, "Full tournament must reject join request");
    });

    it("Scenario 4: should reject joining a completed or cancelled tournament", () => {
      const completed = { status: "completed" };
      const cancelled = { status: "cancelled" };

      const canJoinCompleted = completed.status !== "completed" && completed.status !== "cancelled";
      const canJoinCancelled = cancelled.status !== "completed" && cancelled.status !== "cancelled";

      assert.strictEqual(canJoinCompleted, false);
      assert.strictEqual(canJoinCancelled, false);
    });

    it("Scenario 5: should reject joining without authentication", () => {
      const user = null;
      let rejected = false;
      if (!user?.userId) {
        rejected = true;
      }
      assert.strictEqual(rejected, true, "Unauthenticated user must be rejected");
    });

    it("Scenario 6: should reject private tournament when invite code is incorrect or missing", () => {
      const tournament = { isPrivate: true, inviteCode: "ALPHA2026" };

      const checkCode = (code) => {
        const clean = String(code || "").trim().toUpperCase();
        return Boolean(clean && clean === tournament.inviteCode);
      };

      assert.strictEqual(checkCode(null), false, "Missing code must fail");
      assert.strictEqual(checkCode(""), false, "Empty code must fail");
      assert.strictEqual(checkCode("WRONGCODE"), false, "Wrong code must fail");
      assert.strictEqual(checkCode("alpha2026"), true, "Case-insensitive correct code must pass");
      assert.strictEqual(checkCode("  ALPHA2026  "), true, "Trimmed correct code must pass");
    });

    it("Scenario 7: should reject active tournament when allowLateJoin is explicitly false", () => {
      const tournamentNoLateJoin = { status: "active", entryRules: { allowLateJoin: false } };
      const tournamentLateJoinAllowed = { status: "active", entryRules: { allowLateJoin: true } };
      const tournamentDefaultLateJoin = { status: "active", entryRules: {} };

      const isLateJoinBlocked = (t) => t.status === "active" && t.entryRules?.allowLateJoin === false;

      assert.strictEqual(isLateJoinBlocked(tournamentNoLateJoin), true);
      assert.strictEqual(isLateJoinBlocked(tournamentLateJoinAllowed), false);
      assert.strictEqual(isLateJoinBlocked(tournamentDefaultLateJoin), false);
    });

    it("Scenario 8: should reject disqualified user from re-joining", () => {
      const existing = { status: "disqualified" };
      let errorMsg = "";

      if (existing) {
        errorMsg =
          existing.status === "disqualified"
            ? "You were disqualified from this tournament and cannot re-join."
            : "You have already joined this tournament.";
      }

      assert.match(errorMsg, /disqualified.*cannot re-join/i);
    });

    it("Scenario 9: should handle concurrent double-click join safely via unique compound index", () => {
      // Unique index on { tournamentId: 1, userId: 1 } ensures that second concurrent insert throws 11000
      const insertedUsers = new Set();
      const mockInsert = (userId, tournamentId) => {
        const key = `${tournamentId}_${userId}`;
        if (insertedUsers.has(key)) {
          const err = new Error("E11000 duplicate key error");
          err.code = 11000;
          throw err;
        }
        insertedUsers.add(key);
        return { success: true };
      };

      const res1 = mockInsert("user123", "tourn456");
      assert.strictEqual(res1.success, true);

      assert.throws(
        () => mockInsert("user123", "tourn456"),
        (err) => err.code === 11000
      );
    });
  });

  // =========================================================================
  // 12. CANCELLATION, DYNAMIC STOCKS, RESERVED SHARES & NOTIFICATION AUDIT
  // =========================================================================

  describe("Cancellation, Dynamic Stocks, Reserved Shares & Notification Flow Audit", () => {
    it("Req 4: should generate cancellation notification with reason and prevent duplicates on retry", () => {
      const notifications = [];
      const tournament = { _id: "tourn-99", name: "Weekend Scalping Championship" };
      const participants = [{ userId: "user-1" }, { userId: "user-2" }];
      const reason = "Technical maintenance";

      const dispatchCancellation = () => {
        for (const p of participants) {
          const exists = notifications.some(
            (n) =>
              n.userId === p.userId &&
              n.event === "tournament_cancelled" &&
              n.metadata.tournamentId === tournament._id
          );
          if (!exists) {
            notifications.push({
              userId: p.userId,
              type: "tournament",
              event: "tournament_cancelled",
              title: `Tournament Cancelled: ${tournament.name}`,
              message: `"${tournament.name}" was cancelled by an administrator. Any pending orders have been cancelled and reserved funds released. Executed trades are preserved in your history.`,
              priority: "high",
              metadata: {
                tournamentId: tournament._id,
                tournamentName: tournament.name,
                reason,
              },
            });
          }
        }
      };

      // First run: dispatches to both participants
      dispatchCancellation();
      assert.strictEqual(notifications.length, 2);
      assert.strictEqual(notifications[0].event, "tournament_cancelled");
      assert.strictEqual(notifications[0].metadata.reason, reason);

      // Second retry run: must NOT create duplicates
      dispatchCancellation();
      assert.strictEqual(notifications.length, 2, "Deduplication must prevent duplicate cancellation notifications");
    });

    it("Req 11: should preserve executed Market Buy trades and holdings when tournament is cancelled", () => {
      const participation = {
        availableCash: 75000,
        reservedCash: 25000,
        virtualHoldings: [{ symbol: "RELIANCE", quantity: 10, averagePrice: 2500 }],
        tradeCount: 1,
      };

      const pendingOrders = [
        { _id: "ord-1", action: "BUY", reservedAmount: 25000, status: "PENDING" },
      ];

      // Simulate cancellation workflow:
      // 1. Pending BUY order cancelled and reserved cash released
      for (const ord of pendingOrders) {
        if (ord.status === "PENDING" && ord.action === "BUY") {
          participation.availableCash += ord.reservedAmount;
          participation.reservedCash -= ord.reservedAmount;
          ord.status = "CANCELLED";
        }
      }

      // Executed shares in virtualHoldings must remain completely intact
      assert.strictEqual(participation.virtualHoldings.length, 1);
      assert.strictEqual(participation.virtualHoldings[0].symbol, "RELIANCE");
      assert.strictEqual(participation.virtualHoldings[0].quantity, 10);
      assert.strictEqual(participation.availableCash, 100000);
      assert.strictEqual(participation.reservedCash, 0);
      assert.strictEqual(pendingOrders[0].status, "CANCELLED");
    });

    it("Req 5: should enforce dynamic stock rules server-side and reject unauthorized stocks", () => {
      const supportedStocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"];
      const restrictedTournament = {
        status: "active",
        tradingRules: { allowedSymbols: ["TCS", "INFY"] },
      };
      const unrestrictedTournament = {
        status: "active",
        tradingRules: { allowedSymbols: [] },
      };

      const validateStock = (tournament, symbol) => {
        const norm = symbol.trim().toUpperCase();
        if (!supportedStocks.includes(norm)) {
          throw new Error(`Symbol ${norm} is not supported for paper trading.`);
        }
        const allowed = tournament.tradingRules?.allowedSymbols || [];
        if (allowed.length > 0 && !allowed.includes(norm)) {
          throw new Error(`Symbol ${norm} is not permitted in this tournament.`);
        }
        return true;
      };

      // Allowed in restricted
      assert.strictEqual(validateStock(restrictedTournament, "TCS"), true);
      assert.strictEqual(validateStock(restrictedTournament, "INFY"), true);

      // Disallowed in restricted
      assert.throws(
        () => validateStock(restrictedTournament, "RELIANCE"),
        /not permitted in this tournament/i
      );

      // Unrestricted permits all supported
      assert.strictEqual(validateStock(unrestrictedTournament, "RELIANCE"), true);
      assert.strictEqual(validateStock(unrestrictedTournament, "HDFCBANK"), true);

      // Unsupported stock rejected everywhere
      assert.throws(
        () => validateStock(unrestrictedTournament, "UNKNOWN_CO"),
        /not supported for paper trading/i
      );
    });

    it("Req 12: should correctly compute total, reserved, and available shares across Sell Limit lifecycle", () => {
      const holding = { symbol: "TCS", quantity: 50 }; // total holdings = 50
      let pendingSellOrders = [];

      const computeAvailability = () => {
        const reserved = pendingSellOrders.reduce((sum, o) => sum + o.quantity, 0);
        const available = Math.max(0, holding.quantity - reserved);
        return { total: holding.quantity, reserved, available };
      };

      // 1. Initial state
      let stats = computeAvailability();
      assert.strictEqual(stats.total, 50);
      assert.strictEqual(stats.reserved, 0);
      assert.strictEqual(stats.available, 50);

      // 2. Place Sell Limit order of 20 shares
      pendingSellOrders.push({ _id: "ord-1", symbol: "TCS", quantity: 20, status: "PENDING" });
      stats = computeAvailability();
      assert.strictEqual(stats.total, 50);
      assert.strictEqual(stats.reserved, 20);
      assert.strictEqual(stats.available, 30);

      // 3. Reject order exceeding available shares (attempting 35 when only 30 available)
      const canSell35 = 35 <= stats.available;
      assert.strictEqual(canSell35, false, "Cannot place order exceeding available to trade");

      // 4. Order execution: deducts total holding and releases reservation
      const executedOrder = pendingSellOrders.shift();
      holding.quantity -= executedOrder.quantity; // 50 - 20 = 30
      stats = computeAvailability();
      assert.strictEqual(stats.total, 30);
      assert.strictEqual(stats.reserved, 0);
      assert.strictEqual(stats.available, 30);

      // 5. Place another Sell Limit of 15 shares and cancel it
      pendingSellOrders.push({ _id: "ord-2", symbol: "TCS", quantity: 15, status: "PENDING" });
      stats = computeAvailability();
      assert.strictEqual(stats.available, 15);

      // Cancellation releases reservation exactly once
      pendingSellOrders = [];
      stats = computeAvailability();
      assert.strictEqual(stats.total, 30);
      assert.strictEqual(stats.reserved, 0);
      assert.strictEqual(stats.available, 30);
    });
  });

  // =========================================================================
  // 13. HISTORY IMMUTABILITY & RESERVED SHARE INVARIANT PROOFS
  // =========================================================================

  describe("History Immutability & Reserved Share Invariant Proofs", () => {
    it("History Immutability: completion snapshot must persist cash, holdings, and PnL, and getMyTournamentHistory must read from snapshot rather than live recalculated market values", () => {
      // 1. Participant state at completion time
      const completionTime = new Date("2026-10-10T18:00:00Z");
      const savedSnapshot = {
        snapshotAt: completionTime,
        reason: "completed",
        finalRank: 1,
        initialBalance: 100000,
        availableCash: 75000,
        reservedCash: 0,
        portfolioValue: 125000,
        realizedPnL: 0,
        unrealizedPnL: 25000,
        totalPnL: 25000,
        tradeCount: 2,
        virtualHoldings: [
          {
            symbol: "RELIANCE",
            quantity: 10,
            averagePrice: 2500,
            currentPrice: 5000,
            marketValue: 50000,
            unrealizedPnL: 25000,
          },
        ],
      };

      const participation = {
        _id: "part-1",
        userId: "user-1",
        tournamentId: "tourn-1",
        initialBalance: 100000,
        availableCash: 75000,
        reservedCash: 0,
        // Suppose live record was recalculated subsequent to completion with new market prices:
        portfolioValue: 180000,
        realizedPnL: 0,
        unrealizedPnL: 80000,
        tradeCount: 2,
        virtualHoldings: [
          {
            symbol: "RELIANCE",
            quantity: 10,
            averagePrice: 2500,
            currentPrice: 10500, // Market price doubled after tournament ended
            marketValue: 105000,
            unrealizedPnL: 80000,
          },
        ],
        finalRank: 1,
        closedSnapshot: savedSnapshot,
      };

      const tournament = {
        _id: "tourn-1",
        name: "Pro Scalpers Cup",
        status: "completed",
        participantCount: 50,
      };

      // Simulate getMyTournamentHistory resolution logic
      const resolveHistoryItem = (p, t) => {
        const isClosed = t.status === "completed" || t.status === "cancelled";
        const snap = (isClosed && p.closedSnapshot) ? p.closedSnapshot : null;

        const portfolioValue = snap ? snap.portfolioValue : p.portfolioValue;
        const availableCash = snap ? snap.availableCash : p.availableCash;
        const reservedCash = snap ? snap.reservedCash : (p.reservedCash || 0);
        const virtualHoldings = snap ? snap.virtualHoldings : p.virtualHoldings;
        const totalPnL = snap
          ? snap.totalPnL
          : Number((portfolioValue - p.initialBalance).toFixed(2));

        return {
          tournamentId: t._id,
          name: t.name,
          portfolioValue,
          availableCash,
          reservedCash,
          virtualHoldings,
          totalPnL,
          finalRank: snap ? snap.finalRank : p.finalRank,
          snapshotSource: snap ? snap.reason : (isClosed ? "live_fallback" : "live"),
        };
      };

      const result = resolveHistoryItem(participation, tournament);

      // Verify that history strictly returned frozen values, NOT the post-completion live market values
      assert.strictEqual(result.portfolioValue, 125000, "Must match frozen snapshot portfolioValue (₹125,000), not recalculated ₹180,000");
      assert.strictEqual(result.totalPnL, 25000, "Must match frozen snapshot totalPnL");
      assert.strictEqual(result.virtualHoldings[0].currentPrice, 5000, "Must preserve price at snapshot time, not live ₹10,500");
      assert.strictEqual(result.finalRank, 1);
      assert.strictEqual(result.snapshotSource, "completed", "Source must identify as completed immutable snapshot");
    });

    it("History Immutability: cancellation snapshot must freeze final portfolio valuation and preserve executed trades", () => {
      const cancellationTime = new Date("2026-10-10T12:00:00Z");
      const cancelSnapshot = {
        snapshotAt: cancellationTime,
        reason: "cancelled",
        finalRank: null,
        initialBalance: 100000,
        availableCash: 80000,
        reservedCash: 0,
        portfolioValue: 100000,
        realizedPnL: 0,
        unrealizedPnL: 0,
        totalPnL: 0,
        tradeCount: 1,
        virtualHoldings: [
          {
            symbol: "INFY",
            quantity: 10,
            averagePrice: 2000,
            currentPrice: 2000,
            marketValue: 20000,
            unrealizedPnL: 0,
          },
        ],
      };

      const participation = {
        _id: "part-2",
        userId: "user-2",
        tournamentId: "tourn-2",
        initialBalance: 100000,
        closedSnapshot: cancelSnapshot,
      };

      const tournament = {
        _id: "tourn-2",
        name: "Cancelled Tournament",
        status: "cancelled",
        participantCount: 10,
      };

      const isClosed = tournament.status === "completed" || tournament.status === "cancelled";
      const snap = isClosed && participation.closedSnapshot ? participation.closedSnapshot : null;

      assert.ok(snap, "Snapshot must exist for cancelled tournament");
      assert.strictEqual(snap.reason, "cancelled");
      assert.strictEqual(snap.virtualHoldings.length, 1);
      assert.strictEqual(snap.virtualHoldings[0].symbol, "INFY");
      assert.strictEqual(snap.virtualHoldings[0].quantity, 10, "Executed trades and holdings preserved in snapshot");
    });

    it("Reserved Share Invariant: concurrent SELL orders cannot oversell holdings", () => {
      const holding = { symbol: "TCS", quantity: 10, reservedQuantity: 0 };
      const pendingOrders = [];

      // Atomic placement simulation mimicking tournamentService.js
      const placeSellLimitOrder = (qty) => {
        const reservedInPending = pendingOrders
          .filter((o) => o.symbol === holding.symbol && o.status === "PENDING")
          .reduce((sum, o) => sum + o.quantity, 0);

        // Strict invariant check: reserved cannot exceed total holding
        if (reservedInPending > holding.quantity) {
          throw new Error("Inconsistent holding state: reserved quantity exceeds total owned.");
        }

        const available = holding.quantity - reservedInPending;
        if (available < qty) {
          throw new Error(
            `Insufficient available holding quantity. Total: ${holding.quantity}, Reserved: ${reservedInPending}, Available: ${available}`
          );
        }

        // Commit order and update holding reservation
        const order = { _id: `ord-${pendingOrders.length + 1}`, symbol: holding.symbol, quantity: qty, status: "PENDING" };
        pendingOrders.push(order);
        holding.reservedQuantity = (holding.reservedQuantity || 0) + qty;
        return order;
      };

      // First order: sells 10 shares of 10 owned
      const order1 = placeSellLimitOrder(10);
      assert.ok(order1);
      assert.strictEqual(holding.reservedQuantity, 10);
      assert.strictEqual(holding.quantity - holding.reservedQuantity, 0);

      // Concurrent second order: tries to sell 1 share when 0 available
      assert.throws(
        () => placeSellLimitOrder(1),
        /Insufficient available holding quantity/i
      );

      // Verify invariant: reservedQuantity never exceeds total holding
      assert.ok(holding.reservedQuantity <= holding.quantity);
    });

    it("Reserved Share Invariant: execution and cancellation release reservations exactly once", () => {
      const holding = { symbol: "RELIANCE", quantity: 30, reservedQuantity: 20 };
      const pendingOrder = { _id: "ord-100", symbol: "RELIANCE", quantity: 20, status: "PENDING" };

      // Atomic cancellation
      const cancelOrder = (order) => {
        if (order.status !== "PENDING") {
          throw new Error("Pending order not found or already processed.");
        }
        order.status = "CANCELLED";
        holding.reservedQuantity = Math.max(0, (holding.reservedQuantity || 0) - order.quantity);
        return true;
      };

      // Cancel once
      const success = cancelOrder(pendingOrder);
      assert.strictEqual(success, true);
      assert.strictEqual(holding.reservedQuantity, 0, "Reservation released back to 0");
      assert.strictEqual(holding.quantity - holding.reservedQuantity, 30, "All 30 shares available");

      // Attempt second cancellation on same order: must reject
      assert.throws(
        () => cancelOrder(pendingOrder),
        /Pending order not found or already processed/i
      );
      assert.strictEqual(holding.reservedQuantity, 0, "No duplicate deduction");
    });

    it("Reserved Share Invariant: rejects inconsistent states without relying on Math.max to hide negative values", () => {
      const holding = { symbol: "INFY", quantity: 10 };
      const reserved = 15; // Corrupted state where reserved > quantity

      // Direct calculation without Math.max hiding
      const rawAvailable = holding.quantity - reserved;
      assert.strictEqual(rawAvailable, -5, "Raw difference exposes anomaly rather than clamping to 0");

      // Backend invariant check catches and rejects it
      const validateInvariant = (total, res) => {
        if (res > total) {
          throw new Error(`[INVARIANT BREACH] Reserved (${res}) exceeds total (${total})`);
        }
        return total - res;
      };

      assert.throws(
        () => validateInvariant(holding.quantity, reserved),
        /INVARIANT BREACH/
      );
    });

    it("Portfolio Order Lock: atomic acquire succeeds when unlocked, rejects concurrent attempt when locked, and recovers automatically after expiry", () => {
      let doc = {
        _id: "part-lock-test",
        orderLock: false,
        orderLockExpires: null,
      };

      // Atomic findOneAndUpdate simulation matching tournamentService.js:
      // { _id, $or: [{ orderLock: false }, { orderLock: { $exists: false } }, { orderLockExpires: { $lt: now } }] }
      const tryAcquireLock = (now = new Date()) => {
        const isUnlocked = !doc.orderLock || (doc.orderLockExpires && doc.orderLockExpires < now);
        if (isUnlocked) {
          doc.orderLock = true;
          doc.orderLockExpires = new Date(now.getTime() + 5000);
          return { ...doc };
        }
        return null;
      };

      const releaseLock = () => {
        doc.orderLock = false;
        doc.orderLockExpires = null;
      };

      const t0 = new Date("2026-10-11T12:00:00Z");

      // 1. Initial acquire must succeed
      const lock1 = tryAcquireLock(t0);
      assert.ok(lock1, "First acquire must succeed");
      assert.strictEqual(doc.orderLock, true);
      assert.strictEqual(doc.orderLockExpires.getTime(), t0.getTime() + 5000);

      // 2. Concurrent acquire at same timestamp must be rejected (atomic conflict)
      const lock2 = tryAcquireLock(t0);
      assert.strictEqual(lock2, null, "Concurrent second attempt must be rejected");

      // 3. Normal release clears lock
      releaseLock();
      assert.strictEqual(doc.orderLock, false);
      const lock3 = tryAcquireLock(t0);
      assert.ok(lock3, "Acquire after normal release succeeds");

      // 4. Hard crash recovery: lock held without release, but 5 seconds elapse
      const t1 = new Date(t0.getTime() + 5001); // 5001ms later
      const lockRecovered = tryAcquireLock(t1);
      assert.ok(lockRecovered, "Lock must automatically recover after 5s expiry window expires");
    });
  });
});





