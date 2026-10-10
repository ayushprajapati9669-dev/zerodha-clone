import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import {
      getAlerts,
      createAlert,
      updateAlert,
      deleteAlert,
} from "../controller/priceAlertController.js";

const router = express.Router();

router.get("/", isLoggedIn, getAlerts);
router.post("/", isLoggedIn, createAlert);
router.patch("/:alertId", isLoggedIn, updateAlert);
router.delete("/:alertId", isLoggedIn, deleteAlert);

export default router;
