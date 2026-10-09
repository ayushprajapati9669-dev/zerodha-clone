import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
  getPortfolioAnalyticsSummary,
  getPortfolioPerformanceOverTime,
  getPnLBreakdownService,
  getStockRankingsService,
} from "../services/portfolioAnalyticsService.js";

const router = express.Router();

/**
 * GET /api/analytics/summary
 * Returns overall portfolio analytics summary (invested, current, cash, realized, unrealized, total P&L, day P&L)
 */
router.get("/summary", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.userId;
    const summary = await getPortfolioAnalyticsSummary(userId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio analytics summary",
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/performance?range=1W|1M|3M|6M|1Y|ALL
 * Returns historical portfolio valuation snapshot time-series data & performance metrics
 */
router.get("/performance", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.userId;
    const range = (req.query.range || "1M").toUpperCase();

    const allowedRanges = ["1W", "1M", "3M", "6M", "1Y", "ALL"];
    const validRange = allowedRanges.includes(range) ? range : "1M";

    const performance = await getPortfolioPerformanceOverTime(userId, validRange);

    return res.status(200).json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error("Error fetching portfolio performance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch portfolio performance data",
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/pnl-breakdown?symbol=RELIANCE
 * Returns realized vs unrealized P&L breakdown and sell transaction history
 */
router.get("/pnl-breakdown", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.userId;
    const symbol = req.query.symbol || null;

    const breakdown = await getPnLBreakdownService(userId, symbol);

    return res.status(200).json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    console.error("Error fetching P&L breakdown:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch P&L breakdown",
      error: error.message,
    });
  }
});

/**
 * GET /api/analytics/stock-rankings
 * Returns best/worst performing stocks, concentration indicators, and stock list
 */
router.get("/stock-rankings", isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.userId;

    const rankings = await getStockRankingsService(userId);

    return res.status(200).json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    console.error("Error fetching stock rankings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stock rankings",
      error: error.message,
    });
  }
});

export default router;
