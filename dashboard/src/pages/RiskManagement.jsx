import React, { useState, useEffect } from "react";
import {
  getRiskOverview,
  getRiskSettings,
  updateRiskSettings,
  getRiskAlerts,
  markAlertAsRead,
  calculateRiskReward,
} from "../services/riskService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import "../styles/RiskManagement.css";

const COLORS = ["#388e3c", "#f57c00", "#d32f2f", "#1976d2", "#7b1fa2", "#0097a7", "#c2185b"];

function RiskManagement() {
  const [overview, setOverview] = useState(null);
  const [settings, setSettings] = useState({
    enforcementMode: "warning",
    maxDailyLoss: 10000,
    dailyLossBasis: "realized_plus_unrealized",
    maxSingleStockAllocationPercent: 30,
    maxPositionSize: 50000,
    enableDailyLossGuard: true,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Risk Calculator Form State
  const [calcInput, setCalcInput] = useState({
    entryPrice: 1000,
    quantity: 10,
    stopLossPrice: 950,
    targetPrice: 1150,
    type: "buy",
  });
  const [calcResult, setCalcResult] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovData, setRes, altData] = await Promise.all([
        getRiskOverview(),
        getRiskSettings(),
        getRiskAlerts(),
      ]);
      setOverview(ovData);
      setSettings(setRes);
      setAlerts(altData);
      setErrorMsg("");
    } catch (err) {
      console.error("Error fetching risk data:", err);
      setErrorMsg("Failed to load risk management metrics. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleCalculate = async () => {
      try {
        const res = await calculateRiskReward(calcInput);
        setCalcResult(res);
      } catch (err) {
        console.error("Calculator error:", err);
      }
    };
    handleCalculate();
  }, [calcInput]);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveSuccessMsg("");
      const updated = await updateRiskSettings(settings);
      setSettings(updated);
      setSaveSuccessMsg("Risk settings updated successfully!");
      fetchData(); // Refresh overview calculations
      setTimeout(() => setSaveSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Failed to save risk settings:", err);
      setErrorMsg("Error saving risk settings.");
    }
  };

  const handleMarkRead = async (alertId) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts((prev) => prev.map((a) => (a._id === alertId ? { ...a, isRead: true } : a)));
      setOverview((prev) => (prev ? { ...prev, activeAlertsCount: Math.max(0, prev.activeAlertsCount - 1) } : prev));
    } catch (err) {
      console.error("Error marking alert read:", err);
    }
  };

  if (loading) {
    return (
      <div className="risk-management-container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Risk Management...</span>
        </div>
        <p className="mt-3 text-muted">Analyzing portfolio risk parameters...</p>
      </div>
    );
  }

  const score = overview?.riskScore ?? 0;
  const category = overview?.riskCategory ?? "Low";
  const catLower = category.toLowerCase();

  const sectorChartData = overview?.sectorConcentration || [];

  return (
    <div className="risk-management-container">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="risk-header-title">
            <i className="bi bi-shield-check text-primary"></i> Smart Risk Guard & Trade Management
          </h1>
          <p className="risk-header-subtitle">
            Real-time portfolio concentration, daily loss safeguards, rule-based risk scoring, and pre-trade validation.
          </p>
        </div>
        <div>
          <span className={`risk-category-badge badge-${catLower}`}>
            {overview?.enforcementMode === "strict" ? "STRICT GUARD ACTIVE" : "WARNING MODE ACTIVE"}
          </span>
        </div>
      </div>

      {errorMsg && <div className="alert alert-danger mb-4">{errorMsg}</div>}
      {saveSuccessMsg && <div className="alert alert-success mb-4">{saveSuccessMsg}</div>}

      {/* Top Overview Cards */}
      <div className="risk-overview-grid">
        {/* Risk Score Card */}
        <div className="risk-card">
          <div className="risk-card-label">Portfolio Risk Score</div>
          <div className="risk-score-display">
            <div className="risk-score-number">{score}</div>
            <div className="text-muted fs-6">/ 100</div>
            <span className={`risk-category-badge badge-${catLower} ms-auto`}>
              {category} Risk
            </span>
          </div>

          <div className="risk-gauge-track">
            <div
              className={`risk-gauge-fill fill-${catLower}`}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            ></div>
          </div>
          <small className="text-muted d-block mt-2" style={{ fontSize: "11px" }}>
            Rule-based score based on holdings allocation, diversification count, and daily loss limits.
          </small>
        </div>

        {/* Daily Loss Guard Card */}
        <div className="risk-card">
          <div className="risk-card-label">Daily Loss Guard (IST)</div>
          <div className="daily-loss-value">
            ₹{Number(overview?.currentDailyLoss || 0).toLocaleString("en-IN")}
          </div>
          <div className="daily-loss-subtext">
            Max Limit: ₹{Number(overview?.dailyLossLimit || 0).toLocaleString("en-IN")} (
            {overview?.dailyLossBasis === "realized_only" ? "Realized P&L" : "Realized + Unrealized"})
          </div>

          <div className="progress mt-3" style={{ height: "8px" }}>
            <div
              className={`progress-bar ${overview?.isDailyLossBreached ? "bg-danger" : "bg-warning"}`}
              role="progressbar"
              style={{
                width: `${Math.min(
                  100,
                  overview?.dailyLossLimit > 0
                    ? (overview?.currentDailyLoss / overview?.dailyLossLimit) * 100
                    : 0
                )}%`,
              }}
            ></div>
          </div>
          {overview?.isDailyLossBreached && (
            <span className="badge bg-danger mt-2">LIMIT BREACHED</span>
          )}
        </div>

        {/* Largest Holding Exposure */}
        <div className="risk-card">
          <div className="risk-card-label">Top Holding Concentration</div>
          <div className="d-flex align-items-baseline justify-content-between">
            <div className="fw-bold fs-3 text-dark">
              {overview?.topHolding ? `${overview.topHolding.allocationPercent}%` : "0%"}
            </div>
            <span className="badge bg-light text-dark border">
              {overview?.topHolding?.symbol || "None"}
            </span>
          </div>
          <div className="text-muted mt-2 small">
            Configured Limit: {settings.maxSingleStockAllocationPercent}% max per single stock.
          </div>
        </div>

        {/* Active Risk Alerts */}
        <div className="risk-card">
          <div className="risk-card-label">Active Risk Alerts</div>
          <div className="fw-bold fs-3 text-dark">
            {overview?.activeAlertsCount || 0}
          </div>
          <div className="text-muted mt-2 small">
            {overview?.activeAlertsCount > 0 ? "Requires review" : "All clear"}
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="risk-main-grid">
        {/* Left Column: Analytics & Score Breakdown */}
        <div>
          {/* Score Factors Panel */}
          <div className="risk-panel">
            <h2 className="risk-panel-title">
              <span><i className="bi bi-list-check me-2"></i>Risk Score Factors & Recommendations</span>
            </h2>

            <div className="score-factors-list mb-4">
              {(overview?.factors || []).map((factor, idx) => (
                <div key={idx} className="factor-item">
                  <div>
                    <div className="factor-name">{factor.name}</div>
                    <div className="factor-desc">{factor.description}</div>
                  </div>
                  <div className="factor-points">+{factor.points} pts</div>
                </div>
              ))}
            </div>

            {overview?.recommendations?.length > 0 && (
              <div className="alert alert-info py-2">
                <strong className="d-block mb-1"><i className="bi bi-lightbulb me-1"></i> Smart Guard Recommendations:</strong>
                <ul className="mb-0 ps-3">
                  {overview.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-muted small mt-2">
              <i className="bi bi-info-circle me-1"></i> {overview?.disclaimer}
            </div>
          </div>

          {/* Sector Concentration Chart */}
          <div className="risk-panel">
            <h2 className="risk-panel-title">
              <span><i className="bi bi-pie-chart me-2"></i>Sector Concentration</span>
            </h2>

            {sectorChartData.length > 0 ? (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={sectorChartData}
                      dataKey="value"
                      nameKey="sector"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ sector, percentage }) => `${sector}: ${percentage}%`}
                    >
                      {sectorChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">No holdings data available for sector breakdown.</div>
            )}
          </div>

          {/* Stop-Loss & Risk-to-Reward Calculator Panel */}
          <div className="risk-panel">
            <h2 className="risk-panel-title">
              <span><i className="bi bi-calculator me-2"></i>Stop-Loss & Risk-to-Reward Calculator</span>
            </h2>

            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small font-semibold">Side</label>
                <select
                  className="form-select form-select-sm"
                  value={calcInput.type}
                  onChange={(e) => setCalcInput({ ...calcInput, type: e.target.value })}
                >
                  <option value="buy">Long (Buy)</option>
                  <option value="sell">Short (Sell)</option>
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label small font-semibold">Entry Price (₹)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={calcInput.entryPrice}
                  onChange={(e) => setCalcInput({ ...calcInput, entryPrice: Number(e.target.value) })}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small font-semibold">Quantity</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={calcInput.quantity}
                  onChange={(e) => setCalcInput({ ...calcInput, quantity: Number(e.target.value) })}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small font-semibold">Stop-Loss (₹)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={calcInput.stopLossPrice}
                  onChange={(e) => setCalcInput({ ...calcInput, stopLossPrice: Number(e.target.value) })}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label small font-semibold">Target (₹)</label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={calcInput.targetPrice}
                  onChange={(e) => setCalcInput({ ...calcInput, targetPrice: Number(e.target.value) })}
                />
              </div>
            </div>

            {calcResult && calcResult.isValid && (
              <div className="row text-center mt-4 p-3 bg-light rounded border">
                <div className="col-md-4">
                  <div className="text-muted small">Potential Loss</div>
                  <div className="fw-bold text-danger fs-5">
                    ₹{calcResult.potentialLoss !== null ? calcResult.potentialLoss.toLocaleString("en-IN") : "N/A"}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="text-muted small">Potential Profit</div>
                  <div className="fw-bold text-success fs-5">
                    ₹{calcResult.potentialProfit !== null ? calcResult.potentialProfit.toLocaleString("en-IN") : "N/A"}
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="text-muted small">Risk-to-Reward Ratio</div>
                  <div className="fw-bold text-primary fs-5">
                    {calcResult.riskRewardRatio !== null ? `1 : ${calcResult.riskRewardRatio}` : "N/A"}
                  </div>
                </div>
              </div>
            )}
            <small className="text-muted d-block mt-2" style={{ fontSize: "11px" }}>
              {calcResult?.disclaimer}
            </small>
          </div>
        </div>

        {/* Right Column: Risk Settings Form & Active Alerts */}
        <div>
          {/* Risk Settings Form */}
          <div className="risk-panel">
            <h2 className="risk-panel-title">
              <span><i className="bi bi-gear-fill me-2"></i>Risk Guard Settings</span>
            </h2>

            <form onSubmit={handleSettingsSubmit}>
              {/* Enforcement Mode */}
              <div className="mb-3">
                <label className="form-label font-semibold">Enforcement Mode</label>
                <select
                  className="form-select"
                  value={settings.enforcementMode}
                  onChange={(e) => setSettings({ ...settings, enforcementMode: e.target.value })}
                >
                  <option value="warning">Warning Mode (Alert & Allow)</option>
                  <option value="strict">Strict Mode (Reject Violating Orders)</option>
                </select>
                <small className="form-text text-muted">
                  Strict mode automatically blocks order execution if hard limits are violated.
                </small>
              </div>

              {/* Max Daily Loss */}
              <div className="mb-3">
                <label className="form-label font-semibold">Max Daily Loss Limit (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  step="1000"
                  value={settings.maxDailyLoss}
                  onChange={(e) => setSettings({ ...settings, maxDailyLoss: Number(e.target.value) })}
                />
              </div>

              {/* Daily Loss Basis */}
              <div className="mb-3">
                <label className="form-label font-semibold">Daily Loss Calculation Basis</label>
                <select
                  className="form-select"
                  value={settings.dailyLossBasis}
                  onChange={(e) => setSettings({ ...settings, dailyLossBasis: e.target.value })}
                >
                  <option value="realized_plus_unrealized">Realized P&L + Unrealized P&L</option>
                  <option value="realized_only">Realized P&L Only</option>
                </select>
              </div>

              {/* Max Single Stock Allocation */}
              <div className="mb-3">
                <label className="form-label font-semibold">Max Single Stock Allocation (%)</label>
                <input
                  type="number"
                  className="form-control"
                  min="5"
                  max="100"
                  value={settings.maxSingleStockAllocationPercent}
                  onChange={(e) => setSettings({ ...settings, maxSingleStockAllocationPercent: Number(e.target.value) })}
                />
              </div>

              {/* Max Position Size */}
              <div className="mb-3">
                <label className="form-label font-semibold">Max Single Position Size (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  min="1000"
                  step="5000"
                  value={settings.maxPositionSize}
                  onChange={(e) => setSettings({ ...settings, maxPositionSize: Number(e.target.value) })}
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Save Risk Configuration
              </button>
            </form>
          </div>

          {/* Active Risk Alerts */}
          <div className="risk-panel">
            <h2 className="risk-panel-title">
              <span><i className="bi bi-bell-fill me-2"></i>Risk Alerts ({alerts.filter((a) => !a.isRead).length})</span>
            </h2>

            {alerts.length > 0 ? (
              alerts.slice(0, 10).map((alert) => (
                <div key={alert._id} className={`risk-alert-card severity-${alert.severity}`}>
                  <div>
                    <div className="fw-bold text-dark small">
                      {alert.symbol ? `[${alert.symbol}] ` : ""}{alert.type.replace(/_/g, " ").toUpperCase()}
                    </div>
                    <div className="alert-explanation">{alert.explanation}</div>
                    <div className="alert-time">
                      {new Date(alert.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>
                  {!alert.isRead && (
                    <button
                      className="btn btn-sm btn-outline-secondary py-0 px-2"
                      onClick={() => handleMarkRead(alert._id)}
                      title="Mark as read"
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-muted text-center py-4">No risk alerts found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RiskManagement;
