import React from "react";

function AnalyticsSummaryCards({ summary, loading }) {
  if (loading) {
    return (
      <div className="analytics-summary-grid loading-grid">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div key={idx} className="analytics-summary-card skeleton-card">
            <div className="skeleton-line short"></div>
            <div className="skeleton-line tall"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatPercent = (val) => {
    const num = Number(val || 0);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  };

  const {
    totalInvested = 0,
    currentValue = 0,
    cashBalance = 0,
    totalPortfolioValue = 0,
    realizedPnl = 0,
    unrealizedPnl = 0,
    totalPnl = 0,
    totalReturnPercent = 0,
    dayPnl = 0,
  } = summary || {};

  return (
    <div className="analytics-summary-grid">
      {/* Total Invested */}
      <div className="analytics-summary-card">
        <div className="card-header-sm">
          <span>Total Invested</span>
          <i className="bi bi-wallet-fill card-icon"></i>
        </div>
        <strong className="card-value">{formatCurrency(totalInvested)}</strong>
        <span className="card-subtext">Capital allocated in stocks</span>
      </div>

      {/* Current Holdings Value */}
      <div className="analytics-summary-card">
        <div className="card-header-sm">
          <span>Current Holdings Value</span>
          <i className="bi bi-briefcase-fill card-icon"></i>
        </div>
        <strong className="card-value">{formatCurrency(currentValue)}</strong>
        <span className="card-subtext">
          Portfolio Total: {formatCurrency(totalPortfolioValue)} (incl. cash)
        </span>
      </div>

      {/* Available Cash Balance */}
      <div className="analytics-summary-card">
        <div className="card-header-sm">
          <span>Cash Balance</span>
          <i className="bi bi-cash-stack card-icon"></i>
        </div>
        <strong className="card-value">{formatCurrency(cashBalance)}</strong>
        <span className="card-subtext">Uninvested funds available</span>
      </div>

      {/* Realized P&L */}
      <div className="analytics-summary-card">
        <div className="card-header-sm">
          <span>Realized P&L</span>
          <i className="bi bi-check-circle-fill card-icon"></i>
        </div>
        <strong
          className={`card-value ${
            realizedPnl >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {realizedPnl >= 0 ? "+" : ""}
          {formatCurrency(realizedPnl)}
        </strong>
        <span className="card-subtext">Profit/loss from closed trades</span>
      </div>

      {/* Unrealized P&L */}
      <div className="analytics-summary-card">
        <div className="card-header-sm">
          <span>Unrealized P&L</span>
          <i className="bi bi-clock-history card-icon"></i>
        </div>
        <strong
          className={`card-value ${
            unrealizedPnl >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {unrealizedPnl >= 0 ? "+" : ""}
          {formatCurrency(unrealizedPnl)}
        </strong>
        <span className="card-subtext">Paper return on current holdings</span>
      </div>

      {/* Total Return % */}
      <div className="analytics-summary-card highlight-card">
        <div className="card-header-sm">
          <span>Total Return</span>
          <i className="bi bi-graph-up-arrow card-icon"></i>
        </div>
        <strong
          className={`card-value ${
            totalPnl >= 0 ? "text-success" : "text-danger"
          }`}
        >
          {totalPnl >= 0 ? "+" : ""}
          {formatCurrency(totalPnl)} ({formatPercent(totalReturnPercent)})
        </strong>
        <span className="card-subtext">
          Today: {dayPnl >= 0 ? "+" : ""}
          {formatCurrency(dayPnl)}
        </span>
      </div>
    </div>
  );
}

export default AnalyticsSummaryCards;
