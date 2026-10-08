import express from "express";
import getAllPositions from "../controller/positionController.js";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
const router = express.Router();
router.get("/",isLoggedIn, getAllPositions);
export default router;