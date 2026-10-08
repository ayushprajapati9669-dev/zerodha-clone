import express from "express";
const router = express.Router();
import validateOrder from "../middleware/orderValidation.js";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";

import data from "../controller/orderController.js";
const { createOrderController, getAllOrders, cancelLimitOrderController } = data;

router.get("/", isLoggedIn, getAllOrders);
router.post("/", isLoggedIn, validateOrder, createOrderController);
router.post("/cancel-limit", isLoggedIn, cancelLimitOrderController);
export default router;