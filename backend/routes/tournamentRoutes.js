import express from "express";
import isLoggedIn from "../middleware/isLoggedInMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";
import {
  listTournaments,
  getTournamentDetails,
  createTournament,
  joinTournament,
  leaveTournament,
  getMyParticipation,
  getTournamentLeaderboard,
  placeTrade,
  cancelOrder,
  getTournamentOrders,
  getMyTournamentHistory,
  seedTournaments,
  adminListTournaments,
  adminGetTournamentDetails,
  adminUpdateTournament,
  adminUpdateTournamentStatus,
  adminGetTournamentParticipants,
  adminGetTournamentOrders,
  adminDisqualifyParticipant,
} from "../controller/tournamentController.js";

const router = express.Router();

export { adminOnly };

// =========================================================================
// ADMIN ROUTES (Declared first to avoid :id wildcard matching)
// =========================================================================

router.get("/admin/tournaments", isLoggedIn, adminOnly, adminListTournaments);
router.post("/admin/create", isLoggedIn, adminOnly, createTournament);
router.post("/admin/seed", isLoggedIn, adminOnly, seedTournaments);
router.get("/admin/tournaments/:id", isLoggedIn, adminOnly, adminGetTournamentDetails);
router.put("/admin/tournaments/:id", isLoggedIn, adminOnly, adminUpdateTournament);
router.patch(
  "/admin/tournaments/:id/status",
  isLoggedIn,
  adminOnly,
  adminUpdateTournamentStatus
);
router.get(
  "/admin/tournaments/:id/participants",
  isLoggedIn,
  adminOnly,
  adminGetTournamentParticipants
);
router.get(
  "/admin/tournaments/:id/orders",
  isLoggedIn,
  adminOnly,
  adminGetTournamentOrders
);
router.patch(
  "/admin/tournaments/:id/participants/:participationId/disqualify",
  isLoggedIn,
  adminOnly,
  adminDisqualifyParticipant
);

// =========================================================================
// USER & PUBLIC ROUTES
// =========================================================================

router.get("/", isLoggedIn, listTournaments);
router.get("/my-history", isLoggedIn, getMyTournamentHistory);
router.get("/:id", isLoggedIn, getTournamentDetails);
router.get("/:id/leaderboard", isLoggedIn, getTournamentLeaderboard);

// Participation
router.post("/:id/join", isLoggedIn, joinTournament);
router.delete("/:id/leave", isLoggedIn, leaveTournament);
router.get("/:id/my-participation", isLoggedIn, getMyParticipation);

// Paper trading
router.post("/:id/trades", isLoggedIn, placeTrade);
router.get("/:id/orders", isLoggedIn, getTournamentOrders);
router.patch("/:id/orders/:orderId/cancel", isLoggedIn, cancelOrder);

export default router;
