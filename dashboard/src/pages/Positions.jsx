import React, { useContext, useEffect, useState } from "react";
import "../styles/Positions.css";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import TradePopup from "../components/TradePopup";
import StockChartPopup from "../components/StockChartPopup";
import SearchIcon from "@mui/icons-material/Search";
import {
  calculatePortfolioSummary,
  calculatePortfolioValues,
} from "../helpers/portfolioHelper.js";

function Positions() {
  const {
    marketPrices = {},
    setIsTradePopupOpen,
    isTradePopupOpen,
    setSelectedStock,
    setCurrentStockMarketPrice,
    setStockType,
    positionVersion,
    orderVersion,
    setIsExitMode,
    setSelectedChartStock,
    setIsStockChartOpen,
    isStockChartOpen,
  } = useContext(AppContext);

  const [positionsData, setPositionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage("");

    axios
      .get("http://localhost:3000/api/positions", { withCredentials: true })
      .then((res) => {
        setPositionsData(res.data);
      })
      .catch((err) => {
        setErrorMessage(
          err.response?.data?.message || "Unable to process request",
        );

        console.log("error in position component in useEffect");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [positionVersion, orderVersion]);

  // Portfolio summary
  const portfolioSummary = calculatePortfolioSummary(
    positionsData,
    marketPrices,
  );

  const filteredPositions = positionsData.filter((position) => {
    const searchValue = searchTerm.toLowerCase().trim();
    const symbol = String(position?.symbol ?? "").toLowerCase();
    const companyName = String(position?.companyName ?? "").toLowerCase();

    return (
      symbol.includes(searchValue) || companyName.includes(searchValue)
    );
  });

  const filteredAndSortedPositions = [...filteredPositions].sort((a, b) => {
    if (sortBy === "name") {
      return a.symbol.localeCompare(b.symbol);
    }

    if (sortBy === "quantity") {
      return b.quantity - a.quantity;
    }

    if (sortBy === "profitLoss") {
      const aValues = calculatePortfolioValues(a, marketPrices);
      const bValues = calculatePortfolioValues(b, marketPrices);

      return bValues.profitLoss - aValues.profitLoss;
    }

    return 0;
  });

  return (
    <div className="dashboard-container">
      <div className="positions-summary">
        <div className="summary-card">
          <span>Total Invested</span>

          <strong>
            ₹{portfolioSummary.totalInvestment.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="summary-card">
          <span>Current Value</span>

          <strong>
            ₹{portfolioSummary.currentValue.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="summary-card">
          <span>Total P&L</span>

          <strong
            className={
              portfolioSummary.totalProfitLoss >= 0
                ? "text-success"
                : "text-danger"
            }
          >
            {portfolioSummary.totalProfitLoss >= 0 ? "+" : "-"}₹
            {Math.abs(portfolioSummary.totalProfitLoss).toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="summary-card">
          <span>Day P&L</span>

          <strong
            className={
              portfolioSummary.totalDayProfitLoss >= 0
                ? "text-success"
                : "text-danger"
            }
          >
            {portfolioSummary.totalDayProfitLoss >= 0 ? "+" : "-"}₹
            {Math.abs(portfolioSummary.totalDayProfitLoss).toFixed(2)}
          </strong>
        </div>

        <div className="summary-card">
          <span>Total P&L %</span>

          <strong
            className={
              portfolioSummary.totalProfitLossPercent >= 0
                ? "text-success"
                : "text-danger"
            }
          >
            {portfolioSummary.totalProfitLossPercent >= 0 ? "+" : "-"}
            {Math.abs(portfolioSummary.totalProfitLossPercent).toFixed(2)}%
          </strong>
        </div>
      </div>

      <div className="position-table dashboard-card mt-5">
        <div className="dashboard-card-header">
          <div className="w-100">
            {errorMessage && (
              <div className="alert alert-danger orders-error-message">
                {errorMessage}
              </div>
            )}

            <div className="d-flex justify-content-between">
              <h5 className="mt-1" style={{ fontSize: "1.3rem" }}>
                Positions
              </h5>

              <div className="position-search-container">
                <SearchIcon className="position-search-icon" />

                <input
                  type="text"
                  className="position-search-input"
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                />

                {searchTerm && (
                  <button
                    type="button"
                    className="clear-position-search"
                    onClick={() => setSearchTerm("")}
                  >
                    ×
                  </button>
                )}
              </div>

              <div>
                <select
                  value={sortBy}
                  className="form-select position-sort-dropdown"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="default">Sort by</option>
                  <option value="name">Name</option>
                  <option value="quantity">Quantity</option>
                  <option value="profitLoss">Profit/Loss</option>
                </select>
              </div>
            </div>

            <small className="text-muted">Your open trading positions</small>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table holdings-table align-middle mb-0">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Product</th>
                <th>Qty.</th>
                <th>Avg. Price</th>
                <th>LTP</th>
                <th>Invested</th>
                <th>Current Value</th>
                <th>P&L</th>
                <th>Day P&L</th>
                <th>P&L %</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="11" className="text-center text-muted">
                    Loading positions...
                  </td>
                </tr>
              )}

              {!isLoading &&
                !errorMessage &&
                filteredAndSortedPositions.length === 0 && (
                  <tr>
                    <td colSpan="11" className="text-center text-muted">
                      No position found
                    </td>
                  </tr>
                )}

              {filteredAndSortedPositions.map((position) => {
                const {
                  currentPrice,
                  investedValue,
                  currentValue,
                  profitLoss,
                  dayProfitLoss,
                  profitLossPercentage,
                } = calculatePortfolioValues(position, marketPrices);

                return (
                  <tr key={position._id}>
                    <td>
                      <div className="company-name">{position.symbol}</div>
                    </td>

                    <td>
                      <span className="product-badge">{position.product}</span>
                    </td>

                    <td>
                      <div>{position.quantity}</div>

                      {position.reservedQuantity > 0 && (
                        <small className="reserved-quantity">
                          {position.quantity - position.reservedQuantity}{" "}
                          available
                        </small>
                      )}
                    </td>

                    <td>₹{position.averagePrice.toLocaleString("en-IN")}</td>

                    <td>₹{currentPrice.toLocaleString("en-IN")}</td>

                    <td>₹{investedValue.toLocaleString("en-IN")}</td>

                    <td>₹{currentValue.toLocaleString("en-IN")}</td>

                    <td>
                      <span
                        className={
                          profitLoss >= 0 ? "text-success" : "text-danger"
                        }
                      >
                        {profitLoss >= 0 ? "+" : "-"}₹
                        {Math.abs(profitLoss).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td
                      className={
                        dayProfitLoss >= 0 ? "text-success" : "text-danger"
                      }
                    >
                      {dayProfitLoss >= 0 ? "+" : "-"}₹
                      {Math.abs(dayProfitLoss).toFixed(2)}
                    </td>

                    <td>
                      <span
                        className={
                          profitLossPercentage >= 0
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        {profitLossPercentage >= 0 ? "+" : "-"}
                        {Math.abs(profitLossPercentage).toFixed(2)}%
                      </span>
                    </td>

                    <td>
                      {/* Buy */}
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => {
                          const marketData = marketPrices[position.symbol];

                          setIsTradePopupOpen(true);
                          setSelectedStock(position);

                          setCurrentStockMarketPrice(
                            marketData?.currentPrice ?? position.currentPrice,
                          );

                          setStockType("buy");
                        }}
                      >
                        Buy
                      </button>

                      {/* Sell */}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          const marketData = marketPrices[position.symbol];

                          setIsTradePopupOpen(true);
                          setSelectedStock(position);

                          setCurrentStockMarketPrice(
                            marketData?.currentPrice ?? position.currentPrice,
                          );

                          setStockType("sell");
                          setIsExitMode(false);
                        }}
                      >
                        Sell
                      </button>

                      {/* Exit */}
                      <button
                        className="btn btn-warning btn-sm ms-2"
                        onClick={() => {
                          const marketData = marketPrices[position.symbol];

                          setIsTradePopupOpen(true);
                          setSelectedStock(position);

                          setCurrentStockMarketPrice(
                            marketData?.currentPrice ?? position.currentPrice,
                          );

                          setIsExitMode(true);
                          setStockType("sell");
                        }}
                      >
                        Exit
                      </button>

                      {/* Chart */}
                      <button
                        className="btn btn-secondary btn-sm ms-2"
                        onClick={() => {
                          const marketData = marketPrices[position.symbol];

                          const chartStock = {
                            symbol: position.symbol,
                            companyName: position.companyName,
                            currentPrice:
                              marketData?.currentPrice ?? position.currentPrice,
                            previousClose:
                              marketData?.previousClose ??
                              position.previousClose,
                          };

                          setSelectedChartStock(chartStock);
                          setIsStockChartOpen(true);
                        }}
                      >
                        Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {isTradePopupOpen && <TradePopup />}

          {isStockChartOpen && <StockChartPopup />}
        </div>
      </div>
    </div>
  );
}

export default Positions;
