import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import "../styles/Tournament.css";
import socket from "../socket.js";
import {
  listTournaments,
  joinTournament,
  getMyParticipation,
  getTournamentLeaderboard,
  placeTrade,
  cancelOrder,
  getTournamentOrders,
  getMyTournamentHistory,
} from "../services/tournamentService.js";

// =========================================================================
// UTILITY HELPERS
// =========================================================================

const fmt = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—";

const fmtPct = (n) =>
  typeof n === "number"
    ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`
    : "—";

const statusClass = {
  active: "badge-active",
  upcoming: "badge-upcoming",
  completed: "badge-completed",
  cancelled: "badge-cancelled",
};

const getRankBadgeClass = (rank) => {
  if (rank === 1) return "rank-badge rank-1";
  if (rank === 2) return "rank-badge rank-2";
  if (rank === 3) return "rank-badge rank-3";
  return "rank-badge rank-default";
};

const rankMedal = (rank) => {
  if (typeof rank !== "number" || rank <= 0) return "—";
  if (rank === 1) return "🥇 #1";
  if (rank === 2) return "🥈 #2";
  if (rank === 3) return "🥉 #3";
  return `#${rank}`;
};

// =========================================================================
// TOURNAMENT JOIN FORM MODAL
// =========================================================================

function TournamentJoinModal({ tournament, onConfirm, onClose, loading, initialError }) {
  const { currentUser } = useContext(AppContext);
  const [profile, setProfile] = useState(currentUser || null);
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState(initialError || "");

  useEffect(() => {
    if (currentUser) {
      setProfile(currentUser);
    } else {
      axios
        .get("http://localhost:3000/api/auth/me", { withCredentials: true })
        .then((res) => {
          if (res.data?.user) setProfile(res.data.user);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tournament?.isPrivate && !code.trim()) {
      setError("Please enter the invite code for this private tournament.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the tournament rules and fair play criteria.");
      return;
    }
    setError("");
    try {
      await onConfirm(code.trim().toUpperCase());
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to join tournament");
    }
  };

  return (
    <div className="invite-overlay" onClick={onClose}>
      <div
        className="invite-modal"
        style={{ maxWidth: 520, width: "95%", textAlign: "left", borderRadius: 10, padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h5 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 17 }}>
            <i className="bi bi-trophy-fill" style={{ color: "#f57f17" }}></i>
            Join Tournament
          </h5>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#666" }}
          >
            &times;
          </button>
        </div>

        <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
            {tournament?.name}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#64748b" }}>
            <span>Type: <strong>{tournament?.tournamentType}</strong></span>
            <span>•</span>
            <span>Starting Capital: <strong style={{ color: "#2e7d32" }}>₹{fmt(tournament?.initialBalance || 100000)}</strong></span>
            <span>•</span>
            <span>Capacity: <strong>{tournament?.participantCount || 0}/{tournament?.maxParticipants}</strong></span>
          </div>
        </div>

        {/* Rules & Eligibility criteria */}
        <div style={{ fontSize: 12, color: "#475569", background: "#f1f5f9", padding: "10px 14px", borderRadius: 6, marginBottom: 14 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "#334155" }}>Tournament Rules:</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
            <li>Min. trades required for leaderboard eligibility: <strong>{tournament?.entryRules?.minTrades || 0}</strong></li>
            <li>Allowed stocks: <strong>{tournament?.entryRules?.allowedSymbols?.length ? tournament.entryRules.allowedSymbols.join(", ") : "All supported Nifty symbols"}</strong></li>
            <li>Virtual capital is fully isolated from your real trading account.</li>
          </ul>
        </div>

        {/* Prefilled verified trader details */}
        {profile && (
          <div style={{ fontSize: 12, marginBottom: 14, color: "#475569" }}>
            <span style={{ fontWeight: 600 }}>Trader Profile: </span>
            {profile.name} ({profile.email})
            {profile.mobile ? ` • Mob: ${profile.mobile}` : ""}
          </div>
        )}

        {/* Private invite code */}
        {tournament?.isPrivate && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
              Invite Code *
            </label>
            <input
              type="text"
              placeholder="ENTER INVITE CODE (e.g. ALPHA2026)"
              value={code}
              maxLength={20}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            />
          </div>
        )}

        {/* Agreement Checkbox */}
        <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: "#334155", cursor: "pointer", marginBottom: 14 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked);
              if (e.target.checked) setError("");
            }}
            style={{ marginTop: 2 }}
          />
          <span>I agree to the tournament trading rules, minimum trade requirements, and terms of fair competition.</span>
        </label>

        {error && (
          <div className="tourn-trade-error" style={{ marginBottom: 14 }}>
            <i className="bi bi-exclamation-circle-fill me-1"></i> {error}
          </div>
        )}

        <div className="invite-modal-actions" style={{ justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ background: "#f5f5f5", color: "#555", border: "1px solid #ddd", padding: "8px 16px", borderRadius: 6 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{ background: "#387ed1", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 6, fontWeight: 600 }}
          >
            {loading ? "Joining…" : "Confirm & Join"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// PAPER TRADE MODAL
// =========================================================================

function TournamentTradeModal({ action, symbol, availableCash, availableQty, onClose, onPlace }) {
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState("Market");
  const [limitPrice, setLimitPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalEst = orderType === "Limit" && limitPrice
    ? (Number(qty) * Number(limitPrice)).toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "Market price";

  const handleSubmit = async () => {
    setError("");
    const numQty = Number(qty);
    if (!Number.isInteger(numQty) || numQty < 1) {
      setError("Quantity must be a positive whole number.");
      return;
    }
    if (orderType === "Limit") {
      const lp = Number(limitPrice);
      if (!lp || lp <= 0) {
        setError("Enter a valid limit price.");
        return;
      }
    }
    setSubmitting(true);
    try {
      await onPlace({ symbol, action, orderType, quantity: numQty, limitPrice: limitPrice || undefined });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Trade failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tourn-trade-overlay" onClick={onClose}>
      <div
        className="tourn-trade-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="tourn-trade-modal-header">
          <h5>
            <span
              style={{
                background: action === "BUY" ? "#e8f0fe" : "#fce8e6",
                color: action === "BUY" ? "#1a73e8" : "#d93025",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                marginRight: 8,
              }}
            >
              {action}
            </span>
            {symbol}
          </h5>
          <button className="tourn-modal-close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="tourn-trade-modal-body">
          <div className="tourn-price-info">
            <div className="info-item">
              <label>Available Cash</label>
              <span>₹{fmt(availableCash)}</span>
            </div>
            {action === "SELL" && (
              <div className="info-item">
                <label>Shares Available</label>
                <span>{availableQty ?? "—"}</span>
              </div>
            )}
            <div className="info-item">
              <label>Est. Total</label>
              <span>₹{totalEst}</span>
            </div>
          </div>

          <div className="tourn-form-row">
            <div className="tourn-form-group">
              <label>Quantity</label>
              <input
                type="number"
                className="form-control"
                min={1}
                step={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
            <div className="tourn-form-group">
              <label>Order Type</label>
              <select
                className="form-select"
                value={orderType}
                onChange={(e) => {
                  setOrderType(e.target.value);
                  setLimitPrice("");
                }}
              >
                <option value="Market">Market</option>
                <option value="Limit">Limit</option>
              </select>
            </div>
          </div>

          {orderType === "Limit" && (
            <div className="tourn-form-group" style={{ marginBottom: 12 }}>
              <label>Limit Price (₹)</label>
              <input
                type="number"
                className="form-control"
                min={0.01}
                step={0.01}
                placeholder="Enter limit price"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
              />
            </div>
          )}

          {error && (
            <div className="tourn-trade-error">
              <i className="bi bi-exclamation-circle-fill"></i> {error}
            </div>
          )}
        </div>

        <div className="tourn-trade-modal-footer">
          <button className="tourn-cancel-btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className={action === "SELL" ? "tourn-sell-btn" : "tourn-buy-btn"}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? "Placing…"
              : `${action === "BUY" ? "Buy" : "Sell"} ${symbol}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// CANCEL ORDER CONFIRMATION MODAL
// =========================================================================

function CancelOrderConfirmationModal({
  order,
  onConfirm,
  onCancel,
  isCancelling,
  error,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isCancelling) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCancelling, onCancel]);

  if (!order) return null;

  return (
    <div
      className="tourn-trade-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCancelling) onCancel();
      }}
    >
      <div
        className="tourn-trade-modal cancel-order-modal"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tourn-trade-modal-header">
          <h5 id="cancel-order-modal-title">
            <i className="bi bi-exclamation-circle text-danger me-2"></i>
            Cancel Pending Order
          </h5>
          <button
            className="tourn-modal-close"
            onClick={onCancel}
            disabled={isCancelling}
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="tourn-trade-modal-body">
          {error && (
            <div className="tournament-error-banner mb-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
            </div>
          )}

          <p style={{ fontSize: 13, color: "#444", marginBottom: 12 }}>
            Are you sure you want to cancel this pending limit order?
          </p>

          <div className="cancel-order-details">
            <div className="cancel-order-row">
              <span className="label">Stock Symbol</span>
              <span className="value">
                <strong>{order.symbol}</strong>
              </span>
            </div>
            <div className="cancel-order-row">
              <span className="label">Order Side</span>
              <span
                className="value"
                style={{
                  color: order.action === "BUY" ? "#1a73e8" : "#d93025",
                  fontWeight: 700,
                }}
              >
                {order.action}
              </span>
            </div>
            <div className="cancel-order-row">
              <span className="label">Order Type</span>
              <span className="value">{order.orderType}</span>
            </div>
            <div className="cancel-order-row">
              <span className="label">Quantity</span>
              <span className="value">{order.quantity} shares</span>
            </div>
            <div className="cancel-order-row">
              <span className="label">Limit Price</span>
              <span className="value">₹{fmt(order.price)}</span>
            </div>
            <div className="cancel-order-row">
              <span className="label">Order Status</span>
              <span className="value order-status-badge order-status-pending">
                {order.status}
              </span>
            </div>
            {order.action === "BUY" && (order.reservedAmount > 0 || order.price > 0) && (
              <div className="cancel-order-row highlight-release">
                <span className="label">Reserved Funds to Release</span>
                <span className="value td-positive">
                  ₹{fmt(order.reservedAmount || order.quantity * order.price)}
                </span>
              </div>
            )}
          </div>

          <div className="cancel-order-notice">
            <i className="bi bi-info-circle-fill text-primary" style={{ fontSize: 16 }}></i>
            <div>
              {order.action === "BUY"
                ? `Cancelling will release ₹${fmt(
                    order.reservedAmount || order.quantity * order.price
                  )} of reserved virtual cash back to your available balance.`
                : `Cancelling will release ${order.quantity} reserved shares of ${order.symbol} back to your available holdings.`}
            </div>
          </div>
        </div>

        <div className="tourn-trade-modal-footer" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="btn-cancel-keep"
            onClick={onCancel}
            disabled={isCancelling}
          >
            Keep Order
          </button>
          <button
            type="button"
            className="btn-cancel-confirm"
            onClick={onConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Cancelling…
              </>
            ) : (
              "Cancel Order"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// TOURNAMENT LOBBY TAB
// =========================================================================

function TournamentLobbyTab({ onViewPortfolio }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marketStatus, setMarketStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [joiningId, setJoiningId] = useState(null);
  const [joinModalTournament, setJoinModalTournament] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (search.trim()) params.search = search.trim();

      const data = await listTournaments(params);
      setTournaments(data.data || []);
      setMarketStatus(data.marketData || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tournaments");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const [joinModalError, setJoinModalError] = useState("");

  const handleJoin = (tournament) => {
    setJoinModalError("");
    setJoinModalTournament(tournament);
  };

  const doJoin = async (id, inviteCode) => {
    setJoiningId(id);
    setJoinModalError("");
    setError("");
    try {
      await joinTournament(id, inviteCode);
      setSuccessMsg("✅ Successfully joined the tournament!");
      setJoinModalTournament(null);
      await fetchTournaments();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to join tournament";
      setJoinModalError(msg);
      setError(msg);
      throw err;
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div>
      {/* Market data status */}
      {marketStatus && (
        <div className={`market-data-banner ${marketStatus.connected ? "connected" : "disconnected"}`}>
          <i className={`bi bi-circle-fill`} style={{ fontSize: 8 }}></i>
          {marketStatus.connected
            ? `TrueData live prices connected — ${marketStatus.supportedSymbols?.length || 0} symbols`
            : "TrueData disconnected — market orders may fail until reconnected"}
        </div>
      )}

      {/* Filters */}
      <div className="tournament-filters">
        <input
          type="text"
          className="tournament-search-input"
          placeholder="Search tournaments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="tournament-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="tournament-filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="private">Private</option>
        </select>
        <button
          className="btn-view-tournament"
          style={{ flexShrink: 0, padding: "8px 14px" }}
          onClick={fetchTournaments}
        >
          <i className="bi bi-arrow-clockwise"></i>
        </button>
      </div>

      {successMsg && (
        <div
          style={{
            background: "#e8f5e9",
            border: "1px solid #c8e6c9",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#2e7d32",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {successMsg}
        </div>
      )}

      {error && (
        <div className="tournament-error-banner">
          <i className="bi bi-exclamation-triangle-fill"></i> {error}
        </div>
      )}

      {loading ? (
        <div className="tournament-loading">
          <div className="spinner-border spinner-border-sm text-primary"></div>
          Loading tournaments…
        </div>
      ) : tournaments.length === 0 ? (
        <div className="tournament-empty-state">
          <i className="bi bi-trophy"></i>
          <p>No tournaments found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="tournament-grid">
          {tournaments.map((t) => {
            const pctFull =
              t.maxParticipants > 0
                ? Math.min(100, (t.participantCount / t.maxParticipants) * 100)
                : 0;
            const canJoin =
              !t.hasJoined &&
              t.status !== "cancelled" &&
              t.status !== "completed" &&
              t.participantCount < t.maxParticipants;

            return (
              <div key={t._id} className="tournament-card">
                <div className="tournament-card-header">
                  <div style={{ flex: 1 }}>
                    <h3 className="tournament-card-title">
                      {t.name}
                      {t.isPrivate && (
                        <span className="badge-private">
                          <i className="bi bi-lock-fill"></i> Private
                        </span>
                      )}
                    </h3>
                    <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                      <span className="tournament-type-badge">{t.tournamentType}</span>
                      {t.hasJoined && t.userRank && (
                        <span className="user-rank-chip">
                          <i className="bi bi-person-check-fill"></i> Rank #{t.userRank}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`tournament-status-badge ${statusClass[t.status] || ""}`}>
                    {t.status}
                  </span>
                </div>

                <p className="tournament-card-desc">{t.description}</p>

                <div className="tournament-card-stats">
                  <div className="tournament-stat">
                    <label>Virtual Capital</label>
                    <span>₹{fmt(t.initialBalance)}</span>
                  </div>
                  <div className="tournament-stat">
                    <label>Max Players</label>
                    <span>{t.maxParticipants}</span>
                  </div>
                  <div className="tournament-stat">
                    <label>Start</label>
                    <span>{new Date(t.startDate).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="tournament-stat">
                    <label>End</label>
                    <span>{new Date(t.endDate).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>

                <div className="participant-progress">
                  <label>
                    Participants
                    <span>
                      {t.participantCount}/{t.maxParticipants}
                    </span>
                  </label>
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pctFull}%` }}
                    ></div>
                  </div>
                </div>

                <div className="tournament-card-actions">
                  {t.hasJoined ? (
                    <>
                      <span className="btn-joined-badge">
                        <i className="bi bi-check-circle-fill text-success"></i>
                        Joined
                      </span>
                      {t.status === "active" && (
                        <button
                          className="btn-view-tournament"
                          onClick={() => onViewPortfolio(t._id)}
                        >
                          <i className="bi bi-graph-up me-1"></i>My Portfolio
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="btn-join-tournament"
                      disabled={!canJoin || joiningId === t._id}
                      onClick={() => handleJoin(t)}
                    >
                      {joiningId === t._id
                        ? "Joining…"
                        : t.status === "completed"
                          ? "Completed"
                          : t.status === "cancelled"
                            ? "Cancelled"
                            : t.participantCount >= t.maxParticipants
                              ? "Full"
                              : "Join Tournament"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tournament join form modal */}
      {joinModalTournament && (
        <TournamentJoinModal
          tournament={joinModalTournament}
          loading={joiningId === joinModalTournament._id}
          initialError={joinModalError}
          onConfirm={(code) => doJoin(joinModalTournament._id, code)}
          onClose={() => {
            setJoinModalTournament(null);
            setJoinModalError("");
          }}
        />
      )}
    </div>
  );
}

// =========================================================================
// PORTFOLIO TAB
// =========================================================================

function TournamentPortfolioTab({ selectedTournamentId, onSelectTournament, onGoToLobby }) {
  const [participation, setParticipation] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(Boolean(selectedTournamentId));
  const [error, setError] = useState("");
  const [tradeModal, setTradeModal] = useState(null); // { action, symbol }
  const [successMsg, setSuccessMsg] = useState("");
  const [activeTournaments, setActiveTournaments] = useState([]);

  // Load active tournaments the user has joined
  useEffect(() => {
    listTournaments({ status: "active" })
      .then((data) => {
        const joined = (data.data || []).filter((t) => t.hasJoined);
        setActiveTournaments(joined);
        if (!selectedTournamentId && joined.length > 0) {
          onSelectTournament(joined[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const [tournament, setTournament] = useState(null);
  const [notJoined, setNotJoined] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!selectedTournamentId) return;
    setLoading(true);
    setError("");
    setNotJoined(false);
    try {
      // Backend returns: { success, data: { participation, tournament } }
      // and orders endpoint returns: { success, data: [...] }
      const [partData, ords] = await Promise.all([
        getMyParticipation(selectedTournamentId),
        getTournamentOrders(selectedTournamentId),
      ]);

      // Unwrap: partData = { participation: {...}, tournament: {...} }
      setParticipation(partData?.participation ?? partData ?? null);
      setTournament(partData?.tournament ?? null);
      setOrders(Array.isArray(ords) ? ords : []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        // User has not joined this tournament — show friendly message, no error banner
        setNotJoined(true);
        setParticipation(null);
        setOrders([]);
      } else if (status === 401) {
        // Genuine auth failure — propagate clearly without triggering global redirect
        setError("Session expired. Please refresh the page and log in again.");
      } else {
        setError(err?.response?.data?.message || "Failed to load portfolio. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Join tournament socket room for live leaderboard updates
  useEffect(() => {
    if (!selectedTournamentId) return;
    socket.emit("join-tournament-room", selectedTournamentId);
    const handleUpdate = (data) => {
      if (data?.tournamentId === selectedTournamentId) {
        fetchPortfolio();
      }
    };
    socket.on("tournament-leaderboard-update", handleUpdate);
    return () => {
      socket.off("tournament-leaderboard-update", handleUpdate);
      socket.emit("leave-tournament-room", selectedTournamentId);
    };
  }, [selectedTournamentId, fetchPortfolio]);

  const handleTrade = async (orderData) => {
    await placeTrade(selectedTournamentId, orderData);
    setTradeModal(null);
    setSuccessMsg("✅ Virtual order placed successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);
    await fetchPortfolio();
  };

  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalError, setCancelModalError] = useState("");

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return;
    setIsCancelling(true);
    setCancelModalError("");
    try {
      await cancelOrder(selectedTournamentId, orderToCancel._id);
      setOrderToCancel(null);
      setSuccessMsg("Order cancelled successfully. Reserved funds released.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await fetchPortfolio();
    } catch (err) {
      setCancelModalError(err?.response?.data?.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const virtualHoldings = Array.isArray(participation?.virtualHoldings)
    ? participation.virtualHoldings
    : [];
  const portfolioValue = Number(participation?.portfolioValue ?? 0);
  const initialBalance = Number(participation?.initialBalance ?? 100000);
  const availableCash = Number(participation?.availableCash ?? 0);
  const reservedCash = Number(participation?.reservedCash ?? 0);
  const totalPnL = participation ? portfolioValue - initialBalance : 0;
  const returnPercent = Number(participation?.returnPercent ?? 0);
  const rank = participation?.rank ?? 1;
  const tradeCount = Number(participation?.tradeCount ?? 0);

  return (
    <div>
      {/* Tournament selector */}
      {activeTournaments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <select
            className="tournament-filter-select"
            value={selectedTournamentId || ""}
            onChange={(e) => onSelectTournament(e.target.value)}
          >
            <option value="" disabled>Select tournament…</option>
            {activeTournaments.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {!selectedTournamentId ? (
        <div className="tournament-empty-state">
          <i className="bi bi-graph-up"></i>
          <p>Join an active tournament to see your portfolio here.</p>
        </div>
      ) : loading || (!participation && !error && !notJoined) ? (
        <div className="tournament-loading">
          <div className="spinner-border spinner-border-sm text-primary"></div>
          Loading portfolio…
        </div>
      ) : error ? (
        <div>
          <div className="tournament-error-banner">
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </div>
          <button
            className="btn-view-tournament"
            style={{ marginTop: 10, padding: "8px 16px" }}
            onClick={fetchPortfolio}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>Retry
          </button>
        </div>
      ) : notJoined ? (
        <div className="tournament-empty-state">
          <i className="bi bi-person-x" style={{ fontSize: 40 }}></i>
          <p style={{ marginTop: 10 }}>
            You have not joined this tournament yet.
          </p>
          <button
            className="btn-join-tournament"
            style={{ marginTop: 12, maxWidth: 220, display: "inline-block" }}
            onClick={() => {
              if (typeof onGoToLobby === "function") {
                onGoToLobby();
              } else if (typeof onSelectTournament === "function") {
                onSelectTournament(null);
              }
            }}
          >
            Go to Tournament Lobby
          </button>
        </div>
      ) : participation ? (
        <>
          {successMsg && (
            <div
              style={{
                background: "#e8f5e9",
                border: "1px solid #c8e6c9",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#2e7d32",
                fontSize: 13,
                marginBottom: 14,
              }}
            >
              {successMsg}
            </div>
          )}

          {tournament?.name && (
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>
                {tournament.name}
              </h3>
              <span style={{ fontSize: 12, color: "#666" }}>
                Initial balance: ₹{fmt(initialBalance)}
              </span>
            </div>
          )}

          {/* Stats row */}
          <div className="portfolio-header-stats">
            <div className="portfolio-stat-card">
              <div className="label">Portfolio Value</div>
              <div className="value">₹{fmt(portfolioValue)}</div>
            </div>
            <div className="portfolio-stat-card">
              <div className="label">Available Cash</div>
              <div className="value">₹{fmt(availableCash)}</div>
            </div>
            {reservedCash > 0 && (
              <div className="portfolio-stat-card">
                <div className="label">Reserved Cash</div>
                <div className="value">₹{fmt(reservedCash)}</div>
              </div>
            )}
            <div className="portfolio-stat-card">
              <div className="label">Total P&L</div>
              <div className={`value ${totalPnL >= 0 ? "positive" : "negative"}`}>
                {totalPnL >= 0 ? "+" : ""}₹{fmt(totalPnL)}
              </div>
            </div>
            <div className="portfolio-stat-card">
              <div className="label">Return %</div>
              <div
                className={`value ${returnPercent >= 0 ? "positive" : "negative"}`}
              >
                {fmtPct(returnPercent)}
              </div>
            </div>
            <div className="portfolio-stat-card">
              <div className="label">Rank</div>
              <div className="value" style={{ color: "#387ed1" }}>
                {rankMedal(rank)}
              </div>
            </div>
            <div className="portfolio-stat-card">
              <div className="label">Trades Executed</div>
              <div className="value">{tradeCount}</div>
            </div>
          </div>

          {/* Trade buttons for quick buy/sell */}
          <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn-trade-buy"
              style={{ padding: "8px 18px", fontSize: 13 }}
              onClick={() => setTradeModal({ action: "BUY", symbol: "RELIANCE" })}
            >
              <i className="bi bi-plus-circle-fill me-1"></i>New Buy Order
            </button>
            <button
              className="btn-view-tournament"
              style={{ padding: "8px 14px", fontSize: 13 }}
              onClick={fetchPortfolio}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
          </div>

          {/* Holdings Table */}
          <h3 className="portfolio-section-title">
            <i className="bi bi-briefcase me-2"></i>Virtual Holdings
          </h3>
          {virtualHoldings.length === 0 ? (
            <div className="tournament-empty-state" style={{ padding: "30px 16px" }}>
              <i className="bi bi-inbox" style={{ fontSize: 32 }}></i>
              <p style={{ marginTop: 8 }}>No holdings yet. Place a BUY order to start trading!</p>
            </div>
          ) : (
            <div className="tournament-table-wrapper">
              <table className="tournament-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Qty</th>
                    <th>Avg Price</th>
                    <th>Curr Price</th>
                    <th>Market Value</th>
                    <th>Unr. P&L</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {virtualHoldings.map((h) => (
                    <tr key={h.symbol}>
                      <td>
                        <strong>{h.symbol}</strong>
                      </td>
                      <td>{h.quantity}</td>
                      <td>₹{fmt(h.averagePrice)}</td>
                      <td>₹{fmt(h.currentPrice)}</td>
                      <td>₹{fmt(h.marketValue)}</td>
                      <td className={h.unrealizedPnL >= 0 ? "td-positive" : "td-negative"}>
                        {h.unrealizedPnL >= 0 ? "+" : ""}₹{fmt(h.unrealizedPnL)}
                      </td>
                      <td>
                        <button
                          className="btn-trade-buy"
                          onClick={() => setTradeModal({ action: "BUY", symbol: h.symbol })}
                        >
                          Buy
                        </button>
                        <button
                          className="btn-trade-sell"
                          onClick={() =>
                            setTradeModal({ action: "SELL", symbol: h.symbol, availableQty: h.quantity })
                          }
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders Table */}
          <h3 className="portfolio-section-title">
            <i className="bi bi-clock-history me-2"></i>Order History
          </h3>
          {orders.length === 0 ? (
            <div className="tournament-empty-state" style={{ padding: "24px 16px" }}>
              <i className="bi bi-journal-x" style={{ fontSize: 28 }}></i>
              <p style={{ marginTop: 8 }}>No orders placed yet.</p>
            </div>
          ) : (
            <div className="tournament-table-wrapper">
              <table className="tournament-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Action</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Realized P&L</th>
                    <th>Time</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td><strong>{o.symbol}</strong></td>
                      <td>
                        <span
                          style={{
                            color: o.action === "BUY" ? "#1a73e8" : "#d93025",
                            fontWeight: 700,
                          }}
                        >
                          {o.action}
                        </span>
                      </td>
                      <td>{o.orderType}</td>
                      <td>{o.quantity}</td>
                      <td>₹{fmt(o.executionPrice || o.price)}</td>
                      <td>
                        <span
                          className={`order-status-badge order-status-${o.status.toLowerCase()}`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>
                        {o.realizedPnL !== 0 ? (
                          <span className={o.realizedPnL >= 0 ? "td-positive" : "td-negative"}>
                            {o.realizedPnL >= 0 ? "+" : ""}₹{fmt(o.realizedPnL)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: "#999" }}>
                        {new Date(o.createdAt).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td>
                        {o.status === "PENDING" && (
                          <button
                            className="btn-view-tournament"
                            style={{ padding: "3px 10px", fontSize: 12 }}
                            onClick={() => {
                              setOrderToCancel(o);
                              setCancelModalError("");
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {/* Trade modal */}
      {tradeModal && (
        <TournamentTradeModal
          action={tradeModal.action}
          symbol={tradeModal.symbol}
          availableCash={participation?.availableCash}
          availableQty={tradeModal.availableQty}
          onClose={() => setTradeModal(null)}
          onPlace={handleTrade}
        />
      )}

      {/* In-app limit order cancel confirmation modal */}
      {orderToCancel && (
        <CancelOrderConfirmationModal
          order={orderToCancel}
          onConfirm={handleConfirmCancelOrder}
          onCancel={() => {
            if (!isCancelling) setOrderToCancel(null);
          }}
          isCancelling={isCancelling}
          error={cancelModalError}
        />
      )}
    </div>
  );
}

// =========================================================================
// LEADERBOARD TAB
// =========================================================================

function TournamentLeaderboardTab() {
  const [activeTournaments, setActiveTournaments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [initialLoading, setInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const inFlightRef = useRef(false);
  const currentPageRef = useRef(1);
  currentPageRef.current = pagination.page;

  useEffect(() => {
    listTournaments()
      .then((data) => {
        const joined = (data.data || []).filter(
          (t) => t.hasJoined && (t.status === "active" || t.status === "completed")
        );
        setActiveTournaments(joined);
        if (joined.length > 0) setSelectedId(joined[0]._id);
      })
      .catch(() => {});
  }, []);

  const fetchLeaderboard = useCallback(
    async (page = 1, isBackground = false) => {
      if (!selectedId) return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (!isBackground && leaderboard.length === 0) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError("");

      try {
        const data = await getTournamentLeaderboard(selectedId, page);
        setLeaderboard(data.leaderboard || []);
        setCurrentUser(data.currentUser || null);
        setPagination(data.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to fetch leaderboard");
      } finally {
        setInitialLoading(false);
        setIsRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [selectedId, leaderboard.length]
  );

  useEffect(() => {
    if (selectedId) {
      fetchLeaderboard(1, false);
    }
  }, [selectedId]);

  // Listen for live updates over socket without teardown loops
  useEffect(() => {
    if (!selectedId) return;

    socket.emit("join-tournament-room", selectedId);

    let debounceTimer = null;
    const handleUpdate = (data) => {
      if (data?.tournamentId === selectedId) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          fetchLeaderboard(currentPageRef.current, true);
        }, 800);
      }
    };

    socket.on("tournament-leaderboard-update", handleUpdate);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      socket.off("tournament-leaderboard-update", handleUpdate);
      socket.emit("leave-tournament-room", selectedId);
    };
  }, [selectedId, fetchLeaderboard]);

  return (
    <div>
      {activeTournaments.length > 0 && (
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <select
            className="tournament-filter-select"
            value={selectedId || ""}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setLeaderboard([]);
            }}
          >
            {activeTournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
          {isRefreshing && (
            <span style={{ fontSize: 12, color: "#64748b" }}>
              <span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }}></span>
              Updating live…
            </span>
          )}
        </div>
      )}

      {!selectedId ? (
        <div className="tournament-empty-state">
          <i className="bi bi-bar-chart-steps"></i>
          <p>Join an active or completed tournament to view the leaderboard.</p>
        </div>
      ) : initialLoading && leaderboard.length === 0 ? (
        <div className="tournament-loading">
          <div className="spinner-border spinner-border-sm text-primary"></div>
          Loading leaderboard…
        </div>
      ) : (
        <>
          {error && (
            <div className="tournament-error-banner mb-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
              </div>
              <button
                type="button"
                className="btn-retry"
                style={{
                  background: "transparent",
                  border: "1px solid #d93025",
                  color: "#d93025",
                  borderRadius: 4,
                  padding: "2px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                onClick={() => fetchLeaderboard(pagination.page, false)}
              >
                Retry
              </button>
            </div>
          )}

          {/* Current user's rank highlighted */}
          {currentUser && !currentUser.isCurrentUser && (
            <div
              style={{
                background: "#e8f0fe",
                border: "1px solid #c5d5f5",
                borderRadius: 8,
                padding: "10px 16px",
                marginBottom: 14,
                fontSize: 13,
                color: "#1565c0",
                fontWeight: 600,
              }}
            >
              <i className="bi bi-person-fill me-2"></i>
              Your rank: #{currentUser.rank} — Return: {fmtPct(currentUser.returnPercent)} — P&L:{" "}
              {currentUser.totalPnL >= 0 ? "+" : ""}₹{fmt(currentUser.totalPnL)}
            </div>
          )}

          <div className="tournament-table-wrapper">
            <table className="tournament-table leaderboard-table">
              <thead>
                <tr>
                  <th className="th-rank">Rank</th>
                  <th className="th-trader">Trader</th>
                  <th className="th-num">Portfolio Value</th>
                  <th className="th-num">Return %</th>
                  <th className="th-num">Total P&L</th>
                  <th className="th-num">Trades</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row) => (
                  <tr key={row._id} className={row.isCurrentUser ? "my-row" : ""}>
                    <td className="td-rank">
                      <span className={getRankBadgeClass(row.rank)}>{row.rank}</span>
                    </td>
                    <td className="td-trader">
                      <strong>{row.traderName}</strong>
                      {row.isCurrentUser && <span className="you-tag">You</span>}
                    </td>
                    <td className="td-num">₹{fmt(row.portfolioValue)}</td>
                    <td className={`td-num ${row.returnPercent >= 0 ? "td-positive" : "td-negative"}`}>
                      {fmtPct(row.returnPercent)}
                    </td>
                    <td className={`td-num ${row.totalPnL >= 0 ? "td-positive" : "td-negative"}`}>
                      {row.totalPnL >= 0 ? "+" : ""}₹{fmt(row.totalPnL)}
                    </td>
                    <td className="td-num">{row.tradeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="leaderboard-pagination">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeaderboard(pagination.page - 1, false)}
              >
                ← Prev
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount}{" "}
                participants)
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLeaderboard(pagination.page + 1, false)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =========================================================================
// HISTORY TAB
// =========================================================================

function TournamentHistoryTab() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyTournamentHistory()
      .then(setHistory)
      .catch((err) => setError(err?.response?.data?.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="tournament-loading">
        <div className="spinner-border spinner-border-sm text-primary"></div>
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="tournament-error-banner">
        <i className="bi bi-exclamation-triangle-fill"></i> {error}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="tournament-empty-state">
        <i className="bi bi-clock-history"></i>
        <p>No tournament history yet. Join and complete a tournament to see your record here.</p>
      </div>
    );
  }

  return (
    <div className="history-grid">
      {history.map((h) => {
        const pnlPositive = h.totalPnL >= 0;
        return (
          <div key={h.participationId} className="history-card">
            <div>
              <h4 className="history-card-title">{h.name}</h4>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span className="tournament-type-badge">{h.tournamentType}</span>
                <span className={`tournament-status-badge ${statusClass[h.status] || ""}`}>
                  {h.status}
                </span>
              </div>
            </div>

            <div>
              <div className="history-final-rank">
                {rankMedal(h.finalRank)}
                <span> / {h.totalParticipants} traders</span>
              </div>
            </div>

            <div className="history-stats">
              <div className="history-stat">
                <label>Starting Capital</label>
                <span>₹{fmt(h.initialBalance)}</span>
              </div>
              <div className="history-stat">
                <label>Final Value</label>
                <span>₹{fmt(h.portfolioValue)}</span>
              </div>
              <div className="history-stat">
                <label>Total P&L</label>
                <span style={{ color: pnlPositive ? "#2e7d32" : "#d93025" }}>
                  {pnlPositive ? "+" : ""}₹{fmt(h.totalPnL)}
                </span>
              </div>
              <div className="history-stat">
                <label>Return</label>
                <span style={{ color: pnlPositive ? "#2e7d32" : "#d93025" }}>
                  {fmtPct(h.returnPercent)}
                </span>
              </div>
              <div className="history-stat">
                <label>Trades</label>
                <span>{h.tradeCount}</span>
              </div>
              <div className="history-stat">
                <label>Period</label>
                <span>
                  {new Date(h.startDate).toLocaleDateString("en-IN")} –{" "}
                  {new Date(h.endDate).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================================================================
// MAIN PAGE
// =========================================================================

const TABS = [
  { id: "lobby", label: "Tournament Lobby", icon: "bi bi-trophy" },
  { id: "portfolio", label: "My Portfolio", icon: "bi bi-graph-up" },
  { id: "leaderboard", label: "Leaderboard", icon: "bi bi-bar-chart-steps" },
  { id: "history", label: "My History", icon: "bi bi-clock-history" },
];

class TournamentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tournament tab render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tournament-empty-state" style={{ padding: "40px 20px" }}>
          <i className="bi bi-exclamation-octagon" style={{ fontSize: 44, color: "#d93025" }}></i>
          <h4 style={{ marginTop: 14 }}>Unable to display this tournament tab</h4>
          <p style={{ color: "#666", fontSize: 13, maxWidth: 450, margin: "8px auto 16px" }}>
            {this.state.error?.message || "An unexpected error occurred while loading this view."}
          </p>
          <button
            className="btn-join-tournament"
            style={{ maxWidth: 160 }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function PaperTrading() {
  const [activeTab, setActiveTab] = useState("lobby");
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);

  const switchToPortfolio = (tournamentId) => {
    setSelectedTournamentId(tournamentId);
    setActiveTab("portfolio");
  };

  return (
    <div className="tournament-page">
      {/* Header */}
      <div className="tournament-header">
        <div className="tournament-header-left">
          <h2>
            <i className="bi bi-trophy-fill me-2" style={{ color: "#f0a500" }}></i>
            Paper Trading Tournaments
          </h2>
          <p>Risk-free paper trading tournaments with live market data and real-time leaderboards</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tournament-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tournament-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="tournament-tab-content">
        <TournamentErrorBoundary key={activeTab}>
          {activeTab === "lobby" && (
            <TournamentLobbyTab onViewPortfolio={switchToPortfolio} />
          )}
          {activeTab === "portfolio" && (
            <TournamentPortfolioTab
              selectedTournamentId={selectedTournamentId}
              onSelectTournament={setSelectedTournamentId}
              onGoToLobby={() => setActiveTab("lobby")}
            />
          )}
          {activeTab === "leaderboard" && <TournamentLeaderboardTab />}
          {activeTab === "history" && <TournamentHistoryTab />}
        </TournamentErrorBoundary>
      </div>
    </div>
  );
}
