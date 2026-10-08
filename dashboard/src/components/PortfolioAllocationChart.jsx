import { useState, useContext } from "react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { AppContext } from "../context/AppContext";
import StockDetailsPopup from "./StockDetailsPopup";

import "../styles/PortfolioAllocationChart.css";

const CHART_COLORS = [
  "#387ed1",
  "#ff8f00",
  "#00b386",
  "#e53935",
  "#8e44ad",
  "#16a085",
  "#f39c12",
  "#3498db",
  "#e74c3c",
  "#2ecc71",
];

function PortfolioAllocationChart({ holdings }) {
  const {
    marketPrices = {},
    setSelectedDetailsStock,
    setIsStockDetailsOpen,
    isStockDetailsOpen,
  } = useContext(AppContext);

  const [activeIndex, setActiveIndex] = useState(null);
  const [allocationType, setAllocationType] = useState("invested");
  const [chartView, setChartView] = useState("allocation");

  const [isOthersOpen, setIsOthersOpen] = useState(false);
  const [othersSearch, setOthersSearch] = useState("");
  const [othersSort, setOthersSort] = useState("value");

  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // --------------------------------
  // Empty State
  // --------------------------------

  if (!holdings || holdings.length === 0) {
    return (
      <div className="portfolio-allocation-chart">
        <h5>Portfolio Allocation</h5>

        <div className="portfolio-empty-state">
          <div className="portfolio-empty-icon">◯</div>

          <strong>No holdings available</strong>

          <span>
            Your portfolio allocation will appear here once you have holdings.
          </span>
        </div>
      </div>
    );
  }

  // --------------------------------
  // Helpers
  // --------------------------------

  const getCurrentPrice = (stock) => {
    const marketData = marketPrices[stock.symbol];

    return marketData?.currentPrice ?? stock.currentPrice ?? stock.averagePrice;
  };

  const getPreviousClose = (stock) => {
    const marketData = marketPrices[stock.symbol];

    return (
      marketData?.previousClose ?? stock.previousClose ?? getCurrentPrice(stock)
    );
  };

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  // --------------------------------
  // Prepare Holdings
  // --------------------------------

  const allocationStocks = holdings
    .map((stock) => {
      const currentPrice = getCurrentPrice(stock);
      const previousClose = getPreviousClose(stock);

      const investedValue = stock.averagePrice * stock.quantity;

      const currentValue = currentPrice * stock.quantity;

      const profitLoss = currentValue - investedValue;

      const profitLossPercentage =
        investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

      const dayProfitLoss = (currentPrice - previousClose) * stock.quantity;

      const dayProfitLossPercentage =
        previousClose > 0
          ? ((currentPrice - previousClose) / previousClose) * 100
          : 0;

      return {
        ...stock,
        currentPrice,
        previousClose,
        investedValue,
        currentValue,
        profitLoss,
        profitLossPercentage,
        dayProfitLoss,
        dayProfitLossPercentage,
      };
    })
    .sort((a, b) => {
      const valueA =
        allocationType === "invested" ? a.investedValue : a.currentValue;

      const valueB =
        allocationType === "invested" ? b.investedValue : b.currentValue;

      return valueB - valueA;
    });

  // --------------------------------
  // Portfolio Totals
  // --------------------------------

  const totalInvestment = allocationStocks.reduce(
    (total, stock) => total + stock.investedValue,
    0,
  );

  const totalCurrentValue = allocationStocks.reduce(
    (total, stock) => total + stock.currentValue,
    0,
  );

  const totalProfitLoss = totalCurrentValue - totalInvestment;

  const totalProfitLossPercentage =
    totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

  const totalDayProfitLoss = allocationStocks.reduce(
    (total, stock) => total + stock.dayProfitLoss,
    0,
  );

  const previousPortfolioValue = totalCurrentValue - totalDayProfitLoss;

  const totalDayProfitLossPercentage =
    previousPortfolioValue > 0
      ? (totalDayProfitLoss / previousPortfolioValue) * 100
      : 0;

  const displayedTotal =
    allocationType === "invested" ? totalInvestment : totalCurrentValue;

  // --------------------------------
  // Best / Worst Performer
  // --------------------------------

  const bestPerformer = allocationStocks.reduce(
    (best, stock) =>
      !best || stock.profitLossPercentage > best.profitLossPercentage
        ? stock
        : best,
    null,
  );

  const worstPerformer = allocationStocks.reduce(
    (worst, stock) =>
      !worst || stock.profitLossPercentage < worst.profitLossPercentage
        ? stock
        : worst,
    null,
  );

  // --------------------------------
  // Portfolio Concentration
  // --------------------------------

  const topHolding = allocationStocks[0];

  const topHoldingValue =
    allocationType === "invested"
      ? topHolding.investedValue
      : topHolding.currentValue;

  const topHoldingPercentage =
    displayedTotal > 0 ? (topHoldingValue / displayedTotal) * 100 : 0;

  const getConcentrationText = () => {
    if (topHoldingPercentage >= 50) {
      return "High concentration";
    }

    if (topHoldingPercentage >= 30) {
      return "Moderate concentration";
    }

    return "Well distributed";
  };

  // --------------------------------
  // Allocation Percentage
  // --------------------------------

  const getAllocationPercentage = (value) =>
    displayedTotal > 0 ? ((value / displayedTotal) * 100).toFixed(2) : "0.00";

  // --------------------------------
  // Top 3
  // --------------------------------

  const topThreeHoldings = allocationStocks.slice(0, 3);

  // --------------------------------
  // Top 5 + Others
  // --------------------------------

  const topStocks = allocationStocks.slice(0, 5);

  const remainingStocks = allocationStocks.slice(5);

  const othersValue = remainingStocks.reduce(
    (total, stock) =>
      total +
      (allocationType === "invested"
        ? stock.investedValue
        : stock.currentValue),
    0,
  );

  // --------------------------------
  // Allocation Chart Data
  // --------------------------------

  const allocationData = topStocks.map((stock) => ({
    name: stock.symbol,
    companyName: stock.companyName,
    value:
      allocationType === "invested" ? stock.investedValue : stock.currentValue,
    stock,
  }));

  if (othersValue > 0) {
    allocationData.push({
      name: "Others",
      companyName: `${remainingStocks.length} other holdings`,
      value: othersValue,
      stock: null,
    });
  }

  // --------------------------------
  // P&L Chart Data
  // --------------------------------
  // Pie chart cannot properly represent negative values.
  // Therefore absolute P&L is used only for chart size.
  // Actual P&L remains available inside stock.profitLoss.

  const pnlData = topStocks
    .filter((stock) => Math.abs(stock.profitLoss) > 0)
    .map((stock) => ({
      name: stock.symbol,
      companyName: stock.companyName,
      value: Math.abs(stock.profitLoss),
      stock,
    }));

  if (remainingStocks.length > 0) {
    const othersProfitLoss = remainingStocks.reduce(
      (total, stock) => total + stock.profitLoss,
      0,
    );

    if (Math.abs(othersProfitLoss) > 0) {
      pnlData.push({
        name: "Others",
        companyName: `${remainingStocks.length} other holdings`,
        value: Math.abs(othersProfitLoss),
        stock: null,
        actualProfitLoss: othersProfitLoss,
      });
    }
  }

  const activeChartData = chartView === "allocation" ? allocationData : pnlData;

  // --------------------------------
  // Stock Details
  // --------------------------------

  const openStockDetails = (stock) => {
    const detailsStock = {
      symbol: stock.symbol,
      companyName: stock.companyName,
      currentPrice: stock.currentPrice,
      previousClose: stock.previousClose,
    };

    setSelectedDetailsStock(detailsStock);
    setIsStockDetailsOpen(true);
  };

  // --------------------------------
  // Slice Click
  // --------------------------------

  const handleSliceClick = (_, index) => {
    const selectedData = activeChartData[index];

    if (!selectedData) {
      return;
    }

    if (!selectedData.stock) {
      setIsOthersOpen(true);
      return;
    }

    openStockDetails(selectedData.stock);
  };

  // --------------------------------
  // Others Search + Sort
  // --------------------------------

  const filteredOthers = remainingStocks
    .filter((stock) => {
      const search = othersSearch.trim().toLowerCase();

      if (!search) {
        return true;
      }

      return (
        stock.symbol.toLowerCase().includes(search) ||
        stock.companyName.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      if (othersSort === "value") {
        return b.currentValue - a.currentValue;
      }

      if (othersSort === "pnl") {
        return b.profitLoss - a.profitLoss;
      }

      if (othersSort === "allocation") {
        return b.currentValue - a.currentValue;
      }

      return 0;
    });

  return (
    <>
      <div className="portfolio-allocation-chart">
        {/* ================= HEADER ================= */}

        <div className="portfolio-allocation-header">
          <div className="portfolio-allocation-title">
            <div>
              <h5>Portfolio Allocation</h5>

              <span>
                {holdings.length}{" "}
                {holdings.length === 1 ? "Holding" : "Holdings"}
              </span>
            </div>
          </div>

          <div className="allocation-toggle">
            <button
              type="button"
              className={allocationType === "invested" ? "active" : ""}
              onClick={() => setAllocationType("invested")}
            >
              Invested
            </button>

            <button
              type="button"
              className={allocationType === "current" ? "active" : ""}
              onClick={() => setAllocationType("current")}
            >
              Current
            </button>
          </div>
        </div>

        {/* ================= CHART VIEW ================= */}

        <div className="portfolio-chart-view-toggle">
          <button
            type="button"
            className={chartView === "allocation" ? "active" : ""}
            onClick={() => setChartView("allocation")}
          >
            Allocation
          </button>

          <button
            type="button"
            className={chartView === "pnl" ? "active" : ""}
            onClick={() => setChartView("pnl")}
          >
            P&L
          </button>
        </div>

        {/* ================= CHART ================= */}

        <div className="portfolio-chart-wrapper">
          <div className="portfolio-donut-container">
            <ResponsiveContainer width="100%" height={340}>
              <PieChart>
                <Pie
                  data={activeChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={108}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                  activeIndex={activeIndex}
                  activeShape={{
                    outerRadius: 118,
                  }}
                  isAnimationActive={true}
                  animationDuration={700}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={handleSliceClick}
                >
                  {activeChartData.map((item, index) => (
                    <Cell
                      key={`${item.name}-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      cursor="pointer"
                    />
                  ))}
                </Pie>

                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) {
                      return null;
                    }

                    const data = payload[0].payload;

                    const stock = data.stock;

                    // Others
                    if (!stock) {
                      const actualPnl = data.actualProfitLoss ?? data.value;

                      return (
                        <div className="portfolio-custom-tooltip">
                          <strong>Others</strong>

                          <span>{data.companyName}</span>

                          {chartView === "allocation" ? (
                            <b>{formatCurrency(data.value)}</b>
                          ) : (
                            <b
                              className={
                                actualPnl >= 0 ? "text-success" : "text-danger"
                              }
                            >
                              {actualPnl >= 0 ? "+" : ""}
                              {formatCurrency(actualPnl)}
                            </b>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="portfolio-custom-tooltip">
                        <strong>{stock.symbol}</strong>

                        <span>{stock.companyName}</span>

                        <div>
                          <small>Quantity</small>
                          <b>{stock.quantity}</b>
                        </div>

                        <div>
                          <small>Average Price</small>
                          <b>{formatCurrency(stock.averagePrice)}</b>
                        </div>

                        <div>
                          <small>Current Price</small>
                          <b>{formatCurrency(stock.currentPrice)}</b>
                        </div>

                        {chartView === "allocation" ? (
                          <div>
                            <small>Allocation</small>

                            <b>{getAllocationPercentage(data.value)}%</b>
                          </div>
                        ) : (
                          <div>
                            <small>P&L</small>

                            <b
                              className={
                                stock.profitLoss >= 0
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {stock.profitLoss >= 0 ? "+" : ""}
                              {formatCurrency(stock.profitLoss)}
                            </b>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  height={45}
                  formatter={(value) => (
                    <span className="portfolio-legend-text">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* ================= CENTER ================= */}

            <div className="portfolio-chart-center">
              <strong>{formatCurrency(displayedTotal)}</strong>

              <span>
                {allocationType === "invested" ? "Invested" : "Current Value"}
              </span>

              <div
                className={
                  totalProfitLoss >= 0
                    ? "portfolio-center-profit profit"
                    : "portfolio-center-profit loss"
                }
              >
                {totalProfitLoss >= 0 ? "+" : ""}
                {formatCurrency(totalProfitLoss)} (
                {totalProfitLossPercentage >= 0 ? "+" : ""}
                {totalProfitLossPercentage.toFixed(2)}
                %)
              </div>
            </div>
          </div>
        </div>

        {/* ================= DAY P&L ================= */}

        <div className="portfolio-day-pnl">
          <div>
            <span>Today's P&L</span>

            <strong
              className={
                totalDayProfitLoss >= 0 ? "text-success" : "text-danger"
              }
            >
              {totalDayProfitLoss >= 0 ? "+" : ""}
              {formatCurrency(totalDayProfitLoss)}
            </strong>
          </div>

          <span
            className={totalDayProfitLoss >= 0 ? "text-success" : "text-danger"}
          >
            {totalDayProfitLoss >= 0 ? "+" : ""}
            {totalDayProfitLossPercentage.toFixed(2)}%
          </span>
        </div>

        {/* ================= SUMMARY ================= */}

        <div className="portfolio-allocation-summary">
          <div className="portfolio-summary-item">
            <span>Total Investment</span>
            <strong>{formatCurrency(totalInvestment)}</strong>
          </div>

          <div className="portfolio-summary-item">
            <span>Current Value</span>
            <strong>{formatCurrency(totalCurrentValue)}</strong>
          </div>

          <div className="portfolio-summary-item">
            <span>Total P&L</span>

            <strong
              className={totalProfitLoss >= 0 ? "text-success" : "text-danger"}
            >
              {totalProfitLoss >= 0 ? "+" : ""}
              {formatCurrency(totalProfitLoss)}
            </strong>
          </div>

          <div className="portfolio-summary-item">
            <span>Return</span>

            <strong
              className={
                totalProfitLossPercentage >= 0 ? "text-success" : "text-danger"
              }
            >
              {totalProfitLossPercentage >= 0 ? "+" : ""}
              {totalProfitLossPercentage.toFixed(2)}%
            </strong>
          </div>
        </div>

        {/* ================= BEST / WORST ================= */}

        {bestPerformer && worstPerformer && (
          <div className="portfolio-performance-section">
            <div className="portfolio-performance-card best">
              <div className="portfolio-performance-icon">🏆</div>

              <div className="portfolio-performance-info">
                <span>Best Performer</span>

                <strong>{bestPerformer.symbol}</strong>

                <small>{bestPerformer.companyName}</small>
              </div>

              <div className="portfolio-performance-value">
                <strong>
                  {bestPerformer.profitLoss >= 0 ? "+" : ""}
                  {formatCurrency(bestPerformer.profitLoss)}
                </strong>

                <span
                  className={
                    bestPerformer.profitLossPercentage >= 0
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {bestPerformer.profitLossPercentage >= 0 ? "+" : ""}
                  {bestPerformer.profitLossPercentage.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="portfolio-performance-card worst">
              <div className="portfolio-performance-icon">📉</div>

              <div className="portfolio-performance-info">
                <span>Worst Performer</span>

                <strong>{worstPerformer.symbol}</strong>

                <small>{worstPerformer.companyName}</small>
              </div>

              <div className="portfolio-performance-value">
                <strong>
                  {worstPerformer.profitLoss >= 0 ? "+" : ""}
                  {formatCurrency(worstPerformer.profitLoss)}
                </strong>

                <span
                  className={
                    worstPerformer.profitLossPercentage >= 0
                      ? "text-success"
                      : "text-danger"
                  }
                >
                  {worstPerformer.profitLossPercentage >= 0 ? "+" : ""}
                  {worstPerformer.profitLossPercentage.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= CONCENTRATION ================= */}

        <div className="portfolio-concentration-section">
          <div className="portfolio-concentration-header">
            <div>
              <span>Portfolio Concentration</span>

              <strong>{topHolding.symbol}</strong>
            </div>

            <div className="portfolio-concentration-percentage">
              {topHoldingPercentage.toFixed(2)}%
            </div>
          </div>

          <div className="portfolio-concentration-bar">
            <div
              className="portfolio-concentration-progress"
              style={{
                width: `${Math.min(topHoldingPercentage, 100)}%`,
              }}
            />
          </div>

          <div className="portfolio-concentration-footer">
            <span>{getConcentrationText()}</span>

            <small>Largest holding: {topHolding.companyName}</small>
          </div>
        </div>

        {/* ================= TOP 3 ================= */}

        <div className="top-three-section">
          <div className="top-three-header">
            <span>Top Holdings</span>
            <small>By portfolio value</small>
          </div>

          <div className="top-three-list">
            {topThreeHoldings.map((stock, index) => {
              const value =
                allocationType === "invested"
                  ? stock.investedValue
                  : stock.currentValue;

              return (
                <button
                  type="button"
                  className="top-three-item"
                  key={stock.symbol}
                  onClick={() => openStockDetails(stock)}
                >
                  <div className="top-three-rank">#{index + 1}</div>

                  <div className="top-three-info">
                    <strong>{stock.symbol}</strong>
                    <small>{stock.companyName}</small>
                  </div>

                  <div className="top-three-value">
                    <strong>{formatCurrency(value)}</strong>

                    <span>{getAllocationPercentage(value)}%</span>
                  </div>

                  <div
                    className={
                      stock.profitLoss >= 0
                        ? "top-three-pnl profit"
                        : "top-three-pnl loss"
                    }
                  >
                    {stock.profitLoss >= 0 ? "+" : ""}
                    {stock.profitLossPercentage.toFixed(2)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= TOP HOLDING ================= */}

        <div className="top-holding">
          <div>
            <span>Top Holding</span>

            <strong>{topHolding.symbol}</strong>

            <small>{topHolding.companyName}</small>
          </div>

          <div className="top-holding-value">
            <span>Allocation</span>

            <strong>{getAllocationPercentage(topHoldingValue)}%</strong>
          </div>
        </div>

        {/* ================= BREAKDOWN BUTTON ================= */}

        <button
          type="button"
          className="portfolio-breakdown-button"
          onClick={() => setIsBreakdownOpen((previous) => !previous)}
        >
          <span>
            {isBreakdownOpen
              ? "Hide Portfolio Breakdown"
              : "View Full Portfolio Breakdown"}
          </span>

          <span>{isBreakdownOpen ? "▲" : "▼"}</span>
        </button>

        {/* ================= FULL BREAKDOWN ================= */}

        {isBreakdownOpen && (
          <div className="portfolio-breakdown-section">
            <div className="portfolio-breakdown-header">
              <div>
                <strong>Full Portfolio Breakdown</strong>

                <span>All {holdings.length} holdings</span>
              </div>
            </div>

            <div className="portfolio-breakdown-table-wrapper">
              <table className="portfolio-breakdown-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Allocation</th>
                    <th>Invested</th>
                    <th>Current</th>
                    <th>P&L</th>
                    <th>Day P&L</th>
                  </tr>
                </thead>

                <tbody>
                  {allocationStocks.map((stock) => {
                    const allocationValue =
                      allocationType === "invested"
                        ? stock.investedValue
                        : stock.currentValue;

                    return (
                      <tr
                        key={stock.symbol}
                        onClick={() => openStockDetails(stock)}
                      >
                        <td>
                          <div className="breakdown-stock">
                            <strong>{stock.symbol}</strong>

                            <small>{stock.companyName}</small>
                          </div>
                        </td>

                        <td>
                          <strong>
                            {getAllocationPercentage(allocationValue)}%
                          </strong>
                        </td>

                        <td>{formatCurrency(stock.investedValue)}</td>

                        <td>{formatCurrency(stock.currentValue)}</td>

                        <td>
                          <div
                            className={
                              stock.profitLoss >= 0
                                ? "breakdown-profit profit"
                                : "breakdown-profit loss"
                            }
                          >
                            <strong>
                              {stock.profitLoss >= 0 ? "+" : ""}
                              {formatCurrency(stock.profitLoss)}
                            </strong>

                            <small>
                              {stock.profitLossPercentage >= 0 ? "+" : ""}
                              {stock.profitLossPercentage.toFixed(2)}%
                            </small>
                          </div>
                        </td>

                        <td>
                          <div
                            className={
                              stock.dayProfitLoss >= 0
                                ? "breakdown-profit profit"
                                : "breakdown-profit loss"
                            }
                          >
                            <strong>
                              {stock.dayProfitLoss >= 0 ? "+" : ""}
                              {formatCurrency(stock.dayProfitLoss)}
                            </strong>

                            <small>
                              {stock.dayProfitLossPercentage >= 0 ? "+" : ""}
                              {stock.dayProfitLossPercentage.toFixed(2)}%
                            </small>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= HINT ================= */}

        <div className="portfolio-chart-hint">
          Click a stock slice to view stock details
        </div>
      </div>

      {/* ================= OTHERS POPUP ================= */}

      {isOthersOpen && (
        <div
          className="portfolio-others-overlay"
          onClick={() => setIsOthersOpen(false)}
        >
          <div
            className="portfolio-others-popup"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="portfolio-others-header">
              <div>
                <h5>Other Holdings</h5>

                <span>{remainingStocks.length} holdings</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOthersOpen(false);
                  setOthersSearch("");
                }}
              >
                ×
              </button>
            </div>

            <div className="portfolio-others-search">
              <input
                type="text"
                value={othersSearch}
                onChange={(event) => setOthersSearch(event.target.value)}
                placeholder="Search holdings..."
              />
            </div>

            <div className="portfolio-others-sort">
              <span>Sort by</span>

              <select
                value={othersSort}
                onChange={(event) => setOthersSort(event.target.value)}
              >
                <option value="value">Value</option>
                <option value="pnl">P&L</option>
                <option value="allocation">Allocation</option>
              </select>
            </div>

            <div className="portfolio-others-list">
              {filteredOthers.length === 0 ? (
                <div className="portfolio-no-results">No holdings found</div>
              ) : (
                filteredOthers.map((stock) => {
                  const allocationValue =
                    allocationType === "invested"
                      ? stock.investedValue
                      : stock.currentValue;

                  const percentage = getAllocationPercentage(allocationValue);

                  return (
                    <button
                      type="button"
                      className="portfolio-other-stock"
                      key={stock.symbol}
                      onClick={() => openStockDetails(stock)}
                    >
                      <div className="portfolio-other-stock-left">
                        <span
                          className="portfolio-other-color"
                          style={{
                            backgroundColor:
                              CHART_COLORS[
                                remainingStocks.indexOf(stock) %
                                  CHART_COLORS.length
                              ],
                          }}
                        />

                        <div>
                          <strong>{stock.symbol}</strong>

                          <small>{stock.companyName}</small>
                        </div>
                      </div>

                      <div className="portfolio-other-stock-right">
                        <strong>{formatCurrency(allocationValue)}</strong>

                        <span>{percentage}%</span>

                        <small
                          className={
                            stock.profitLoss >= 0
                              ? "text-success"
                              : "text-danger"
                          }
                        >
                          {stock.profitLoss >= 0 ? "+" : ""}
                          {formatCurrency(stock.profitLoss)}
                        </small>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= STOCK DETAILS ================= */}

      {isStockDetailsOpen && <StockDetailsPopup />}
    </>
  );
}

export default PortfolioAllocationChart;
