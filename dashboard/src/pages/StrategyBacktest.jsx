import React, { useState, useEffect } from "react";
import {
  runBacktestSimulation,
  saveBacktestRun,
  getSavedBacktestHistory,
  getSavedBacktestRunById,
  deleteSavedBacktestRun,
  getAvailableStrategies,
} from "../services/backtestService";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import "../styles/StrategyBacktest.css";

const SUPPORTED_SYMBOLS = ["RELIANCE","TCS","INFY","HDFCBANK","ICICIBANK","SBIN","ITC","BHARTIARTL","WIPRO","AXISBANK","KOTAKBANK","MARUTI","HINDUNILVR","SUNPHARMA"];
const SUPPORTED_INTERVALS = [
  { value: "15min", label: "15 Minutes" },
  { value: "60min", label: "60 Minutes" },
  { value: "eod",   label: "Daily (EOD)" },
];

const fmtINR = (v) => {
  if (v === undefined || v === null || v === "N/A") return "N/A";
  return "₹" + Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const fmtPct = (v) => {
  if (v === undefined || v === null || v === "N/A") return "N/A";
  return Number(v).toFixed(2) + "%";
};

const metricValueClass = (v) => {
  if (typeof v !== "number") return "neutral";
  return v > 0 ? "positive" : v < 0 ? "negative" : "neutral";
};

function SummaryCard({ label, value, suffix = "", colorize = false }) {
  const display = value === "N/A" ? "N/A" : `${value}${suffix}`;
  const cls = colorize && typeof value === "number" ? metricValueClass(value) : "neutral";
  return (
    <div className="backtest-metric-card">
      <div className="backtest-metric-label">{label}</div>
      <div className={`backtest-metric-value ${cls}`}>{display}</div>
    </div>
  );
}

function StrategyBacktest() {
  const [view, setView] = useState("run"); // 'run' | 'history' | 'detail'

  // Config form state
  const [config, setConfig] = useState({
    symbol: "RELIANCE",
    fromDate: (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0]; })(),
    toDate: new Date().toISOString().split("T")[0],
    interval: "15min",
    strategyName: "sma_crossover",
    fastPeriod: 9,
    slowPeriod: 21,
    initialCapital: 100000,
    maxAllocationPercent: 50,
    brokerage: 20,
    slippagePercent: 0.05,
  });

  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // History tab
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histPagination, setHistPagination] = useState({ totalPages: 1 });
  const [selectedRun, setSelectedRun] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await getSavedBacktestHistory(page, 10);
      setHistory(res.history || []);
      setHistPagination(res.pagination || { totalPages: 1 });
      setHistPage(page);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { if (view === "history") loadHistory(1); }, [view]);

  const handleRun = async (e) => {
    e.preventDefault();
    setRunning(true);
    setRunError("");
    setResult(null);
    setSavedMsg("");

    const { fastPeriod, slowPeriod } = config;
    if (Number(fastPeriod) >= Number(slowPeriod)) {
      setRunError("Fast SMA period must be less than Slow SMA period.");
      setRunning(false);
      return;
    }

    try {
      const res = await runBacktestSimulation({
        ...config,
        fastPeriod: Number(config.fastPeriod),
        slowPeriod: Number(config.slowPeriod),
        initialCapital: Number(config.initialCapital),
        maxAllocationPercent: Number(config.maxAllocationPercent),
        brokerage: Number(config.brokerage),
        slippagePercent: Number(config.slippagePercent),
      });
      setResult(res);
    } catch (err) {
      setRunError(err.response?.data?.message || err.message || "Backtest failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await saveBacktestRun({
        strategyName: result.strategyName,
        symbol: result.symbol,
        fromDate: result.fromDate,
        toDate: result.toDate,
        interval: result.interval,
        parameters: result.parameters,
        summary: result.summary,
        trades: result.trades,
        equityCurve: result.equityCurve,
      });
      setSavedMsg("Backtest saved to history!");
      setTimeout(() => setSavedMsg(""), 4000);
    } catch (err) {
      setSavedMsg("Save failed: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await deleteSavedBacktestRun(id);
      setDeleteConfirm(null);
      loadHistory(histPage);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const run = await getSavedBacktestRunById(id);
      setSelectedRun(run);
      setView("detail");
    } catch (err) {
      console.error("Load detail error:", err);
    }
  };

  const renderConfigForm = () => (
    <form onSubmit={handleRun}>
      <div className="backtest-config-panel">
        <h2 className="fw-bold" style={{fontSize:16, marginBottom:20}}>
          <i className="bi bi-sliders me-2 text-primary"></i>Backtest Configuration
        </h2>

        <div className="backtest-config-grid">
          <div>
            <label className="form-label fw-semibold">Stock Symbol</label>
            <select className="form-select" value={config.symbol} onChange={(e) => setConfig({...config, symbol: e.target.value})}>
              {SUPPORTED_SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold">From Date</label>
            <input type="date" className="form-control" value={config.fromDate} onChange={(e) => setConfig({...config, fromDate: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">To Date</label>
            <input type="date" className="form-control" value={config.toDate} onChange={(e) => setConfig({...config, toDate: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">Candle Interval</label>
            <select className="form-select" value={config.interval} onChange={(e) => setConfig({...config, interval: e.target.value})}>
              {SUPPORTED_INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold">Strategy</label>
            <select className="form-select" value={config.strategyName} onChange={(e) => setConfig({...config, strategyName: e.target.value})}>
              <option value="sma_crossover">SMA Crossover</option>
            </select>
          </div>
          <div>
            <label className="form-label fw-semibold">Fast SMA Period</label>
            <input type="number" className="form-control" value={config.fastPeriod} min="1" onChange={(e) => setConfig({...config, fastPeriod: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">Slow SMA Period</label>
            <input type="number" className="form-control" value={config.slowPeriod} min="2" onChange={(e) => setConfig({...config, slowPeriod: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">Initial Capital (₹)</label>
            <input type="number" className="form-control" value={config.initialCapital} min="1000" step="1000" onChange={(e) => setConfig({...config, initialCapital: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">Max Allocation per Trade (%)</label>
            <input type="number" className="form-control" value={config.maxAllocationPercent} min="5" max="100" onChange={(e) => setConfig({...config, maxAllocationPercent: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">Brokerage per Fill (₹)</label>
            <input type="number" className="form-control" value={config.brokerage} min="0" step="1" onChange={(e) => setConfig({...config, brokerage: e.target.value})} />
          </div>
          <div>
            <label className="form-label fw-semibold">Slippage (%)</label>
            <input type="number" className="form-control" value={config.slippagePercent} min="0" step="0.01" onChange={(e) => setConfig({...config, slippagePercent: e.target.value})} />
          </div>
        </div>

        {runError && <div className="alert alert-danger mt-3">{runError}</div>}

        <div className="d-flex gap-3 mt-4">
          <button type="submit" className="btn btn-primary" disabled={running}>
            {running ? (<><span className="spinner-border spinner-border-sm me-2" />Running simulation...</>) : (<><i className="bi bi-play-fill me-2"></i>Run Backtest</>)}
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => { setView("history"); }}>
            <i className="bi bi-clock-history me-1"></i> View History
          </button>
        </div>
      </div>
    </form>
  );

  const renderResults = () => {
    if (!result) return null;
    const { summary, trades = [], equityCurve = [], simulationAssumptions } = result;
    const equityChartData = equityCurve.slice(0, 500).map((p, i) => ({
      name: i,
      time: p.time,
      equity: p.equity,
      drawdown: p.drawdownPercent,
    }));

    return (
      <div>
        {/* Assumptions */}
        <div className="backtest-assumptions-box">
          <strong>Simulation Assumptions:</strong> {simulationAssumptions?.nextCandleExecution} &bull; Brokerage: ₹{simulationAssumptions?.brokeragePerFill}/fill &bull; Slippage: {simulationAssumptions?.slippagePercent}% &bull; Max Allocation: {simulationAssumptions?.maxAllocationPercent}%
        </div>

        {/* Save button */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0" style={{fontSize:18}}>
            Backtest Results — {result.symbol} ({result.fromDate} to {result.toDate})
          </h2>
          <div className="d-flex gap-2 align-items-center">
            {savedMsg && <span className={savedMsg.includes("failed") ? "text-danger small" : "text-success small"}>{savedMsg}</span>}
            <button className="btn btn-sm btn-outline-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : <><i className="bi bi-cloud-arrow-up me-1"></i>Save Run</>}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="backtest-summary-grid">
          <SummaryCard label="Initial Capital" value={fmtINR(summary.initialCapital)} />
          <SummaryCard label="Final Equity" value={fmtINR(summary.finalEquity)} />
          <SummaryCard label="Net P&L" value={fmtINR(summary.netPnL)} colorize />
          <SummaryCard label="Return %" value={fmtPct(summary.returnPercent)} colorize />
          <SummaryCard label="Total Trades" value={summary.totalTrades} />
          <SummaryCard label="Win Rate" value={fmtPct(summary.winRate)} />
          <SummaryCard label="Profit Factor" value={typeof summary.profitFactor === "number" ? summary.profitFactor.toFixed(2) : summary.profitFactor} />
          <SummaryCard label="Max Drawdown" value={fmtPct(summary.maxDrawdownPercent)} />
          <SummaryCard label="Total Costs" value={fmtINR(summary.totalCosts)} />
        </div>

        {/* Equity Curve */}
        {equityChartData.length > 0 && (
          <div className="backtest-chart-panel">
            <h3 className="backtest-chart-title"><i className="bi bi-graph-up me-2 text-success"></i>Equity Curve</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={equityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={false} />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} width={60} fontSize={11} />
                <Tooltip formatter={(v, name) => [name === "equity" ? fmtINR(v) : fmtPct(v), name === "equity" ? "Equity" : "Drawdown %"]} />
                <ReferenceLine y={Number(config.initialCapital)} stroke="#e5e7eb" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="equity" dot={false} stroke="#3b82f6" strokeWidth={2} name="equity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Drawdown Curve */}
        {equityChartData.length > 0 && (
          <div className="backtest-chart-panel">
            <h3 className="backtest-chart-title"><i className="bi bi-graph-down me-2 text-danger"></i>Drawdown Curve</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={equityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={false} />
                <YAxis tickFormatter={(v) => `-${v.toFixed(0)}%`} width={55} fontSize={11} />
                <Tooltip formatter={(v) => [fmtPct(v), "Drawdown"]} />
                <Line type="monotone" dataKey="drawdown" dot={false} stroke="#ef4444" strokeWidth={1.5} name="drawdown" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trade Table */}
        {trades.length > 0 ? (
          <div className="backtest-trade-table-container">
            <h3 className="backtest-chart-title"><i className="bi bi-table me-2"></i>Simulated Trades ({trades.length})</h3>
            <table className="backtest-trade-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Entry Time</th>
                  <th>Entry Price</th>
                  <th>Exit Time</th>
                  <th>Exit Price</th>
                  <th>Qty</th>
                  <th>Gross P&L</th>
                  <th>Costs</th>
                  <th>Net P&L</th>
                  <th>Return %</th>
                  <th>Exit Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((tr) => (
                  <tr key={tr.tradeNumber}>
                    <td>{tr.tradeNumber}</td>
                    <td>{tr.entryTime}</td>
                    <td>₹{tr.executionEntryPrice?.toLocaleString("en-IN")}</td>
                    <td>{tr.exitTime}</td>
                    <td>₹{tr.executionExitPrice?.toLocaleString("en-IN")}</td>
                    <td>{tr.quantity}</td>
                    <td className={tr.grossPnL >= 0 ? "pnl-positive" : "pnl-negative"}>₹{tr.grossPnL?.toLocaleString("en-IN")}</td>
                    <td>₹{tr.costs?.toLocaleString("en-IN")}</td>
                    <td className={tr.netPnL >= 0 ? "pnl-positive" : "pnl-negative"}>₹{tr.netPnL?.toLocaleString("en-IN")}</td>
                    <td className={tr.returnPercent >= 0 ? "pnl-positive" : "pnl-negative"}>{tr.returnPercent?.toFixed(2)}%</td>
                    <td>{tr.exitReason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No completed trades generated. Try a wider date range or different SMA periods.
          </div>
        )}

        <div className="backtest-disclaimer">
          ⚠️ This backtest uses genuine historical TrueData market candles. Results are for educational purposes only and do not guarantee future performance. Simulated orders are completely separate from real order execution.
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0" style={{fontSize:18}}><i className="bi bi-clock-history me-2 text-primary"></i>Saved Backtest Runs</h2>
        <button className="btn btn-sm btn-outline-primary" onClick={() => setView("run")}>← Back to Backtest</button>
      </div>
      {historyLoading ? (
        <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
      ) : history.length === 0 ? (
        <div className="text-center py-5 text-muted">No saved backtest runs yet.</div>
      ) : (
        <>
          {history.map((run) => (
            <div key={run._id} className="backtest-history-card">
              <div>
                <div className="backtest-history-symbol">{run.symbol} — {run.strategyName}</div>
                <div className="backtest-history-meta">{run.fromDate} to {run.toDate} &bull; {run.interval} &bull; {run.parameters?.fastPeriod}/{run.parameters?.slowPeriod} SMA</div>
                <div className="mt-1">
                  <span className={`me-3 ${run.summary?.netPnL >= 0 ? "text-success" : "text-danger"} fw-semibold`}>
                    P&L: {fmtINR(run.summary?.netPnL)} ({fmtPct(run.summary?.returnPercent)})
                  </span>
                  <span className="text-muted small">Trades: {run.summary?.totalTrades} &bull; WR: {fmtPct(run.summary?.winRate)}</span>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={() => handleViewDetail(run._id)}>View</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteConfirm(run._id)}><i className="bi bi-trash"></i></button>
              </div>
            </div>
          ))}
          {histPagination.totalPages > 1 && (
            <div className="d-flex justify-content-center gap-2 mt-3">
              <button className="btn btn-sm btn-outline-secondary" disabled={histPage <= 1} onClick={() => loadHistory(histPage - 1)}>← Prev</button>
              <span className="btn btn-sm disabled text-muted">Page {histPage}/{histPagination.totalPages}</span>
              <button className="btn btn-sm btn-outline-secondary" disabled={histPage >= histPagination.totalPages} onClick={() => loadHistory(histPage + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
      {deleteConfirm && (
        <div className="journal-modal-overlay">
          <div className="journal-modal" style={{maxWidth:400}}>
            <h5>Delete Saved Run?</h5>
            <p className="text-muted">This will permanently delete the saved backtest result.</p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDeleteHistory(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetail = () => {
    if (!selectedRun) return null;
    const { summary, trades = [], equityCurve = [] } = selectedRun;
    const equityChartData = equityCurve.slice(0, 500).map((p, i) => ({ name: i, equity: p.equity, drawdown: p.drawdownPercent }));
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0" style={{fontSize:18}}>
            {selectedRun.symbol} — {selectedRun.strategyName} ({selectedRun.fromDate} to {selectedRun.toDate})
          </h2>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setView("history")}>← Back to History</button>
        </div>
        <div className="backtest-summary-grid">
          <SummaryCard label="Initial Capital" value={fmtINR(summary?.initialCapital)} />
          <SummaryCard label="Final Equity" value={fmtINR(summary?.finalEquity)} />
          <SummaryCard label="Net P&L" value={fmtINR(summary?.netPnL)} colorize />
          <SummaryCard label="Return %" value={fmtPct(summary?.returnPercent)} colorize />
          <SummaryCard label="Total Trades" value={summary?.totalTrades} />
          <SummaryCard label="Win Rate" value={fmtPct(summary?.winRate)} />
          <SummaryCard label="Max Drawdown" value={fmtPct(summary?.maxDrawdownPercent)} />
          <SummaryCard label="Total Costs" value={fmtINR(summary?.totalCosts)} />
        </div>
        {equityChartData.length > 0 && (
          <div className="backtest-chart-panel">
            <h3 className="backtest-chart-title">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={equityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={false} />
                <YAxis tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} width={60} fontSize={11} />
                <Tooltip formatter={(v) => [fmtINR(v), "Equity"]} />
                <Line type="monotone" dataKey="equity" dot={false} stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="backtest-disclaimer">Saved backtest results are for review only. They are not re-run against current market data.</div>
      </div>
    );
  };

  return (
    <div className="backtest-container">
      <div className="mb-4">
        <h1 className="backtest-header-title"><i className="bi bi-cpu text-primary"></i> Strategy Backtesting</h1>
        <p className="text-muted small mb-0">
          Simulate trading strategies against genuine TrueData historical candles. Results are educational only.
        </p>
      </div>

      {view === "run" && (
        <>
          {renderConfigForm()}
          {running && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-2" />
              <p className="text-muted">Fetching genuine TrueData candles and running simulation...</p>
            </div>
          )}
          {result && renderResults()}
        </>
      )}
      {view === "history" && renderHistory()}
      {view === "detail" && renderDetail()}
    </div>
  );
}

export default StrategyBacktest;
