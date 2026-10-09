import React, { useState } from "react";

function StockPerformanceTable({ rankingsData, loading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("unrealizedPnlPercent"); // "unrealizedPnlPercent" | "unrealizedPnl" | "symbol" | "investedValue"

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatPercent = (val) => {
    const num = Number(val || 0);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  };

  const { bestPerformer, worstPerformer, stocks = [] } = rankingsData || {};

  const filteredStocks = stocks.filter((s) => {
    const term = searchTerm.toLowerCase().trim();
    return (
      s.symbol.toLowerCase().includes(term) ||
      s.companyName.toLowerCase().includes(term)
    );
  });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (sortBy === "unrealizedPnlPercent") {
      return b.unrealizedPnlPercent - a.unrealizedPnlPercent;
    }
    if (sortBy === "unrealizedPnl") {
      return b.unrealizedPnl - a.unrealizedPnl;
    }
    if (sortBy === "investedValue") {
      return b.investedValue - a.investedValue;
    }
    if (sortBy === "symbol") {
      return a.symbol.localeCompare(b.symbol);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="portfolio-analytics-card">
        <div className="skeleton-line title-skel"></div>
        <div className="skeleton-line table-skel"></div>
      </div>
    );
  }

  return (
    <div className="portfolio-analytics-card">
      <div className="chart-header-row">
        <div>
          <h5 className="chart-title">Stock Performance & Rankings</h5>
          <span className="chart-subtitle">
            Current unrealized returns, gainers, losers, and portfolio P&L contribution
          </span>
        </div>

        {/* Search & Sort Controls */}
        <div className="table-controls-row">
          <input
            type="text"
            className="form-control form-control-sm search-input-analytics"
            placeholder="Search stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="form-select form-select-sm sort-select-analytics"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="unrealizedPnlPercent">Sort by Return %</option>
            <option value="unrealizedPnl">Sort by P&L (₹)</option>
            <option value="investedValue">Sort by Investment</option>
            <option value="symbol">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Best & Worst Performers Highlight Cards */}
      {bestPerformer && worstPerformer && (
        <div className="rankings-highlight-row">
          {/* Best Performer */}
          <div className="performer-card best">
            <div className="performer-badge">🏆 Best Performer</div>
            <div className="performer-details">
              <div>
                <strong className="performer-symbol">{bestPerformer.symbol}</strong>
                <span className="performer-name">{bestPerformer.companyName}</span>
              </div>
              <div className="text-end">
                <strong className="text-success">
                  {formatCurrency(bestPerformer.unrealizedPnl)}
                </strong>
                <div className="text-success fw-bold">
                  {formatPercent(bestPerformer.unrealizedPnlPercent)}
                </div>
              </div>
            </div>
          </div>

          {/* Worst Performer */}
          <div className="performer-card worst">
            <div className="performer-badge">📉 Needs Attention</div>
            <div className="performer-details">
              <div>
                <strong className="performer-symbol">{worstPerformer.symbol}</strong>
                <span className="performer-name">{worstPerformer.companyName}</span>
              </div>
              <div className="text-end">
                <strong
                  className={worstPerformer.unrealizedPnl >= 0 ? "text-success" : "text-danger"}
                >
                  {worstPerformer.unrealizedPnl >= 0 ? "+" : ""}
                  {formatCurrency(worstPerformer.unrealizedPnl)}
                </strong>
                <div
                  className={worstPerformer.unrealizedPnlPercent >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}
                >
                  {formatPercent(worstPerformer.unrealizedPnlPercent)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Table */}
      {stocks.length === 0 ? (
        <div className="empty-stock-table text-center py-5 text-muted">
          <i className="bi bi-inbox fs-2 mb-2"></i>
          <div>No holdings in portfolio for stock performance analysis</div>
        </div>
      ) : (
        <div className="table-responsive mt-3">
          <table className="table table-hover align-middle analytics-stock-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Stock</th>
                <th>Qty</th>
                <th>Avg. Price</th>
                <th>LTP</th>
                <th>Invested</th>
                <th>Current Value</th>
                <th>Unrealized P&L</th>
                <th>Return %</th>
                <th>P&L Contribution</th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock, idx) => (
                <tr key={stock.symbol}>
                  <td>
                    <span className="rank-num">#{idx + 1}</span>
                  </td>
                  <td>
                    <strong>{stock.symbol}</strong>
                    <div className="stock-subname text-muted">{stock.companyName}</div>
                  </td>
                  <td>{stock.quantity}</td>
                  <td>{formatCurrency(stock.averagePrice)}</td>
                  <td>{formatCurrency(stock.currentPrice)}</td>
                  <td>{formatCurrency(stock.investedValue)}</td>
                  <td>{formatCurrency(stock.currentValue)}</td>
                  <td>
                    <span
                      className={
                        stock.unrealizedPnl >= 0
                          ? "text-success fw-bold"
                          : "text-danger fw-bold"
                      }
                    >
                      {stock.unrealizedPnl >= 0 ? "+" : ""}
                      {formatCurrency(stock.unrealizedPnl)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        stock.unrealizedPnlPercent >= 0
                          ? "bg-success-subtle text-success"
                          : "bg-danger-subtle text-danger"
                      }`}
                    >
                      {formatPercent(stock.unrealizedPnlPercent)}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="progress flex-grow-1" style={{ height: "6px" }}>
                        <div
                          className={`progress-bar ${
                            stock.unrealizedPnl >= 0 ? "bg-success" : "bg-danger"
                          }`}
                          style={{
                            width: `${Math.min(Math.abs(stock.contributionPercent || 0), 100)}%`,
                          }}
                        ></div>
                      </div>
                      <small className="text-muted text-nowrap">
                        {stock.contributionPercent ? stock.contributionPercent.toFixed(1) : "0.0"}%
                      </small>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StockPerformanceTable;
