import "../styles/Holdings.css";
import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import TradePopup from "../components/TradePopup";
import SearchIcon from "@mui/icons-material/Search";
import {
  calculatePortfolioSummary,
  calculatePortfolioValues,
} from "../helpers/portfolioHelper.js";
import StockChartPopup from "../components/StockChartPopup";
import PortfolioAllocationChart from "../components/PortfolioAllocationChart";
function Holdings() {
  const {
    marketPrices = {},
    setIsTradePopupOpen,
    setSelectedStock,
    setCurrentStockMarketPrice,
    setStockType,
    holdings,
    holdingsError,
    isHoldingsLoading,
    isTradePopupOpen,
    setSelectedChartStock,
    isStockChartOpen,
    setIsStockChartOpen,
  } = useContext(AppContext);

  const [sortBy, setSortBy] = useState("default");
  const [searchTerm, setSearchTerm] = useState("");

  // Portfolio summary
  const portfolioSummary = calculatePortfolioSummary(holdings, marketPrices);

  const filteredHoldings = holdings.filter((holding) => {
    const searchValue = searchTerm.toLowerCase().trim();

    return (
      holding.symbol.toLowerCase().includes(searchValue) ||
      holding.companyName.toLowerCase().includes(searchValue)
    );
  });

  const filteredAndSortedHoldings = [...filteredHoldings].sort((a, b) => {
    if (sortBy === "name") {
      return a.symbol.localeCompare(b.symbol);
    }

    if (sortBy === "quantity") {
      return b.quantity - a.quantity;
    }

    if (sortBy === "profitLoss") {
      const aCurrentPrice =
        marketPrices[a.symbol]?.currentPrice ?? a.currentPrice;

      const bCurrentPrice =
        marketPrices[b.symbol]?.currentPrice ?? b.currentPrice;

      const aProfitLoss = (aCurrentPrice - a.averagePrice) * a.quantity;

      const bProfitLoss = (bCurrentPrice - b.averagePrice) * b.quantity;

      return bProfitLoss - aProfitLoss;
    }

    return 0;
  });

  return (
    <div className="dashboard-container">
      <div className="mb-4">
        <h4>Holdings</h4>
        <p className="text-muted">Your current stock holdings</p>
      </div>

      {/* Portfolio Summary */}
      <div className="positions-summary mt-3">
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
            {portfolioSummary.totalProfitLossPercent >= 0 ? "+" : ""}
            {portfolioSummary.totalProfitLossPercent.toFixed(2)}%
          </strong>
        </div>
      </div>
      <PortfolioAllocationChart holdings={holdings} />
      {/* Header */}
      <div className="dashboard-card d-flex justify-content-between align-items-center">
        <div className="dashboard-card-header" style={{ border: "none" }}>
          <h5>My Holdings</h5>
        </div>

        <div className="position-search-container">
          <SearchIcon className="position-search-icon" />

          <input
            type="text"
            className="position-search-input"
            placeholder="Search holdings..."
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

        <div className="me-4">
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

      {/* Holdings Table */}
      <div className="holding-table mt-3">
        <table className="table p-2">
          <thead>
            <tr>
              <th className="text-muted">Stock</th>
              <th className="text-muted">Product</th>
              <th className="text-muted">Qty</th>
              <th className="text-muted">Avg. Price</th>
              <th className="text-muted">LTP</th>
              <th className="text-muted">Invested</th>
              <th className="text-muted">Current</th>
              <th className="text-muted">P&L</th>
              <th className="text-muted">Day P&L</th>
              <th className="text-muted">P&L %</th>
              <th className="text-muted">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isHoldingsLoading && (
              <tr>
                <td colSpan="11" className="text-center text-muted">
                  Loading holdings...
                </td>
              </tr>
            )}

            {!isHoldingsLoading && holdingsError && (
              <tr>
                <td colSpan="11" className="text-center text-danger">
                  {holdingsError}
                </td>
              </tr>
            )}

            {!isHoldingsLoading &&
              !holdingsError &&
              filteredAndSortedHoldings.length === 0 && (
                <tr>
                  <td className="text-center text-muted" colSpan="11">
                    No holding found
                  </td>
                </tr>
              )}

            {filteredAndSortedHoldings.map((stock) => {
              const {
                currentPrice,
                investedValue,
                currentValue,
                profitLoss,
                dayProfitLoss,
                profitLossPercentage,
              } = calculatePortfolioValues(stock, marketPrices);

              return (
                <tr key={stock.symbol}>
                  <td className="text-muted">{stock.symbol}</td>

                  <td>
                    <span className="product-badge">{stock.product}</span>
                  </td>

                  <td>
                    <div>{stock.quantity}</div>

                    {stock.reservedQuantity > 0 && (
                      <small className="reserved-quantity">
                        {stock.quantity - stock.reservedQuantity} available
                      </small>
                    )}
                  </td>

                  <td className="text-muted">
                    ₹{stock.averagePrice.toLocaleString("en-IN")}
                  </td>

                  <td className="text-muted">
                    ₹{currentPrice.toLocaleString("en-IN")}
                  </td>

                  <td className="text-muted">
                    ₹{investedValue.toLocaleString("en-IN")}
                  </td>

                  <td className="text-muted">
                    ₹{currentValue.toLocaleString("en-IN")}
                  </td>

                  <td className="text-muted">
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

                  <td className="text-muted">
                    <span
                      className={
                        profitLoss >= 0 ? "text-success" : "text-danger"
                      }
                    >
                      {profitLoss >= 0 ? "+" : "-"}
                      {Math.abs(profitLossPercentage).toFixed(2)}%
                    </span>
                  </td>

                  <td>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => {
                        const marketData = marketPrices[stock.symbol];

                        setIsTradePopupOpen(true);
                        setSelectedStock(stock);
                        setCurrentStockMarketPrice(
                          marketData?.currentPrice ?? stock.currentPrice,
                        );
                        setStockType("buy");
                      }}
                    >
                      Buy
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        const marketData = marketPrices[stock.symbol];

                        setIsTradePopupOpen(true);
                        setSelectedStock(stock);
                        setCurrentStockMarketPrice(
                          marketData?.currentPrice ?? stock.currentPrice,
                        );
                        setStockType("sell");
                      }}
                    >
                      Sell
                    </button>
                    <button
                      className="btn btn-secondary btn-sm ms-2"
                      onClick={() => {
                        const marketData = marketPrices[stock.symbol];

                        const chartStock = {
                          symbol: stock.symbol,
                          companyName: stock.companyName,
                          currentPrice:
                            marketData?.currentPrice ?? stock.currentPrice,
                          previousClose:
                            marketData?.previousClose ?? stock.previousClose,
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
  );
}

export default Holdings;
