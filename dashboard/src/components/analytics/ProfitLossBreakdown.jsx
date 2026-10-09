import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";

function ProfitLossBreakdown({ breakdownData, loading, error, onStockFilterChange }) {
  const [selectedStock, setSelectedStock] = useState("");

  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatPercent = (val) => {
    const num = Number(val || 0);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  };

  const { summary = {}, stocks = [], recentSellTransactions = [] } = breakdownData || {};
  const { totalRealizedPnl = 0, totalUnrealizedPnl = 0, combinedPnl = 0 } = summary;

  const handleStockChange = (e) => {
    const sym = e.target.value;
    setSelectedStock(sym);
    onStockFilterChange(sym || null);
  };

  const chartData = [
    { name: "Realized P&L", value: totalRealizedPnl },
    { name: "Unrealized P&L", value: totalUnrealizedPnl },
    { name: "Combined P&L", value: combinedPnl },
  ];

  return (
    <div className="portfolio-analytics-card">
      <div className="chart-header-row">
        <div>
          <h5 className="chart-title">Realized vs. Unrealized Profit & Loss</h5>
          <span className="chart-subtitle">
            Breakdown of closed trade profits versus paper gains on active holdings
          </span>
        </div>

        {/* Stock Filter Dropdown */}
        <div className="stock-filter-box">
          <select
            className="form-select form-select-sm stock-select-dropdown"
            value={selectedStock}
            onChange={handleStockChange}
          >
            <option value="">All Stocks</option>
            {stocks.map((stk) => (
              <option key={stk.symbol} value={stk.symbol}>
                {stk.symbol} - {stk.companyName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="pnl-breakdown-cards">
        <div className="pnl-card">
          <span>Total Realized P&L</span>
          <strong className={totalRealizedPnl >= 0 ? "text-success" : "text-danger"}>
            {totalRealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(totalRealizedPnl)}
          </strong>
          <small>Completed sell executions</small>
        </div>

        <div className="pnl-card">
          <span>Total Unrealized P&L</span>
          <strong className={totalUnrealizedPnl >= 0 ? "text-success" : "text-danger"}>
            {totalUnrealizedPnl >= 0 ? "+" : ""}
            {formatCurrency(totalUnrealizedPnl)}
          </strong>
          <small>Current active holdings return</small>
        </div>

        <div className="pnl-card highlight">
          <span>Combined Total P&L</span>
          <strong className={combinedPnl >= 0 ? "text-success" : "text-danger"}>
            {combinedPnl >= 0 ? "+" : ""}
            {formatCurrency(combinedPnl)}
          </strong>
          <small>Realized + Unrealized</small>
        </div>
      </div>

      {/* Main Breakdown Area */}
      <div className="row g-4 mt-2">
        {/* Visual Bar Comparison */}
        <div className="col-lg-5">
          <div className="pnl-chart-box">
            <h6>P&L Comparison</h6>
            {loading ? (
              <div className="chart-loading-state">
                <div className="spinner-border spinner-border-sm text-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} stroke="#888" />
                  <YAxis fontSize={11} stroke="#888" tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), "P&L"]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.value >= 0 ? "#00b386" : "#e53935"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Sell Transaction Execution History */}
        <div className="col-lg-7">
          <div className="recent-sell-box">
            <h6>Realized Transactions History</h6>
            {recentSellTransactions.length === 0 ? (
              <div className="empty-transactions-text">
                <i className="bi bi-clock-history me-2 text-muted"></i>
                No completed sell transactions found for this selection. Realized P&L accumulates as holdings are sold.
              </div>
            ) : (
              <div className="table-responsive sell-table-wrapper">
                <table className="table table-sm align-middle text-nowrap">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Stock</th>
                      <th>Qty</th>
                      <th>Cost Basis</th>
                      <th>Sale Price</th>
                      <th>Realized P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSellTransactions.map((tx) => (
                      <tr key={tx.orderId}>
                        <td className="text-muted fs-7">
                          {tx.executedAt ? new Date(tx.executedAt).toLocaleDateString("en-IN") : "N/A"}
                        </td>
                        <td>
                          <strong>{tx.symbol}</strong>
                          <span className="product-badge ms-1">{tx.product}</span>
                        </td>
                        <td>{tx.quantity}</td>
                        <td className="text-muted">{formatCurrency(tx.costBasis)}</td>
                        <td>{formatCurrency(tx.executionPrice)}</td>
                        <td>
                          <span className={tx.realizedPnl >= 0 ? "text-success fw-bold" : "text-danger fw-bold"}>
                            {tx.realizedPnl >= 0 ? "+" : ""}
                            {formatCurrency(tx.realizedPnl)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfitLossBreakdown;
