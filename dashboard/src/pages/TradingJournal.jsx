import React, { useState, useEffect, useCallback } from "react";
import {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalCalendar,
  getJournalAnalytics,
} from "../services/journalService";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import "../styles/TradingJournal.css";

const MISTAKE_CATEGORIES = ["None","FOMO Entry","Early Exit","Overtrading","Chasing Price","Ignored Stop Loss","Improper Sizing","Other"];
const COMMON_STRATEGIES = ["Discretionary","Trend Following","Momentum","Reversal","Breakout","Scalping","Other"];
const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316"];

const TABS = [
  { key: "entries", label: "Journal Entries", icon: "bi-journal-text" },
  { key: "calendar", label: "Trading Calendar", icon: "bi-calendar3" },
  { key: "analytics", label: "Analytics", icon: "bi-bar-chart" },
];

function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="journal-star-rating" aria-label={`Rating: ${value} out of 5`}>
      {[1,2,3,4,5].map((s) => (
        <span
          key={s}
          className={`journal-star ${s <= value ? "selected" : ""}`}
          onClick={() => !readOnly && onChange && onChange(s)}
          role={readOnly ? undefined : "button"}
          tabIndex={readOnly ? undefined : 0}
          onKeyDown={(e) => !readOnly && e.key === "Enter" && onChange && onChange(s)}
        >★</span>
      ))}
    </div>
  );
}

