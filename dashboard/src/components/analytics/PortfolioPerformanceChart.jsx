import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const RANGES = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

function PortfolioPerformanceChart({
  performanceData,
  selectedRange,
  onRangeChange,
  loading,
  error,
}) {
  const formatCurrency = (val) =>
    `₹${Number(val || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  const formatPercent = (val) => {
    const num = Number(val || 0);
    const sign = num > 0 ? "+" : "";
    return `${sign}${num.toFixed(2)}%`;
  };

  const { snapshots = [], metrics = {} } = performanceData || {};
  const {
    startingValue = 0,
    endingValue = 0,
    absoluteChange = 0,
    percentageChange = 0,
    dataPointsCount = 0,
    collectionStartDate = null,
  } = metrics;

  const isPositive = absoluteChange >= 0;

  return (
    <div className="portfolio-analytics-card">
      <div className="chart-header-row">
        <div>
          <h5 className="chart-title">Portfolio Performance Over Time</h5>
          <span className="chart-subtitle">
            Historical portfolio valuation and growth trajectory
          </span>
        </div>

        {/* Date Range Selector */}
        <div className="range-selector-buttons">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              className={`range-btn ${selectedRange === range ? "active" : ""}`}
              onClick={() => onRangeChange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="performance-metrics-bar">
        <div className="metric-item">
          <span className="metric-label">Period Start</span>
          <strong className="metric-val">{formatCurrency(startingValue)}</strong>
        </div>

        <div className="metric-item">
          <span className="metric-label">Period End</span>
          <strong className="metric-val">{formatCurrency(endingValue)}</strong>
        </div>

        <div className="metric-item">
          <span className="metric-label">Absolute Change</span>
          <strong
            className={`metric-val ${isPositive ? "text-success" : "text-danger"}`}
          >
            {isPositive ? "+" : ""}
            {formatCurrency(absoluteChange)}
          </strong>
        </div>

        <div className="metric-item">
          <span className="metric-label">Period Return %</span>
          <strong
            className={`metric-val ${isPositive ? "text-success" : "text-danger"}`}
          >
            {formatPercent(percentageChange)}
          </strong>
        </div>
      </div>

      {/* Snapshot Info Alert */}
      {collectionStartDate && (
        <div className="snapshot-notice">
          <i className="bi bi-info-circle-fill me-2"></i>
          Snapshot collection active since <strong>{collectionStartDate}</strong> ({dataPointsCount} daily record{dataPointsCount === 1 ? "" : "s"}).
        </div>
      )}

      {/* Chart Body */}
      <div className="chart-container-box">
        {loading ? (
          <div className="chart-loading-state">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>Fetching historical portfolio performance...</span>
          </div>
        ) : error ? (
          <div className="chart-error-state text-danger">
            <i className="bi bi-exclamation-triangle fs-3 mb-2"></i>
            <span>{error}</span>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="chart-empty-state">
            <i className="bi bi-graph-up fs-2 text-muted mb-2"></i>
            <strong>No snapshot history available yet</strong>
            <span className="text-muted">
              Snapshot recording has begun today. Further points will plot as daily valuations accumulate.
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={snapshots} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#00b386" : "#e53935"}
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#00b386" : "#e53935"}
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />

              <XAxis
                dataKey="date"
                stroke="#888"
                fontSize={12}
                tickLine={false}
              />

              <YAxis
                stroke="#888"
                fontSize={12}
                tickLine={false}
                domain={["auto", "auto"]}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="custom-chart-tooltip">
                      <strong>{data.date}</strong>
                      <div>
                        <span>Portfolio Value: </span>
                        <b>{formatCurrency(data.totalPortfolioValue)}</b>
                      </div>
                      <div>
                        <span>Holdings Value: </span>
                        <b>{formatCurrency(data.currentValue)}</b>
                      </div>
                      <div>
                        <span>Cash Balance: </span>
                        <b>{formatCurrency(data.cashBalance)}</b>
                      </div>
                      <div>
                        <span>Unrealized P&L: </span>
                        <b className={data.unrealizedPnl >= 0 ? "text-success" : "text-danger"}>
                          {data.unrealizedPnl >= 0 ? "+" : ""}
                          {formatCurrency(data.unrealizedPnl)}
                        </b>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type="monotone"
                dataKey="totalPortfolioValue"
                stroke={isPositive ? "#00b386" : "#e53935"}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPortfolio)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default PortfolioPerformanceChart;
