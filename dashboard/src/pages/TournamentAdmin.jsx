import React, { useState, useEffect, useContext, useCallback } from "react";
import { AppContext } from "../context/AppContext";
import "../styles/TournamentAdmin.css";
import "../styles/Tournament.css";
import {
  adminListTournaments,
  adminGetTournamentDetails,
  adminCreateTournament,
  adminUpdateTournament,
  adminUpdateTournamentStatus,
  adminGetTournamentParticipants,
  adminGetTournamentOrders,
  adminDisqualifyParticipant,
  adminSeedTournaments,
} from "../services/adminTournamentService.js";

const fmt = (n) =>
  typeof n === "number" ? n.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—";

const fmtPct = (n) =>
  typeof n === "number" ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "—";

const getRankBadgeClass = (rank) => {
  if (rank === 1) return "rank-badge rank-1";
  if (rank === 2) return "rank-badge rank-2";
  if (rank === 3) return "rank-badge rank-3";
  return "rank-badge rank-default";
};

export default function TournamentAdmin() {
  const { currentUser, userLoading } = useContext(AppContext);

  // Tournament list & filters
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalCount: 0, totalPages: 1 });

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalTournament, setEditModalTournament] = useState(null);
  const [detailModalId, setDetailModalId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type, tournament, onConfirm, title, message }

  const fetchTournaments = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const data = await adminListTournaments({
        page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        type: typeFilter,
      });
      setTournaments(data.data || []);
      setStats(data.stats || null);
      setPagination(data.pagination || { page: 1, limit: 15, totalCount: 0, totalPages: 1 });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch tournaments");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, pagination.limit]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchTournaments(1);
    }
  }, [currentUser, fetchTournaments]);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Auth Guard
  if (userLoading) {
    return (
      <div className="admin-tournaments-page">
        <div className="tournament-loading">
          <div className="spinner-border spinner-border-sm text-primary"></div>
          Checking administrator authorization…
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="admin-tournaments-page">
        <div className="tournament-empty-state" style={{ padding: "60px 20px" }}>
          <i className="bi bi-shield-x text-danger" style={{ fontSize: 48 }}></i>
          <h3 style={{ marginTop: 14 }}>Access Restricted: Admin Only</h3>
          <p style={{ color: "#666", maxWidth: 480, margin: "8px auto 20px", fontSize: 13.5 }}>
            This section is reserved for platform administrators. Your account does not have
            the required administrative privileges.
          </p>
          <div style={{ fontSize: 12.5, color: "#888", background: "#f8fafc", padding: "10px 16px", borderRadius: 6, display: "inline-block" }}>
            To assign an admin role in local development, run:{" "}
            <code>node backend/scripts/setAdminRole.js &lt;mobile_or_email&gt;</code>
          </div>
        </div>
      </div>
    );
  }

  // Handle status update
  const handleStatusChange = (tournament, newStatus) => {
    let actionLabel = "change the status of";
    if (newStatus === "active") actionLabel = "start";
    if (newStatus === "completed") actionLabel = "end";
    if (newStatus === "cancelled") actionLabel = "cancel";

    setConfirmAction({
      title: `${newStatus === "active" ? "Start" : newStatus === "completed" ? "End" : "Cancel"} Tournament`,
      message: `Are you sure you want to ${actionLabel} "${tournament.name}"? ${
        newStatus === "cancelled"
          ? "All pending limit orders will be cancelled and reserved funds will be returned to participants."
          : newStatus === "completed"
          ? "The tournament will end immediately and final rankings will be locked."
          : "The tournament will start immediately and participants will be allowed to trade."
      }`,
      onConfirm: async () => {
        try {
          await adminUpdateTournamentStatus(tournament._id, newStatus);
          showToast(`Tournament status updated to ${newStatus}.`);
          fetchTournaments(pagination.page);
        } catch (err) {
          setError(err?.response?.data?.message || "Failed to update tournament status");
        }
      },
    });
  };

  // Handle demo seed
  const handleSeed = () => {
    setConfirmAction({
      title: "Seed Demo Tournaments",
      message:
        "This will generate demonstration tournaments with sample configurations. Existing demo tournaments with matching names will be safely updated.",
      onConfirm: async () => {
        try {
          const res = await adminSeedTournaments();
          showToast(res.message || "Demonstration tournaments seeded successfully.");
          fetchTournaments(1);
        } catch (err) {
          setError(err?.response?.data?.message || "Failed to seed demo tournaments");
        }
      },
    });
  };

  return (
    <div className="admin-tournaments-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-title">
          <h2>
            <i className="bi bi-shield-check text-primary"></i>
            Tournament Management Panel
          </h2>
          <p>Create, configure, monitor, and manage paper trading tournaments across all lifecycle states.</p>
        </div>
        <div className="admin-header-actions">
          <button className="btn-admin-secondary" onClick={handleSeed}>
            <i className="bi bi-database-add"></i>
            Seed Demo Tournaments
          </button>
          <button className="btn-admin-primary" onClick={() => setCreateModalOpen(true)}>
            <i className="bi bi-plus-lg"></i>
            Create Tournament
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="tournament-success-banner mb-3" style={{ padding: "10px 16px" }}>
          <i className="bi bi-check-circle-fill me-2"></i> {successMsg}
        </div>
      )}
      {error && (
        <div className="tournament-error-banner mb-3" style={{ padding: "10px 16px" }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="label">Total Tournaments</div>
            <div className="value">{stats.total}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Active Now</div>
            <div className="value text-success">{stats.active}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Upcoming</div>
            <div className="value text-primary">{stats.upcoming}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Completed</div>
            <div className="value text-secondary">{stats.completed}</div>
          </div>
          <div className="admin-stat-card">
            <div className="label">Total Participants</div>
            <div className="value">{stats.totalParticipants}</div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="admin-filters-bar">
        <div className="admin-search-input">
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search tournaments by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="admin-select"
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
          className="btn-table-action"
          style={{ height: 38, padding: "0 14px" }}
          onClick={() => fetchTournaments(1)}
        >
          <i className="bi bi-arrow-repeat me-1"></i> Refresh
        </button>
      </div>

      {/* Tournaments Table */}
      {loading ? (
        <div className="tournament-loading">
          <div className="spinner-border spinner-border-sm text-primary"></div>
          Loading tournaments…
        </div>
      ) : tournaments.length === 0 ? (
        <div className="tournament-empty-state">
          <i className="bi bi-trophy"></i>
          <p>No tournaments found matching the selected filters.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tournament</th>
                <th>Type</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Initial Cash</th>
                <th>Participants</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => (
                <tr key={t._id}>
                  <td>
                    <strong>{t.name}</strong>
                    <div style={{ fontSize: 11, color: "#888" }}>ID: {t._id}</div>
                  </td>
                  <td>
                    <span className="type-badge">{t.tournamentType}</span>
                  </td>
                  <td>
                    <span className={`order-status-badge order-status-${t.status.toLowerCase()}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <div>
                      <span className="text-muted">Start:</span>{" "}
                      {new Date(t.startDate).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                    <div>
                      <span className="text-muted">End:</span>{" "}
                      {new Date(t.endDate).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </td>
                  <td>₹{fmt(t.initialBalance)}</td>
                  <td>
                    <strong>{t.participantCount || 0}</strong> / {t.maxParticipants}
                  </td>
                  <td>
                    {t.isPrivate ? (
                      <span className="private-badge">
                        <i className="bi bi-lock-fill"></i> Private ({t.inviteCode || "No Code"})
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "#64748b" }}>Public</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-actions-cell">
                      <button
                        className="btn-table-action"
                        onClick={() => setDetailModalId(t._id)}
                      >
                        <i className="bi bi-eye"></i> Details
                      </button>
                      <button
                        className="btn-table-action"
                        onClick={() => setEditModalTournament(t)}
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </button>
                      {t.status === "upcoming" && (
                        <button
                          className="btn-table-action btn-start"
                          onClick={() => handleStatusChange(t, "active")}
                        >
                          <i className="bi bi-play-fill"></i> Start
                        </button>
                      )}
                      {t.status === "active" && (
                        <button
                          className="btn-table-action btn-end"
                          onClick={() => handleStatusChange(t, "completed")}
                        >
                          <i className="bi bi-flag-fill"></i> End
                        </button>
                      )}
                      {(t.status === "upcoming" || t.status === "active") && (
                        <button
                          className="btn-table-action btn-cancel"
                          onClick={() => handleStatusChange(t, "cancelled")}
                        >
                          <i className="bi bi-x-circle"></i> Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="leaderboard-pagination">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchTournaments(pagination.page - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} tournaments)
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchTournaments(pagination.page + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Create Tournament Modal */}
      {createModalOpen && (
        <TournamentFormModal
          mode="create"
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            setCreateModalOpen(false);
            showToast("Tournament created successfully.");
            fetchTournaments(1);
          }}
        />
      )}

      {/* Edit Tournament Modal */}
      {editModalTournament && (
        <TournamentFormModal
          mode="edit"
          tournament={editModalTournament}
          onClose={() => setEditModalTournament(null)}
          onSuccess={() => {
            setEditModalTournament(null);
            showToast("Tournament updated successfully.");
            fetchTournaments(pagination.page);
          }}
        />
      )}

      {/* Detail / Participants Modal */}
      {detailModalId && (
        <TournamentDetailModal
          tournamentId={detailModalId}
          onClose={() => setDetailModalId(null)}
          onRefresh={() => fetchTournaments(pagination.page)}
        />
      )}

      {/* In-app Confirmation Modal */}
      {confirmAction && (
        <div className="admin-modal-overlay" onClick={() => setConfirmAction(null)}>
          <div className="admin-modal" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4>{confirmAction.title}</h4>
              <button
                className="tourn-modal-close"
                onClick={() => setConfirmAction(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.5 }}>
                {confirmAction.message}
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                className="btn-cancel-keep"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn-cancel-confirm"
                onClick={async () => {
                  const fn = confirmAction.onConfirm;
                  setConfirmAction(null);
                  if (fn) await fn();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// CREATE / EDIT TOURNAMENT FORM MODAL
// =========================================================================

function TournamentFormModal({ mode = "create", tournament = null, onClose, onSuccess }) {
  const [name, setName] = useState(tournament?.name || "");
  const [description, setDescription] = useState(tournament?.description || "");
  const [tournamentType, setTournamentType] = useState(tournament?.tournamentType || "daily");
  const [tournamentMode, setTournamentMode] = useState(tournament?.mode || "standard");
  const [startDate, setStartDate] = useState(
    tournament?.startDate
      ? new Date(tournament.startDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    tournament?.endDate
      ? new Date(tournament.endDate).toISOString().slice(0, 16)
      : new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [initialBalance, setInitialBalance] = useState(tournament?.initialBalance || 100000);
  const [maxParticipants, setMaxParticipants] = useState(tournament?.maxParticipants || 100);
  const [isPrivate, setIsPrivate] = useState(tournament?.isPrivate || false);
  const [inviteCode, setInviteCode] = useState(tournament?.inviteCode || "");
  const [allowLateJoin, setAllowLateJoin] = useState(tournament?.entryRules?.allowLateJoin ?? true);
  const [minTrades, setMinTrades] = useState(tournament?.entryRules?.minTrades || 0);

  // Custom mode parameters
  const [allowedSymbols, setAllowedSymbols] = useState(
    (tournament?.tradingRules?.allowedSymbols || tournament?.entryRules?.allowedSymbols || []).join(", ")
  );
  const [allowMarket, setAllowMarket] = useState(
    tournament?.tradingRules?.allowedOrderTypes ? tournament.tradingRules.allowedOrderTypes.includes("Market") : true
  );
  const [allowLimit, setAllowLimit] = useState(
    tournament?.tradingRules?.allowedOrderTypes ? tournament.tradingRules.allowedOrderTypes.includes("Limit") : true
  );
  const [allowBuy, setAllowBuy] = useState(
    tournament?.tradingRules?.allowedActions ? tournament.tradingRules.allowedActions.includes("BUY") : true
  );
  const [allowSell, setAllowSell] = useState(
    tournament?.tradingRules?.allowedActions ? tournament.tradingRules.allowedActions.includes("SELL") : true
  );
  const [maxOrderQty, setMaxOrderQty] = useState(tournament?.tradingRules?.maxOrderQty || "");
  const [maxOrders, setMaxOrders] = useState(tournament?.tradingRules?.maxOrders || "");
  const [maxOpenPositions, setMaxOpenPositions] = useState(tournament?.tradingRules?.maxOpenPositions || "");
  const [perStockQtyLimit, setPerStockQtyLimit] = useState(tournament?.tradingRules?.perStockQtyLimit || "");
  const [rankingMetric, setRankingMetric] = useState(tournament?.tradingRules?.rankingMetric || "returnPercent");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Tournament name is required.";
    if (!description.trim()) errs.description = "Description is required.";

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime())) errs.startDate = "Valid start date is required.";
    if (isNaN(end.getTime())) errs.endDate = "Valid end date is required.";
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
      errs.endDate = "End date must be after start date.";
    }

    if (mode === "create") {
      const numInit = Number(initialBalance);
      if (isNaN(numInit) || numInit < 10000) {
        errs.initialBalance = "Initial virtual balance must be at least ₹10,000.";
      }
    }

    const numMax = Number(maxParticipants);
    if (isNaN(numMax) || numMax < 2) {
      errs.maxParticipants = "Max participants must be at least 2.";
    }

    if (isPrivate && !inviteCode.trim()) {
      errs.inviteCode = "Invite code is required for private tournaments.";
    }

    if (tournamentMode === "custom") {
      if (!allowMarket && !allowLimit) {
        errs.orderTypes = "At least one order type (Market or Limit) must be allowed.";
      }
      if (!allowBuy && !allowSell) {
        errs.actions = "At least one action (BUY or SELL) must be allowed.";
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const parsedSymbols = allowedSymbols
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const orderTypes = [];
      if (allowMarket) orderTypes.push("Market");
      if (allowLimit) orderTypes.push("Limit");

      const actions = [];
      if (allowBuy) actions.push("BUY");
      if (allowSell) actions.push("SELL");

      const payload = {
        name: name.trim(),
        description: description.trim(),
        tournamentType,
        mode: tournamentMode,
        maxParticipants: Number(maxParticipants),
        isPrivate: Boolean(isPrivate),
        inviteCode: isPrivate ? inviteCode.trim().toUpperCase() : null,
        endDate: end,
        entryRules: {
          allowLateJoin: Boolean(allowLateJoin),
          allowedSymbols: parsedSymbols,
          minTrades: Number(minTrades) || 0,
        },
        tradingRules: {
          allowedSymbols: parsedSymbols,
          allowedOrderTypes: orderTypes.length ? orderTypes : ["Market", "Limit"],
          allowedActions: actions.length ? actions : ["BUY", "SELL"],
          maxOrderQty: Number(maxOrderQty) || 0,
          maxOrders: Number(maxOrders) || 0,
          maxOpenPositions: Number(maxOpenPositions) || 0,
          perStockQtyLimit: Number(perStockQtyLimit) || 0,
          rankingMetric,
        },
      };

      if (mode === "create") {
        payload.startDate = start;
        payload.initialBalance = Number(initialBalance);
        await adminCreateTournament(payload);
      } else {
        if (tournament?.status === "upcoming") {
          payload.startDate = start;
        }
        await adminUpdateTournament(tournament._id, payload);
      }

      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || `Failed to ${mode} tournament`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h4>{mode === "create" ? "Create New Tournament" : "Edit Tournament"}</h4>
          <button className="tourn-modal-close" onClick={onClose} disabled={submitting}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }} noValidate>
          <div className="admin-modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            {error && (
              <div className="tournament-error-banner mb-3" style={{ padding: "8px 12px" }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
              </div>
            )}

            {/* Mode Selector */}
            <div className="admin-form-group mb-3">
              <label style={{ fontWeight: 600, display: "block", marginBottom: 6 }}>Tournament Mode</label>
              <div style={{ display: "flex", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: tournamentMode === "standard" ? "#e3f2fd" : "#f8fafc", padding: "8px 14px", borderRadius: 6, border: "1px solid #cbd5e1" }}>
                  <input
                    type="radio"
                    name="tournamentMode"
                    value="standard"
                    checked={tournamentMode === "standard"}
                    onChange={() => setTournamentMode("standard")}
                  />
                  <span><strong>Standard</strong> (Sensible defaults, unrestricted trading)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: tournamentMode === "custom" ? "#e3f2fd" : "#f8fafc", padding: "8px 14px", borderRadius: 6, border: "1px solid #cbd5e1" }}>
                  <input
                    type="radio"
                    name="tournamentMode"
                    value="custom"
                    checked={tournamentMode === "custom"}
                    onChange={() => setTournamentMode("custom")}
                  />
                  <span><strong>Custom</strong> (Fine-grained rules & limits)</span>
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Tournament Name *</label>
              <input
                type="text"
                className={`admin-form-input ${fieldErrors.name ? "is-invalid" : ""}`}
                placeholder="e.g. Nifty 50 Pro Championship"
                value={name}
                maxLength={100}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                }}
              />
              {fieldErrors.name && (
                <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.name}</span>
              )}
            </div>

            <div className="admin-form-group">
              <label>Description *</label>
              <textarea
                className={`admin-form-textarea ${fieldErrors.description ? "is-invalid" : ""}`}
                rows={2}
                placeholder="Describe rules, objectives, and schedule…"
                value={description}
                maxLength={1000}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: null });
                }}
              />
              {fieldErrors.description && (
                <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.description}</span>
              )}
            </div>

            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label>Tournament Type</label>
                <select
                  className="admin-form-select"
                  value={tournamentType}
                  onChange={(e) => setTournamentType(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Max Participants *</label>
                <input
                  type="number"
                  className={`admin-form-input ${fieldErrors.maxParticipants ? "is-invalid" : ""}`}
                  min={2}
                  value={maxParticipants}
                  onChange={(e) => {
                    setMaxParticipants(e.target.value);
                    if (fieldErrors.maxParticipants) setFieldErrors({ ...fieldErrors, maxParticipants: null });
                  }}
                />
                {fieldErrors.maxParticipants && (
                  <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.maxParticipants}</span>
                )}
              </div>
            </div>

            {/* Schedule Section */}
            <div className="admin-form-grid-2">
              <div className="admin-form-group">
                <label>Start Date & Time (IST) *</label>
                <input
                  type="datetime-local"
                  className={`admin-form-input ${fieldErrors.startDate ? "is-invalid" : ""}`}
                  value={startDate}
                  disabled={mode === "edit" && tournament?.status !== "upcoming"}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (fieldErrors.startDate) setFieldErrors({ ...fieldErrors, startDate: null });
                  }}
                />
                {fieldErrors.startDate && (
                  <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.startDate}</span>
                )}
              </div>

              <div className="admin-form-group">
                <label>End Date & Time (IST) *</label>
                <input
                  type="datetime-local"
                  className={`admin-form-input ${fieldErrors.endDate ? "is-invalid" : ""}`}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (fieldErrors.endDate) setFieldErrors({ ...fieldErrors, endDate: null });
                  }}
                />
                {fieldErrors.endDate && (
                  <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.endDate}</span>
                )}
              </div>
            </div>

            {mode === "create" && (
              <div className="admin-form-group">
                <label>Initial Virtual Capital (₹) *</label>
                <input
                  type="number"
                  className={`admin-form-input ${fieldErrors.initialBalance ? "is-invalid" : ""}`}
                  min={10000}
                  step={10000}
                  value={initialBalance}
                  onChange={(e) => {
                    setInitialBalance(e.target.value);
                    if (fieldErrors.initialBalance) setFieldErrors({ ...fieldErrors, initialBalance: null });
                  }}
                />
                <small style={{ color: "#888", fontSize: 11 }}>
                  Standard default is ₹1,00,000 virtual cash per participant.
                </small>
                {fieldErrors.initialBalance && (
                  <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.initialBalance}</span>
                )}
              </div>
            )}

            <div className="admin-form-group" style={{ marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private Tournament (Requires Invite Code)
              </label>
            </div>

            {isPrivate && (
              <div className="admin-form-group">
                <label>Invite Code *</label>
                <input
                  type="text"
                  className={`admin-form-input ${fieldErrors.inviteCode ? "is-invalid" : ""}`}
                  placeholder="e.g. ALPHA2026"
                  value={inviteCode}
                  maxLength={20}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    if (fieldErrors.inviteCode) setFieldErrors({ ...fieldErrors, inviteCode: null });
                  }}
                />
                {fieldErrors.inviteCode && (
                  <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.inviteCode}</span>
                )}
              </div>
            )}

            <div className="admin-form-grid-2" style={{ marginTop: 8 }}>
              <div className="admin-form-group">
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={allowLateJoin}
                    onChange={(e) => setAllowLateJoin(e.target.checked)}
                  />
                  Allow Late Joining
                </label>
              </div>

              <div className="admin-form-group">
                <label>Min Trades Required</label>
                <input
                  type="number"
                  className="admin-form-input"
                  min={0}
                  value={minTrades}
                  onChange={(e) => setMinTrades(e.target.value)}
                />
              </div>
            </div>

            {/* Custom Mode Configuration Panel */}
            {tournamentMode === "custom" && (
              <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <h6 style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: "#1e293b" }}>
                  <i className="bi bi-sliders me-1 text-primary"></i> Custom Trading Rules & Risk Limits
                </h6>

                <div className="admin-form-group mb-2">
                  <label>Allowed Stocks (Comma-separated symbols, leave empty for all):</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g. RELIANCE, TCS, INFY, HDFCBANK"
                    value={allowedSymbols}
                    onChange={(e) => setAllowedSymbols(e.target.value)}
                  />
                  <small style={{ color: "#64748b", fontSize: 11 }}>Leave empty to allow all supported TrueData instruments.</small>
                </div>

                <div className="admin-form-grid-2 mb-2">
                  <div className="admin-form-group">
                    <label style={{ fontWeight: 600, fontSize: 12 }}>Permitted Order Types:</label>
                    <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={allowMarket}
                          onChange={(e) => setAllowMarket(e.target.checked)}
                        />
                        Market Orders
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={allowLimit}
                          onChange={(e) => setAllowLimit(e.target.checked)}
                        />
                        Limit Orders
                      </label>
                    </div>
                    {fieldErrors.orderTypes && (
                      <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.orderTypes}</span>
                    )}
                  </div>

                  <div className="admin-form-group">
                    <label style={{ fontWeight: 600, fontSize: 12 }}>Permitted Actions:</label>
                    <div style={{ display: "flex", gap: 14, marginTop: 4 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={allowBuy}
                          onChange={(e) => setAllowBuy(e.target.checked)}
                        />
                        BUY
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={allowSell}
                          onChange={(e) => setAllowSell(e.target.checked)}
                        />
                        SELL
                      </label>
                    </div>
                    {fieldErrors.actions && (
                      <span style={{ color: "#d32f2f", fontSize: 11, marginTop: 3, display: "block" }}>{fieldErrors.actions}</span>
                    )}
                  </div>
                </div>

                <div className="admin-form-grid-2 mb-2">
                  <div className="admin-form-group">
                    <label>Max Order Qty (0 = unlimited):</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min={0}
                      placeholder="Unlimited"
                      value={maxOrderQty}
                      onChange={(e) => setMaxOrderQty(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Max Orders per Trader (0 = unlimited):</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min={0}
                      placeholder="Unlimited"
                      value={maxOrders}
                      onChange={(e) => setMaxOrders(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-grid-2 mb-2">
                  <div className="admin-form-group">
                    <label>Max Open Positions (0 = unlimited):</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min={0}
                      placeholder="Unlimited"
                      value={maxOpenPositions}
                      onChange={(e) => setMaxOpenPositions(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Per-Stock Qty Limit (0 = unlimited):</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      min={0}
                      placeholder="Unlimited"
                      value={perStockQtyLimit}
                      onChange={(e) => setPerStockQtyLimit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Ranking Metric:</label>
                  <select
                    className="admin-form-select"
                    value={rankingMetric}
                    onChange={(e) => setRankingMetric(e.target.value)}
                  >
                    <option value="returnPercent">Highest Return Percentage (%) [Default]</option>
                    <option value="portfolioValue">Total Virtual Portfolio Value (₹)</option>
                    <option value="realizedPnL">Highest Realized P&L (₹)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="admin-modal-footer">
            <button
              type="button"
              className="btn-admin-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-admin-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Saving…
                </>
              ) : mode === "create" ? (
                "Create Tournament"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// TOURNAMENT DETAIL & AUDIT MODAL (Participants & Orders)
// =========================================================================

function TournamentDetailModal({ tournamentId, onClose, onRefresh }) {
  const [tournament, setTournament] = useState(null);
  const [tab, setTab] = useState("participants"); // 'participants' | 'orders'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const [participants, setParticipants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingSub, setLoadingSub] = useState(false);

  // Disqualification state
  const [disqualifyTarget, setDisqualifyTarget] = useState(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [disqualifying, setDisqualifying] = useState(false);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminGetTournamentDetails(tournamentId);
      setTournament(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch tournament details");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  const fetchSubData = useCallback(async () => {
    setLoadingSub(true);
    try {
      if (tab === "participants") {
        const res = await adminGetTournamentParticipants(tournamentId, { limit: 50 });
        setParticipants(res.data || []);
      } else {
        const res = await adminGetTournamentOrders(tournamentId, { limit: 50 });
        setOrders(res.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load tab data");
    } finally {
      setLoadingSub(false);
    }
  }, [tournamentId, tab]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    fetchSubData();
  }, [fetchSubData]);

  const handleDisqualify = async () => {
    if (!disqualifyTarget) return;
    setDisqualifying(true);
    try {
      await adminDisqualifyParticipant(
        tournamentId,
        disqualifyTarget._id,
        disqualifyReason || "Administrative disqualification"
      );
      setActionSuccess(`Participant ${disqualifyTarget.userId?.name || ""} disqualified.`);
      setDisqualifyTarget(null);
      setDisqualifyReason("");
      await fetchDetails();
      await fetchSubData();
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to disqualify participant");
    } finally {
      setDisqualifying(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h4>
            <i className="bi bi-info-circle text-primary me-2"></i>
            {tournament?.name || "Tournament Details"}
          </h4>
          <button className="tourn-modal-close" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="admin-modal-body">
          {error && (
            <div className="tournament-error-banner mb-3" style={{ padding: "8px 12px" }}>
              <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
            </div>
          )}
          {actionSuccess && (
            <div className="tournament-success-banner mb-3" style={{ padding: "8px 12px" }}>
              <i className="bi bi-check-circle-fill me-2"></i> {actionSuccess}
            </div>
          )}

          {loading ? (
            <div className="tournament-loading">
              <div className="spinner-border spinner-border-sm text-primary"></div>
              Loading details…
            </div>
          ) : tournament ? (
            <>
              {/* Meta summary card */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "14px 18px",
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  <div>
                    <span className="text-muted">Status:</span>{" "}
                    <span className={`order-status-badge order-status-${tournament.status.toLowerCase()}`}>
                      {tournament.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Type:</span> <strong>{tournament.tournamentType}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Initial Cash:</span> ₹{fmt(tournament.initialBalance)}
                  </div>
                  <div>
                    <span className="text-muted">Active Participants:</span>{" "}
                    <strong>{tournament.activeParticipantsCount || 0}</strong> / {tournament.maxParticipants}
                  </div>
                  <div>
                    <span className="text-muted">Total Orders Placed:</span> <strong>{tournament.totalOrdersCount || 0}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Visibility:</span>{" "}
                    {tournament.isPrivate ? `Private (${tournament.inviteCode})` : "Public"}
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="admin-detail-tabs">
                <button
                  className={`admin-detail-tab-btn ${tab === "participants" ? "active" : ""}`}
                  onClick={() => setTab("participants")}
                >
                  <i className="bi bi-people me-1"></i> Participants ({participants.length})
                </button>
                <button
                  className={`admin-detail-tab-btn ${tab === "orders" ? "active" : ""}`}
                  onClick={() => setTab("orders")}
                >
                  <i className="bi bi-receipt me-1"></i> Orders Audit ({orders.length})
                </button>
              </div>

              {/* Tab Content */}
              {loadingSub ? (
                <div className="tournament-loading">
                  <div className="spinner-border spinner-border-sm text-primary"></div>
                  Loading…
                </div>
              ) : tab === "participants" ? (
                participants.length === 0 ? (
                  <p style={{ color: "#888", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                    No registered participants yet.
                  </p>
                ) : (
                  <div className="admin-table-wrapper" style={{ maxHeight: 350, overflowY: "auto" }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Trader Details</th>
                          <th>Joined</th>
                          <th>Status</th>
                          <th>Portfolio Value</th>
                          <th>Return %</th>
                          <th>Total P&L</th>
                          <th>Available Cash</th>
                          <th>Trades</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.map((p) => {
                          const pnl = (p?.portfolioValue ?? 0) - (p?.initialBalance ?? 0);
                          const isDisqualified = p?.status === "disqualified";
                          return (
                            <tr key={p?._id || Math.random()}>
                              <td>
                                <span className={getRankBadgeClass(p?.rank)}>{p?.rank ?? "—"}</span>
                              </td>
                              <td>
                                <strong>{p?.userId?.name || "Participant"}</strong>
                                <div style={{ fontSize: 11, color: "#666" }}>
                                  {p?.userId?.email || ""}
                                </div>
                                <div style={{ fontSize: 11, color: "#888" }}>
                                  {p?.userId?.mobile ? `Mob: ${p.userId.mobile}` : ""}
                                  {p?.userId?.clientId ? ` • Client: ${p.userId.clientId}` : ""}
                                </div>
                              </td>
                              <td style={{ fontSize: 11, color: "#666" }}>
                                {p?.createdAt
                                  ? new Date(p.createdAt).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "—"}
                              </td>
                              <td>
                                <span
                                  className={`order-status-badge order-status-${
                                    p?.status === "active" ? "executed" : "cancelled"
                                  }`}
                                >
                                  {p?.status || "active"}
                                </span>
                                {isDisqualified && p?.disqualificationReason && (
                                  <div style={{ fontSize: 10, color: "#dc3545", marginTop: 3 }}>
                                    Reason: {p.disqualificationReason}
                                  </div>
                                )}
                              </td>
                              <td>₹{fmt(p?.portfolioValue)}</td>
                              <td className={(p?.returnPercent ?? 0) >= 0 ? "td-positive" : "td-negative"}>
                                {fmtPct(p?.returnPercent)}
                              </td>
                              <td className={pnl >= 0 ? "td-positive" : "td-negative"}>
                                {pnl >= 0 ? "+" : ""}₹{fmt(pnl)}
                              </td>
                              <td>₹{fmt(p?.availableCash)}</td>
                              <td>{p?.tradeCount ?? 0}</td>
                              <td>
                                {p?.status === "active" && (
                                  <button
                                    className="btn-table-action btn-cancel"
                                    onClick={() => setDisqualifyTarget(p)}
                                    title="Disqualify participant"
                                  >
                                    Disqualify
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : orders.length === 0 ? (
                <p style={{ color: "#888", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                  No orders placed in this tournament yet.
                </p>
              ) : (
                <div className="admin-table-wrapper" style={{ maxHeight: 350, overflowY: "auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Trader</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Type</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td style={{ fontSize: 11, color: "#666" }}>
                            {new Date(o.createdAt).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td>{o.userId?.name || "User"}</td>
                          <td><strong>{o.symbol}</strong></td>
                          <td>
                            <span style={{ color: o.action === "BUY" ? "#1a73e8" : "#d93025", fontWeight: 700 }}>
                              {o.action}
                            </span>
                          </td>
                          <td>{o.orderType}</td>
                          <td>{o.quantity}</td>
                          <td>₹{fmt(o.executionPrice || o.price)}</td>
                          <td>
                            <span className={`order-status-badge order-status-${o.status.toLowerCase()}`}>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="admin-modal-footer">
          <button className="btn-admin-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Disqualify Confirmation Modal */}
      {disqualifyTarget && (
        <div className="admin-modal-overlay" onClick={() => setDisqualifyTarget(null)}>
          <div className="admin-modal" style={{ maxWidth: 450 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h4 className="text-danger">Disqualify Participant</h4>
              <button
                className="tourn-modal-close"
                onClick={() => setDisqualifyTarget(null)}
                disabled={disqualifying}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 13.5, color: "#334155" }}>
                Are you sure you want to disqualify{" "}
                <strong>{disqualifyTarget.userId?.name || "this user"}</strong> from the tournament?
              </p>
              <div style={{ fontSize: 12.5, color: "#666", marginBottom: 12 }}>
                This will immediately cancel any pending limit orders, release reserved funds,
                and remove them from active leaderboard ranking.
              </div>
              <div className="admin-form-group">
                <label>Reason for Disqualification</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Terms violation or requested removal"
                  value={disqualifyReason}
                  onChange={(e) => setDisqualifyReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                className="btn-cancel-keep"
                onClick={() => setDisqualifyTarget(null)}
                disabled={disqualifying}
              >
                Cancel
              </button>
              <button
                className="btn-cancel-confirm"
                onClick={handleDisqualify}
                disabled={disqualifying}
              >
                {disqualifying ? "Disqualifying…" : "Disqualify Participant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
