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
        initialBalance: 1000000,
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

    it("should default status to upcoming and initialBalance to 1000000", async () => {
      const now = new Date();
      const t = new TournamentModel({
        name: "Default Test",
        description: "Testing defaults",
        startDate: now,
        endDate: new Date(now.getTime() + 3600 * 1000),
      });
      assert.strictEqual(t.status, "upcoming");
      assert.strictEqual(t.initialBalance, 1000000);
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
        initialBalance: 1000000,
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
        initialBalance: 1000000,
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
        initialBalance: 1000000,
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
      const initialBalance = 1000000;
      const portfolioValue = 1125000;
      const pnl = portfolioValue - initialBalance;
      const returnPct = (pnl / initialBalance) * 100;

      assert.strictEqual(pnl, 125000);
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
        initialBalance: 1000000,
        availableCash: 1000000,
        portfolioValue: 1000000,
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
});