function EntryModal({ entry, onClose, onSave }) {
  const isEdit = Boolean(entry?._id);

  const [form, setForm] = useState({
    symbol: entry?.symbol || "",
    type: entry?.type || "buy",
    entryDate: entry?.entryDate ? entry.entryDate.split("T")[0] : new Date().toISOString().split("T")[0],
    exitDate: entry?.exitDate ? entry.exitDate.split("T")[0] : "",
    entryPrice: entry?.entryPrice || "",
    exitPrice: entry?.exitPrice || "",
    quantity: entry?.quantity || "",
    realizedPnl: entry?.realizedPnl ?? "",
    strategyName: entry?.strategyName || "Discretionary",
    entryReason: entry?.entryReason || "",
    exitReason: entry?.exitReason || "",
    notes: entry?.notes || "",
    lessonsLearned: entry?.lessonsLearned || "",
    tags: (entry?.tags || []).join(", "),
    rating: entry?.rating || 3,
    ruleFollowed: entry?.ruleFollowed !== false,
    mistakeCategory: entry?.mistakeCategory || "None",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symbol || !form.type || !form.entryPrice || !form.quantity) {
      setError("Symbol, side, entry price, and quantity are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        symbol: form.symbol.trim().toUpperCase(),
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        entryPrice: Number(form.entryPrice),
        quantity: Number(form.quantity),
        exitPrice: form.exitPrice ? Number(form.exitPrice) : undefined,
        realizedPnl: form.realizedPnl !== "" ? Number(form.realizedPnl) : undefined,
      };
      await onSave(payload, isEdit ? entry._id : null);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="journal-modal-overlay" onClick={onClose}>
      <div className="journal-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="journal-modal-title">
          {isEdit ? "Edit Journal Entry" : "Add Journal Entry"}
        </h2>
        {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Symbol *</label>
              <input className="form-control" value={form.symbol} onChange={(e) => setForm({...form, symbol: e.target.value.toUpperCase()})} placeholder="e.g. RELIANCE" disabled={isEdit} />
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Side *</label>
              <select className="form-select" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} disabled={isEdit}>
                <option value="buy">Buy (Long)</option>
                <option value="sell">Sell (Short)</option>
              </select>
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Strategy</label>
              <select className="form-select" value={form.strategyName} onChange={(e) => setForm({...form, strategyName: e.target.value})}>
                {COMMON_STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Entry Date *</label>
              <input type="date" className="form-control" value={form.entryDate} onChange={(e) => setForm({...form, entryDate: e.target.value})} />
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Entry Price (₹) *</label>
              <input type="number" className="form-control" value={form.entryPrice} onChange={(e) => setForm({...form, entryPrice: e.target.value})} min="0.01" step="0.01" />
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Quantity *</label>
              <input type="number" className="form-control" value={form.quantity} onChange={(e) => setForm({...form, quantity: e.target.value})} min="1" />
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Exit Date</label>
              <input type="date" className="form-control" value={form.exitDate} onChange={(e) => setForm({...form, exitDate: e.target.value})} />
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Exit Price (₹)</label>
              <input type="number" className="form-control" value={form.exitPrice} onChange={(e) => setForm({...form, exitPrice: e.target.value})} min="0" step="0.01" placeholder="Optional" />
            </div>
            <div className="col-sm-4">
              <label className="form-label fw-semibold">Realized P&L (₹)</label>
              <input type="number" className="form-control" value={form.realizedPnl} onChange={(e) => setForm({...form, realizedPnl: e.target.value})} placeholder="Optional" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Why did you enter? (Entry Reason)</label>
              <textarea className="form-control" rows={2} value={form.entryReason} onChange={(e) => setForm({...form, entryReason: e.target.value})} placeholder="What was your thesis for this trade?" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Why did you exit? (Exit Reason)</label>
              <textarea className="form-control" rows={2} value={form.exitReason} onChange={(e) => setForm({...form, exitReason: e.target.value})} placeholder="Target hit, stop triggered, plan change?" />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Notes</label>
              <textarea className="form-control" rows={2} value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional observations..." />
            </div>
            <div className="col-12">
              <label className="form-label fw-semibold">Lessons Learned</label>
              <textarea className="form-control" rows={2} value={form.lessonsLearned} onChange={(e) => setForm({...form, lessonsLearned: e.target.value})} placeholder="What would you do differently?" />
            </div>
            <div className="col-sm-6">
              <label className="form-label fw-semibold">Tags (comma-separated)</label>
              <input className="form-control" value={form.tags} onChange={(e) => setForm({...form, tags: e.target.value})} placeholder="e.g. earnings, technical, breakout" />
            </div>
            <div className="col-sm-6">
              <label className="form-label fw-semibold">Mistake Category</label>
              <select className="form-select" value={form.mistakeCategory} onChange={(e) => setForm({...form, mistakeCategory: e.target.value})}>
                {MISTAKE_CATEGORIES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="col-sm-6">
              <label className="form-label fw-semibold d-block">Self-Rating</label>
              <StarRating value={form.rating} onChange={(v) => setForm({...form, rating: v})} />
            </div>
            <div className="col-sm-6 d-flex align-items-center gap-3 pt-4">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="ruleFollowed" checked={form.ruleFollowed} onChange={(e) => setForm({...form, ruleFollowed: e.target.checked})} />
                <label className="form-check-label" htmlFor="ruleFollowed">Followed Trading Rules</label>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end gap-3 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Update Entry" : "Add Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TradingJournal() {
  const [activeTab, setActiveTab] = useState("entries");
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalEntry, setModalEntry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Filters
  const [filterSymbol, setFilterSymbol] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStrategy, setFilterStrategy] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [page, setPage] = useState(1);

  // Calendar
  const [calendarData, setCalendarData] = useState([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getJournalEntries({
        symbol: filterSymbol || undefined,
        type: filterType || undefined,
        strategyName: filterStrategy || undefined,
        fromDate: filterFrom || undefined,
        toDate: filterTo || undefined,
        page,
        limit: 15,
      });
      setEntries(result.entries || []);
      setPagination(result.pagination || { totalCount: 0, page: 1, totalPages: 1 });
    } catch (err) {
      setError("Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  }, [filterSymbol, filterType, filterStrategy, filterFrom, filterTo, page]);

  const loadCalendar = useCallback(async () => {
    try {
      const data = await getJournalCalendar(calYear, calMonth);
      setCalendarData(data || []);
    } catch (err) {
      console.error("Calendar error:", err);
    }
  }, [calYear, calMonth]);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await getJournalAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics error:", err);
    }
  }, []);

  useEffect(() => { if (activeTab === "entries") loadEntries(); }, [activeTab, loadEntries]);
  useEffect(() => { if (activeTab === "calendar") loadCalendar(); }, [activeTab, loadCalendar]);
  useEffect(() => { if (activeTab === "analytics") loadAnalytics(); }, [activeTab, loadAnalytics]);

  const handleSave = async (payload, editId) => {
    if (editId) {
      await updateJournalEntry(editId, payload);
    } else {
      await createJournalEntry(payload);
    }
    loadEntries();
    if (activeTab === "analytics") loadAnalytics();
  };

  const handleDelete = async (id) => {
    try {
      await deleteJournalEntry(id);
      setDeleteConfirm(null);
      loadEntries();
    } catch (err) {
      setError("Failed to delete journal entry.");
    }
  };

  const renderEntries = () => (
    <>
      {/* Filters Bar */}
      <div className="journal-filters-bar">
        <input className="form-control form-control-sm" style={{maxWidth:130}} placeholder="Symbol" value={filterSymbol} onChange={(e) => { setFilterSymbol(e.target.value.toUpperCase()); setPage(1); }} />
        <select className="form-select form-select-sm" style={{maxWidth:120}} value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
          <option value="">All Sides</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <input className="form-control form-control-sm" style={{maxWidth:150}} placeholder="Strategy" value={filterStrategy} onChange={(e) => { setFilterStrategy(e.target.value); setPage(1); }} />
        <input type="date" className="form-control form-control-sm" style={{maxWidth:145}} value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} title="From date" />
        <input type="date" className="form-control form-control-sm" style={{maxWidth:145}} value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} title="To date" />
        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setFilterSymbol(""); setFilterType(""); setFilterStrategy(""); setFilterFrom(""); setFilterTo(""); setPage(1); }}>Clear</button>
        <button className="btn btn-sm btn-primary ms-auto" onClick={() => { setModalEntry(null); setShowModal(true); }}>
          <i className="bi bi-plus-lg me-1"></i> Add Entry
        </button>
      </div>

      {/* Error */}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" /><p className="mt-2 text-muted">Loading journal entries...</p></div>
      ) : entries.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-journal-text" style={{fontSize:48}}></i>
          <p className="mt-3">No journal entries found. Add your first entry!</p>
        </div>
      ) : (
        <>
          {entries.map((entry) => {
            const pnl = entry.realizedPnl;
            const pnlClass = pnl > 0 ? "journal-pnl-positive" : pnl < 0 ? "journal-pnl-negative" : "journal-pnl-neutral";
            return (
              <div key={entry._id} className="journal-entry-card">
                <div style={{flex: 1}}>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="journal-entry-symbol">{entry.symbol}</span>
                    <span className={`badge ${entry.type === "buy" ? "bg-success" : "bg-danger"}`}>{entry.type.toUpperCase()}</span>
                    <span className="badge bg-light text-dark border">{entry.strategyName}</span>
                    {entry.ruleFollowed ? <span className="badge bg-info text-dark">Rules ✓</span> : <span className="badge bg-warning text-dark">Rule Break</span>}
                    <StarRating value={entry.rating} readOnly />
                  </div>
                  <div className="journal-entry-meta mt-1">
                    {new Date(entry.entryDate).toLocaleDateString("en-IN")} &bull; {entry.quantity} qty @ ₹{entry.entryPrice?.toLocaleString("en-IN")}
                    {entry.exitPrice && ` → ₹${entry.exitPrice.toLocaleString("en-IN")}`}
                  </div>
                  {entry.entryReason && <div className="text-muted" style={{fontSize:12, marginTop:4}}>"{entry.entryReason.slice(0, 100)}"</div>}
                  <div className="mt-1">
                    {(entry.tags || []).map((tag) => <span key={tag} className="journal-tag">{tag}</span>)}
                  </div>
                </div>
                <div className="text-end ms-3">
                  {pnl !== 0 && (
                    <div className={`${pnlClass} mb-2`} style={{fontSize:18}}>
                      {pnl > 0 ? "+" : ""}₹{Math.abs(pnl).toLocaleString("en-IN")}
                    </div>
                  )}
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => { setModalEntry(entry); setShowModal(true); }} title="Edit"><i className="bi bi-pencil"></i></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm(entry._id)} title="Delete"><i className="bi bi-trash"></i></button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className="btn btn-sm disabled text-muted">Page {page} / {pagination.totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </>
  );

  const renderCalendar = () => {
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const firstDayOfWeek = new Date(calYear, calMonth - 1, 1).getDay();
    const calMap = {};
    calendarData.forEach((d) => { calMap[d.date] = d; });

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div>
        {/* Month navigation */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { const d = new Date(calYear, calMonth - 2, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()+1); }}>‹</button>
          <h5 className="mb-0">{new Date(calYear, calMonth - 1).toLocaleString("en-IN", {month:"long", year:"numeric"})}</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { const d = new Date(calYear, calMonth, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()+1); }}>›</button>
        </div>
        <div className="journal-calendar-grid">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="calendar-day-header">{d}</div>)}
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`}></div>;
            const dateStr = `${calYear}-${String(calMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const dayData = calMap[dateStr];
            return (
              <div key={dateStr} className={`calendar-day-cell ${dayData ? "has-trades" : ""}`}>
                <div className="calendar-day-number">{day}</div>
                {dayData && (
                  <>
                    <div className="calendar-trade-count">{dayData.tradeCount} trade{dayData.tradeCount > 1 ? "s" : ""}</div>
                    {dayData.realizedPnL !== 0 && (
                      <div className={dayData.realizedPnL > 0 ? "calendar-day-pnl-pos" : "calendar-day-pnl-neg"}>
                        {dayData.realizedPnL > 0 ? "+" : ""}₹{Math.abs(dayData.realizedPnL).toLocaleString("en-IN")}
                      </div>
                    )}
                    {(dayData.tags || []).slice(0, 1).map((t) => <div key={t} className="journal-tag mt-1">{t}</div>)}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => {
    if (!analytics) return <div className="text-center py-4"><div className="spinner-border text-primary" /></div>;
    if (analytics.totalEntries === 0) return <div className="text-center py-5 text-muted">No journal entries yet. Add trades to see analytics.</div>;

    return (
      <>
        <div className="analytics-grid">
          <div className="analytics-metric-card">
            <div className="analytics-metric-value">{analytics.totalEntries}</div>
            <div className="analytics-metric-label">Total Entries</div>
          </div>
          <div className="analytics-metric-card">
            <div className="analytics-metric-value">{analytics.ruleFollowedPercent}%</div>
            <div className="analytics-metric-label">Rules Followed</div>
          </div>
          <div className="analytics-metric-card">
            <div className="analytics-metric-value">{analytics.completionRatePercent}%</div>
            <div className="analytics-metric-label">Notes Completion</div>
          </div>
        </div>

        <div className="row g-4">
          {analytics.tagDistribution.length > 0 && (
            <div className="col-md-6">
              <div className="risk-panel">
                <h6 className="fw-bold mb-3">Strategy Tags Distribution</h6>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={analytics.tagDistribution} dataKey="count" nameKey="tag" outerRadius={80} label={({tag,count}) => `${tag}: ${count}`}>
                      {analytics.tagDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {analytics.mistakeDistribution.filter(m => m.mistake !== "None").length > 0 && (
            <div className="col-md-6">
              <div className="risk-panel">
                <h6 className="fw-bold mb-3">Most Common Self-Reported Mistakes</h6>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.mistakeDistribution.filter(m => m.mistake !== "None")} layout="vertical" margin={{left:40}}>
                    <XAxis type="number" fontSize={11} />
                    <YAxis dataKey="mistake" type="category" fontSize={11} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        <p className="text-muted small mt-3">
          <i className="bi bi-info-circle me-1"></i>
          Analytics are based on self-reported journal entries, not verified exchange transaction data.
        </p>
      </>
    );
  };

  return (
    <div className="journal-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="journal-header-title"><i className="bi bi-journal-text text-primary"></i> Trading Journal</h1>
          <p className="text-muted small mb-0">Record, annotate, and learn from your completed trades.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="journal-tabs">
        {TABS.map((tab) => (
          <button key={tab.key} className={`journal-tab-btn ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            <i className={`bi ${tab.icon} me-1`}></i> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "entries" && renderEntries()}
      {activeTab === "calendar" && renderCalendar()}
      {activeTab === "analytics" && renderAnalytics()}

      {/* Add/Edit Modal */}
      {showModal && (
        <EntryModal
          entry={modalEntry}
          onClose={() => { setShowModal(false); setModalEntry(null); }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="journal-modal-overlay">
          <div className="journal-modal" style={{maxWidth:400}}>
            <h5>Delete Journal Entry?</h5>
            <p className="text-muted">This will only delete the journal record. The original order and financial data will not be affected.</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TradingJournal;
