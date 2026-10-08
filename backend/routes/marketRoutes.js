import express from "express";

import {
      getMarketPrice,
      getMarketPrices,
      getHistoricalMarketPricesController,
} from "../controller/marketController.js";

const router = express.Router();

// ==================================================
// Get Single Market Price
// ==================================================

router.get(
      "/price/:symbol",
      getMarketPrice,
);

// ==================================================
// Get All Market Prices
// ==================================================

router.get(
      "/prices",
      getMarketPrices,
);

// ==================================================
// Get Historical Market Prices
// ==================================================

router.get(
      "/prices/:symbol/history",
      getHistoricalMarketPricesController,
);

export default router;