import { useContext, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";

import { AppContext } from "../context/AppContext";
import "../styles/StockSelectionPopup.css";

function StockSelectionPopup() {
  const {
    marketPrices = {},
    quickTradeType,
    setIsStockSelectionPopupOpen,
    setSelectedStock,
    setCurrentStockMarketPrice,
    setStockType,
    setIsTradePopupOpen,
  } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState("");

  const stocks = Object.values(marketPrices);

  const filteredStocks = stocks.filter((stock) => {
    const searchValue = searchTerm.toLowerCase().trim();

    return (
      stock.symbol.toLowerCase().includes(searchValue) ||
      stock.companyName.toLowerCase().includes(searchValue)
    );
  });

  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setCurrentStockMarketPrice(stock.currentPrice);
    setStockType(quickTradeType);

    setIsStockSelectionPopupOpen(false);
    setIsTradePopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsStockSelectionPopupOpen(false);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="stock-selection-overlay">
      <div className="stock-selection-popup">
        {/* Header */}
        <div className="stock-selection-header">
          <div>
            <h5>{quickTradeType === "buy" ? "Buy Stock" : "Sell Stock"}</h5>

            <small className="text-muted">Select a stock to continue</small>
          </div>

          <button
            type="button"
            className="stock-selection-close"
            onClick={handleClosePopup}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="stock-selection-search">
          <SearchIcon className="stock-selection-search-icon" />

          <input
            type="text"
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchTerm && (
            <button
              type="button"
              className="stock-selection-clear"
              onClick={handleClearSearch}
            >
              ×
            </button>
          )}
        </div>

        {/* Stock List */}
        <div className="stock-selection-list">
          {filteredStocks.map((stock) => {
            const priceChange = stock.currentPrice - stock.previousClose;

            const isPositive = priceChange >= 0;

            return (
              <button
                key={stock.symbol}
                type="button"
                className="stock-selection-item"
                onClick={() => handleStockSelect(stock)}
              >
                <div className="stock-selection-information">
                  <strong>{stock.symbol}</strong>
                  <small>{stock.companyName}</small>
                </div>

                <div className="stock-selection-price">
                  <strong>₹{stock.currentPrice.toLocaleString("en-IN")}</strong>

                  <small
                    className={isPositive ? "text-success" : "text-danger"}
                  >
                    {isPositive ? "+" : "-"}₹{Math.abs(priceChange).toFixed(2)}
                  </small>
                </div>
              </button>
            );
          })}

          {filteredStocks.length === 0 && (
            <div className="text-center text-muted py-4">No stock found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockSelectionPopup;
