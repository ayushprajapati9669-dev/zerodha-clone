import express from "express";
import getAllHoldings from "../controller/holdingController.js";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
const router = express.Router();
router.get("/", isLoggedIn, getAllHoldings);
export default router;