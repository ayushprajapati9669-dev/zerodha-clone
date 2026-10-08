import express from "express";
import data from "../controller/fundController.js"
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
const { addAmount, withdrawAmount, getUserFund, getFundTransactions } = data;

const router = express.Router();
router.get("/", isLoggedIn, getUserFund);
router.post("/add", isLoggedIn, addAmount);
router.post("/withdraw", isLoggedIn, withdrawAmount);
router.get("/transactions", isLoggedIn, getFundTransactions);
export default router;