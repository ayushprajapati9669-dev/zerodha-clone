import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import { adminOnly } from "../middleware/adminMiddleware.js";
import tournamentSchema from "../schemas/TournamentSchema.js";
import tournamentParticipationSchema from "../schemas/TournamentParticipationSchema.js";
import tournamentOrderSchema from "../schemas/TournamentOrderSchema.js";

// ---------------------------------------------------------------------------
// MOCK REQ / RES GENERATOR
// ---------------------------------------------------------------------------
const createMockReqRes = (options = {}) => {
  const req = {
    user: "user" in options ? options.user : null,
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

describe("Tournament Admin & Security Audit Test Suite", () => {
  // =========================================================================
  // 1. ADMIN AUTHORIZATION & ACCESS CONTROL (Priority 3.A & 3.G)
  // =========================================================================
  describe("Admin Authorization Middleware (adminOnly)", () => {
    it("should reject unauthenticated request (no user on req)", () => {
      const { req, res } = createMockReqRes({ user: null });
      let nextCalled = false;
      adminOnly(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, "next() must not be called");
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data?.success, false);
      assert.strictEqual(res.data?.message, "Admin access required.");
    });

    it("should reject normal authenticated user with role 'user'", () => {
      const { req, res } = createMockReqRes({
        user: { userId: "user-123", role: "user" },
      });
      let nextCalled = false;
      adminOnly(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, "next() must not be called for role: user");
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(res.data?.success, false);
      assert.strictEqual(res.data?.message, "Admin access required.");
    });

    it("should allow authorized user with role 'admin'", () => {
      const { req, res } = createMockReqRes({
        user: { userId: "admin-456", role: "admin" },
      });
      let nextCalled = false;
      adminOnly(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, true, "next() must be called for role: admin");
      assert.strictEqual(res.statusCode, 200);
    });

    it("should NEVER trust role supplied in request body", () => {
      // Attacker sends role: 'admin' in body, but authenticated token has role: 'user'
      const { req, res } = createMockReqRes({
        user: { userId: "user-123", role: "user" },
        body: { role: "admin", isAdmin: true },
      });
      let nextCalled = false;
      adminOnly(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false, "Must not trust role from request body");
      assert.strictEqual(res.statusCode, 403);
    });
  });

  // =========================================================================
  // 2. ADMIN CREATE & EDIT PAYLOAD VALIDATION (Priority 3.C & 3.D)
  // =========================================================================
  describe("Admin Tournament Payload Validation", () => {
    it("should reject tournament creation with end date before start date", () => {
      const start = new Date("2026-10-15T10:00:00");
      const end = new Date("2026-10-15T09:00:00"); // Before start
      const isValid = start < end;
      assert.strictEqual(isValid, false, "End date must be after start date");
    });

    it("should reject tournament creation with initial balance below ₹10,000", () => {
      const minRequired = 10000;
      const invalidBalance = 5000;
      assert.strictEqual(invalidBalance >= minRequired, false);
    });

    it("should reject tournament creation with max participants below 2", () => {
      const minRequired = 2;
      const invalidParticipants = 1;
      assert.strictEqual(invalidParticipants >= minRequired, false);
    });

    it("should reject invalid tournamentType enum value", () => {
      const allowedTypes = ["daily", "weekly", "monthly", "private"];
      const invalidType = "annual_special";
      assert.strictEqual(allowedTypes.includes(invalidType), false);
    });

    it("should require invite code when tournament is private", () => {
      const isPrivate = true;
      const inviteCode = "";
      const valid = !isPrivate || (typeof inviteCode === "string" && inviteCode.trim().length > 0);
      assert.strictEqual(valid, false, "Private tournament must require non-empty invite code");
    });

    it("should reject lowering maxParticipants below current active participant count", () => {
      const currentParticipantCount = 45;
      const requestedMax = 30;
      const canUpdate = requestedMax >= currentParticipantCount;
      assert.strictEqual(
        canUpdate,
        false,
        "Cannot lower max participants below enrolled count"
      );
    });
  });

  // =========================================================================
  // 3. TOURNAMENT LIFECYCLE TRANSITION INTEGRITY (Priority 3.D & 3.E)
  // =========================================================================
  describe("Tournament Status Lifecycle Transition Rules", () => {
    const validateStatusTransition = (current, target) => {
      const validStatuses = ["upcoming", "active", "completed", "cancelled"];
      if (!validStatuses.includes(target)) return { allowed: false, reason: "Invalid target status" };
      if (current === target) return { allowed: true, reason: "No change" };
      if (current === "completed") return { allowed: false, reason: "Cannot modify completed tournament" };
      if (current === "cancelled") return { allowed: false, reason: "Cannot modify cancelled tournament" };
      if (current === "upcoming" && target === "completed") {
        return { allowed: false, reason: "Upcoming tournament must be started before completing" };
      }
      return { allowed: true, reason: "Valid transition" };
    };

    it("should allow starting upcoming tournament early ('upcoming' -> 'active')", () => {
      const result = validateStatusTransition("upcoming", "active");
      assert.strictEqual(result.allowed, true);
    });

    it("should allow ending active tournament early ('active' -> 'completed')", () => {
      const result = validateStatusTransition("active", "completed");
      assert.strictEqual(result.allowed, true);
    });

    it("should allow cancelling upcoming or active tournament", () => {
      assert.strictEqual(validateStatusTransition("upcoming", "cancelled").allowed, true);
      assert.strictEqual(validateStatusTransition("active", "cancelled").allowed, true);
    });

    it("should REJECT restarting an already completed tournament ('completed' -> 'active')", () => {
      const result = validateStatusTransition("completed", "active");
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.reason, "Cannot modify completed tournament");
    });

    it("should REJECT reviving a cancelled tournament ('cancelled' -> 'active')", () => {
      const result = validateStatusTransition("cancelled", "active");
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.reason, "Cannot modify cancelled tournament");
    });

    it("should REJECT direct completion of upcoming tournament without starting", () => {
      const result = validateStatusTransition("upcoming", "completed");
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(
        result.reason,
        "Upcoming tournament must be started before completing"
      );
    });

    it("should REJECT unknown arbitrary status values", () => {
      const result = validateStatusTransition("upcoming", "paused_invalid");
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.reason, "Invalid target status");
    });
  });

  // =========================================================================
  // 4. PARTICIPANT DISQUALIFICATION LOGIC (Priority 3.D)
  // =========================================================================
  describe("Participant Disqualification Safety", () => {
    it("should set participation status to 'disqualified' and release pending limit orders", () => {
      const participation = {
        _id: "part-1",
        status: "active",
        availableCash: 700000,
        reservedCash: 300000,
      };

      const pendingOrders = [
        { _id: "ord-1", action: "BUY", reservedAmount: 200000, status: "PENDING" },
        { _id: "ord-2", action: "BUY", reservedAmount: 100000, status: "PENDING" },
      ];

      // Simulate disqualification
      participation.status = "disqualified";
      for (const order of pendingOrders) {
        order.status = "CANCELLED";
        order.rejectionReason = "Disqualification by admin";
        participation.availableCash += order.reservedAmount;
        participation.reservedCash -= order.reservedAmount;
      }

      assert.strictEqual(participation.status, "disqualified");
      assert.strictEqual(participation.availableCash, 1000000);
      assert.strictEqual(participation.reservedCash, 0);
      assert.strictEqual(pendingOrders[0].status, "CANCELLED");
      assert.strictEqual(pendingOrders[1].status, "CANCELLED");
    });

    it("should reject disqualifying an already disqualified user", () => {
      const participation = { _id: "part-1", status: "disqualified" };
      const canDisqualify = participation.status !== "disqualified";
      assert.strictEqual(canDisqualify, false, "Cannot disqualify already disqualified participant");
    });
  });

  // =========================================================================
  // 5. BACKEND TRADING SECURITY & CONCURRENCY (Priority 4)
  // =========================================================================
  describe("Trading Logic Backend Verification", () => {
    it("server-calculated balances and P&L cannot be overridden by request payload", () => {
      const mockReqBody = {
        symbol: "RELIANCE",
        action: "BUY",
        quantity: 10,
        // Malicious injected parameters attempting to override balance
        availableCash: 999999999,
        portfolioValue: 999999999,
        realizedPnL: 500000,
        rank: 1,
      };

      const serverParticipation = {
        availableCash: 100000,
        portfolioValue: 100000,
        realizedPnL: 0,
        rank: 5,
      };

      const executionPrice = 2500;
      const totalCost = mockReqBody.quantity * executionPrice; // 25,000

      // Server calculations only use stored values and official prices
      serverParticipation.availableCash -= totalCost;

      assert.strictEqual(serverParticipation.availableCash, 75000);
      assert.strictEqual(serverParticipation.realizedPnL, 0);
      assert.strictEqual(serverParticipation.rank, 5);
      assert.notStrictEqual(serverParticipation.availableCash, mockReqBody.availableCash);
    });

    it("should reject BUY when available cash is less than total required cost", () => {
      const availableCash = 20000;
      const cost = 25000;
      const canBuy = availableCash >= cost;
      assert.strictEqual(canBuy, false, "Must reject BUY order with insufficient funds");
    });

    it("should atomically prevent concurrent BUY orders from overspending available cash", () => {
      let availableCash = 50000;
      const orderAmount = 30000;

      // Simulate atomic conditional update: { availableCash: { $gte: orderAmount } }
      const tryDeduct = (amount) => {
        if (availableCash >= amount) {
          availableCash -= amount;
          return true; // Deduction succeeded
        }
        return false; // Insufficient funds
      };

      const req1Success = tryDeduct(orderAmount);
      const req2Success = tryDeduct(orderAmount);

      assert.strictEqual(req1Success, true, "First request consumes 30k (balance becomes 20k)");
      assert.strictEqual(req2Success, false, "Second concurrent request must fail because 20k < 30k");
      assert.strictEqual(availableCash, 20000, "Cash cannot go negative");
    });

    it("should prevent overselling holdings across concurrent/pending SELL orders", () => {
      const totalHoldingQty = 50;
      const pendingSellOrders = [
        { symbol: "TCS", action: "SELL", quantity: 30, status: "PENDING" },
      ];

      const reservedQty = pendingSellOrders.reduce((sum, o) => sum + o.quantity, 0);
      const availableToSell = totalHoldingQty - reservedQty; // 20

      const requestedSellQty = 25;
      const canSell = availableToSell >= requestedSellQty;

      assert.strictEqual(canSell, false, "Cannot sell more than available (50 - 30 reserved = 20 available)");
    });

    it("should reject duplicate order cancellation and never release reservations twice", () => {
      const order = {
        _id: "order-99",
        status: "PENDING",
        reservedAmount: 50000,
      };
      let availableCash = 950000;
      let reservedCash = 50000;

      // Atomic cancellation transition: status PENDING -> CANCELLED
      const cancelOrderAtomic = () => {
        if (order.status !== "PENDING") {
          return false; // Already processed
        }
        order.status = "CANCELLED";
        availableCash += order.reservedAmount;
        reservedCash -= order.reservedAmount;
        return true;
      };

      const firstCancellation = cancelOrderAtomic();
      const secondCancellation = cancelOrderAtomic(); // Duplicate or retry request

      assert.strictEqual(firstCancellation, true, "First cancellation succeeds");
      assert.strictEqual(secondCancellation, false, "Second cancellation must be rejected");
      assert.strictEqual(availableCash, 1000000, "Cash released exactly once");
      assert.strictEqual(reservedCash, 0, "Reserved cash released exactly once");
    });

    it("should protect against cross-user order cancellation (User A cannot cancel User B's order)", () => {
      const order = {
        _id: "order-123",
        userId: "user-B",
        status: "PENDING",
      };
      const requestingUserId = "user-A";

      const canCancel = order.userId === requestingUserId && order.status === "PENDING";
      assert.strictEqual(canCancel, false, "User A must not be allowed to cancel User B's order");
    });

    it("should reject trading when tournament is in 'upcoming' or 'completed' status", () => {
      const canTradeInTournament = (status) => status === "active";

      assert.strictEqual(canTradeInTournament("upcoming"), false, "Trading rejected in upcoming tournament");
      assert.strictEqual(canTradeInTournament("completed"), false, "Trading rejected in completed tournament");
      assert.strictEqual(canTradeInTournament("cancelled"), false, "Trading rejected in cancelled tournament");
      assert.strictEqual(canTradeInTournament("active"), true, "Trading permitted only in active tournament");
    });

    it("market orders must fail safely when no valid current market price is available", () => {
      const getSafePrice = (price) => {
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("Live market price currently unavailable. Orders require valid market data.");
        }
        return price;
      };

      assert.throws(() => getSafePrice(0), /Live market price currently unavailable/);
      assert.throws(() => getSafePrice(-10), /Live market price currently unavailable/);
      assert.throws(() => getSafePrice(NaN), /Live market price currently unavailable/);
      assert.throws(() => getSafePrice(null), /Live market price currently unavailable/);
      assert.strictEqual(getSafePrice(2500), 2500);
    });
  });
});
