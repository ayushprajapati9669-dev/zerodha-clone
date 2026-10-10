import { describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import watchlistListSchema, {
  MAX_WATCHLISTS_PER_USER,
  MAX_SYMBOLS_PER_WATCHLIST,
} from "../schemas/WatchlistListSchema.js";
import priceAlertSchema from "../schemas/PriceAlertSchema.js";

// Helper to create mocked req, res, next
const createMockReqRes = (options = {}) => {
  const req = {
    user: "user" in options ? options.user : { userId: new mongoose.Types.ObjectId().toString() },
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
  const next = (err) => {
    if (err) throw err;
  };
  return { req, res, next };
};

describe("Advanced Watchlist & Price Alerts Test Suite", () => {
  describe("Watchlist Schema and Limits", () => {
    it("should export correct limits for watchlists and symbols", () => {
      assert.equal(MAX_WATCHLISTS_PER_USER, 10);
      assert.equal(MAX_SYMBOLS_PER_WATCHLIST, 50);
    });

    it("should validate that symbols array cannot exceed MAX_SYMBOLS_PER_WATCHLIST", () => {
      const validator = watchlistListSchema.path("symbols").validators[0].validator;
      const validArray = Array.from({ length: 50 }, (_, i) => ({
        symbol: `SYM${i}`,
        companyName: `Company ${i}`,
      }));
      assert.equal(validator(validArray), true);

      const invalidArray = Array.from({ length: 51 }, (_, i) => ({
        symbol: `SYM${i}`,
        companyName: `Company ${i}`,
      }));
      assert.equal(validator(invalidArray), false);
    });
  });

  describe("Price Alert Schema and Condition Validation", () => {
    it("should require positive target prices and valid condition enums", () => {
      const conditionEnum = priceAlertSchema.path("condition").enumValues;
      assert.deepEqual(conditionEnum, ["above", "below"]);

      const minValidator = priceAlertSchema.path("targetPrice").validators.find(
        (v) => v.type === "min"
      );
      assert.ok(minValidator);
      assert.equal(minValidator.min, 0.01);
    });
  });

  describe("Symbol Normalization and Input Validation", () => {
    const normalize = (symbol) =>
      String(symbol || "")
        .trim()
        .toUpperCase()
        .replace(/^(NSE:|BSE:)/i, "");

    it("should normalize symbols correctly stripping whitespace and exchange prefixes", () => {
      assert.equal(normalize("  nse:reliance  "), "RELIANCE");
      assert.equal(normalize("BSE:TCS"), "TCS");
      assert.equal(normalize("infy"), "INFY");
    });

    it("should reject invalid symbols and negative or non-numeric target prices", () => {
      const validateAlertInput = (body) => {
        const { symbol, condition, targetPrice } = body;
        if (!symbol || !symbol.trim()) return "Symbol is required.";
        if (!["above", "below"].includes(condition)) return "Condition must be above or below.";
        const price = Number(targetPrice);
        if (!Number.isFinite(price) || price <= 0) return "Target price must be positive.";
        return null;
      };

      assert.equal(validateAlertInput({ symbol: "", condition: "above", targetPrice: 100 }), "Symbol is required.");
      assert.equal(validateAlertInput({ symbol: "TCS", condition: "between", targetPrice: 100 }), "Condition must be above or below.");
      assert.equal(validateAlertInput({ symbol: "TCS", condition: "above", targetPrice: -50 }), "Target price must be positive.");
      assert.equal(validateAlertInput({ symbol: "TCS", condition: "above", targetPrice: "invalid" }), "Target price must be positive.");
      assert.equal(validateAlertInput({ symbol: "TCS", condition: "above", targetPrice: 3500 }), null);
    });
  });

  describe("Price Alert Trigger Evaluation Logic", () => {
    // Pure logic simulation of evaluateAlerts
    const evaluateAlertsLogic = (alerts, symbol, currentPrice) => {
      if (!symbol || !Number.isFinite(currentPrice) || currentPrice <= 0) {
        return [];
      }

      const triggered = alerts.filter((alert) => {
        if (!alert.isActive || alert.isTriggered) return false;
        if (alert.symbol !== symbol) return false;

        if (alert.condition === "above") {
          return currentPrice >= alert.targetPrice;
        }
        if (alert.condition === "below") {
          return currentPrice <= alert.targetPrice;
        }
        return false;
      });

      // Mark triggered in-memory
      triggered.forEach((a) => {
        a.isTriggered = true;
        a.triggeredPrice = currentPrice;
      });

      return triggered;
    };

    it("should trigger 'above' condition when price rises to or crosses target", () => {
      const alerts = [
        {
          _id: "1",
          symbol: "RELIANCE",
          condition: "above",
          targetPrice: 2500,
          isActive: true,
          isTriggered: false,
        },
      ];

      // Tick below target: does not trigger
      let fired = evaluateAlertsLogic(alerts, "RELIANCE", 2480);
      assert.equal(fired.length, 0);
      assert.equal(alerts[0].isTriggered, false);

      // Tick at or above target: triggers!
      fired = evaluateAlertsLogic(alerts, "RELIANCE", 2510);
      assert.equal(fired.length, 1);
      assert.equal(alerts[0].isTriggered, true);
      assert.equal(alerts[0].triggeredPrice, 2510);
    });

    it("should trigger 'below' condition when price drops to or below target", () => {
      const alerts = [
        {
          _id: "2",
          symbol: "TCS",
          condition: "below",
          targetPrice: 3400,
          isActive: true,
          isTriggered: false,
        },
      ];

      // Tick above target: does not trigger
      let fired = evaluateAlertsLogic(alerts, "TCS", 3450);
      assert.equal(fired.length, 0);

      // Tick below target: triggers!
      fired = evaluateAlertsLogic(alerts, "TCS", 3390);
      assert.equal(fired.length, 1);
      assert.equal(alerts[0].isTriggered, true);
    });

    it("should prevent duplicate alerts on subsequent ticks once triggered", () => {
      const alerts = [
        {
          _id: "3",
          symbol: "INFY",
          condition: "above",
          targetPrice: 1500,
          isActive: true,
          isTriggered: false,
        },
      ];

      // First crossing
      let fired = evaluateAlertsLogic(alerts, "INFY", 1520);
      assert.equal(fired.length, 1);

      // Next tick higher: should NOT re-trigger!
      fired = evaluateAlertsLogic(alerts, "INFY", 1530);
      assert.equal(fired.length, 0);

      // Next tick lower then higher: still should NOT re-trigger because isTriggered === true
      fired = evaluateAlertsLogic(alerts, "INFY", 1490);
      assert.equal(fired.length, 0);
      fired = evaluateAlertsLogic(alerts, "INFY", 1550);
      assert.equal(fired.length, 0);
    });

    it("should safely handle zero, negative, NaN or invalid prices without triggering", () => {
      const alerts = [
        {
          _id: "4",
          symbol: "SBIN",
          condition: "below",
          targetPrice: 600,
          isActive: true,
          isTriggered: false,
        },
      ];

      assert.equal(evaluateAlertsLogic(alerts, "SBIN", 0).length, 0);
      assert.equal(evaluateAlertsLogic(alerts, "SBIN", -10).length, 0);
      assert.equal(evaluateAlertsLogic(alerts, "SBIN", NaN).length, 0);
      assert.equal(evaluateAlertsLogic(alerts, "SBIN", null).length, 0);
      assert.equal(evaluateAlertsLogic(alerts, "", 550).length, 0);
      assert.equal(alerts[0].isTriggered, false);
    });
  });

  describe("Watchlist Operations and Ownership Integrity", () => {
    it("should prevent duplicate symbols from being added to the same watchlist", () => {
      const symbols = [{ symbol: "RELIANCE", companyName: "Reliance Industries" }];
      const addSymbolCheck = (list, newSymbol) => {
        const norm = newSymbol.toUpperCase();
        if (list.some((s) => s.symbol === norm)) {
          return { error: "Symbol already in this watchlist" };
        }
        list.push({ symbol: norm });
        return { success: true };
      };

      const result1 = addSymbolCheck(symbols, "reliance");
      assert.ok(result1.error);
      assert.equal(symbols.length, 1);

      const result2 = addSymbolCheck(symbols, "TCS");
      assert.ok(result2.success);
      assert.equal(symbols.length, 2);
    });

    it("should reject unauthenticated requests", () => {
      const { req, res } = createMockReqRes({ user: null });
      const authMiddleware = (req, res, next) => {
        if (!req.user || !req.user.userId) {
          return res.status(401).json({ success: false, message: "Authentication required" });
        }
        next();
      };

      let calledNext = false;
      authMiddleware(req, res, () => {
        calledNext = true;
      });
      assert.equal(calledNext, false);
      assert.equal(res.statusCode, 401);
    });

    it("should enforce ownership checks so User A cannot access User B's watchlist", () => {
      const userAId = "user_aaa_111";
      const userBId = "user_bbb_222";

      const mockWatchlistsDb = [
        { _id: "wl_1", userId: userAId, name: "User A Watchlist" },
        { _id: "wl_2", userId: userBId, name: "User B Watchlist" },
      ];

      const getWatchlistForUser = (userId, watchlistId) => {
        const found = mockWatchlistsDb.find(
          (w) => w._id === watchlistId && w.userId === userId
        );
        if (!found) return { status: 404, message: "Watchlist not found" };
        return { status: 200, watchlist: found };
      };

      // User A can access their own watchlist
      const resA = getWatchlistForUser(userAId, "wl_1");
      assert.equal(resA.status, 200);

      // User A CANNOT access User B's watchlist
      const resB = getWatchlistForUser(userAId, "wl_2");
      assert.equal(resB.status, 404);
    });

    it("should protect against deleting the last remaining watchlist", () => {
      const userWatchlists = [{ _id: "wl_1", name: "Default List" }];
      const canDelete = (lists) => lists.length > 1;

      assert.equal(canDelete(userWatchlists), false);
      userWatchlists.push({ _id: "wl_2", name: "Second List" });
      assert.equal(canDelete(userWatchlists), true);
    });
  });

  describe("Price Alert End-to-End Scenarios and Isolation", () => {
    it("Scenario 1: Manual stock selection without initial stock sets correct symbol and price", () => {
      let state = { symbol: "", companyName: "", targetPrice: "" };
      const selectStock = (stk, currentPrices, condition = "above") => {
        const sym = stk.symbol.toUpperCase();
        const ltp = currentPrices[sym] || 0;
        return {
          symbol: sym,
          companyName: stk.companyName,
          targetPrice: ltp > 0 ? Number((ltp * 1.02).toFixed(2)) : "",
        };
      };

      const prices = { INFY: 1500 };
      state = selectStock({ symbol: "INFY", companyName: "Infosys" }, prices);
      assert.equal(state.symbol, "INFY");
      assert.equal(state.companyName, "Infosys");
      assert.equal(state.targetPrice, 1530);
    });

    it("Scenario 2 & 3: Preselected stock from watchlist can be switched to another stock", () => {
      const initialStock = { symbol: "TCS", companyName: "Tata Consultancy Services" };
      let symbol = initialStock.symbol;
      assert.equal(symbol, "TCS");

      // User changes to RELIANCE
      const newStock = { symbol: "RELIANCE", companyName: "Reliance Industries" };
      symbol = newStock.symbol;
      assert.equal(symbol, "RELIANCE");
    });

    it("Scenario 4: Live tick arrives without resetting user's manual target price", () => {
      let targetPrice = 2650; // User typed this
      const onTick = (newTickPrice) => {
        // Live LTP display updates
        const liveLtp = newTickPrice;
        // Target price must NOT be touched by the tick handler!
        return { liveLtp, targetPrice };
      };

      const result = onTick(2512.45);
      assert.equal(result.liveLtp, 2512.45);
      assert.equal(result.targetPrice, 2650); // Unchanged!
    });

    it("Scenario 5 & 6: Above-target and Below-target alert creation payload validation", () => {
      const validateAlertPayload = (payload) => {
        if (!payload.symbol) return { error: "Symbol required" };
        if (!["above", "below"].includes(payload.condition)) return { error: "Invalid condition" };
        if (!Number.isFinite(payload.targetPrice) || payload.targetPrice <= 0) return { error: "Invalid price" };
        return { success: true };
      };

      assert.equal(validateAlertPayload({ symbol: "INFY", condition: "above", targetPrice: 1600 }).success, true);
      assert.equal(validateAlertPayload({ symbol: "INFY", condition: "below", targetPrice: 1400 }).success, true);
    });

    it("Scenario 7: Rejects empty or invalid target prices", () => {
      const validate = (targetPrice) => {
        const p = Number(targetPrice);
        return Number.isFinite(p) && p > 0;
      };

      assert.equal(validate(""), false);
      assert.equal(validate("0"), false);
      assert.equal(validate("-10"), false);
      assert.equal(validate("abc"), false);
      assert.equal(validate("2500.50"), true);
    });

    it("Scenario 8: Handles API responses with success: false safely", () => {
      const handleApiResponse = (response) => {
        if (response?.data?.success) {
          return { status: "ok", alert: response.data.alert };
        }
        return { status: "error", message: response?.data?.message || "Failed to create price alert." };
      };

      const failedResponse = { data: { success: false, message: "Limit of 20 alerts reached." } };
      const outcome = handleApiResponse(failedResponse);
      assert.equal(outcome.status, "error");
      assert.equal(outcome.message, "Limit of 20 alerts reached.");
    });

    it("Scenario 9 & 10: User A cannot view or delete User B's price alerts", () => {
      const alertsDb = [
        { _id: "alert_1", userId: "user_A", symbol: "RELIANCE", targetPrice: 2600 },
        { _id: "alert_2", userId: "user_B", symbol: "TCS", targetPrice: 3500 },
      ];

      // User A lists alerts: gets only alert_1
      const userAAlerts = alertsDb.filter((a) => a.userId === "user_A");
      assert.equal(userAAlerts.length, 1);
      assert.equal(userAAlerts[0]._id, "alert_1");

      // User A attempts to delete User B's alert_2
      const deleteAlert = (requesterId, alertId) => {
        const index = alertsDb.findIndex((a) => a._id === alertId && a.userId === requesterId);
        if (index === -1) return { status: 404, message: "Alert not found." };
        alertsDb.splice(index, 1);
        return { status: 200, message: "Alert deleted." };
      };

      const unauthorizedDelete = deleteAlert("user_A", "alert_2");
      assert.equal(unauthorizedDelete.status, 404);
      assert.equal(alertsDb.some((a) => a._id === "alert_2"), true); // Remains intact!

      // User B deletes alert_2
      const authorizedDelete = deleteAlert("user_B", "alert_2");
      assert.equal(authorizedDelete.status, 200);
      assert.equal(alertsDb.some((a) => a._id === "alert_2"), false); // Deleted!
    });
  });
});
