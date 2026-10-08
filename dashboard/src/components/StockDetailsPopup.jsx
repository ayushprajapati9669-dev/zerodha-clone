import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import "../styles/StockDetailsPopup.css";

function StockDetailsPopup() {
  const {
    selectedDetailsStock,
    setIsStockDetailsOpen,
    setSelectedStock,
    setStockType,
    setIsTradePopupOpen,
    setCurrentStockMarketPrice,
    setSelectedChartStock,
    setIsStockChartOpen,
  } = useContext(AppContext);

  if (!selectedDetailsStock) {
    return null;
  }

  const { symbol, companyName, currentPrice, previousClose } =
    selectedDetailsStock;

  const priceChange = currentPrice - previousClose;

  const priceChangePercentage =
    previousClose > 0 ? (priceChange / previousClose) * 100 : 0;

  const handleClose = () => {
    setIsStockDetailsOpen(false);
  };

  const handleBuy = () => {
    setSelectedStock(selectedDetailsStock);
    setCurrentStockMarketPrice(currentPrice);
    setStockType("buy");

    setIsStockDetailsOpen(false);
    setIsTradePopupOpen(true);
  };

  const handleSell = () => {
    setSelectedStock(selectedDetailsStock);
    setCurrentStockMarketPrice(currentPrice);
    setStockType("sell");

    setIsStockDetailsOpen(false);
    setIsTradePopupOpen(true);
  };

  const handleChart = () => {
    setSelectedChartStock(selectedDetailsStock);

    setIsStockDetailsOpen(false);
    setIsStockChartOpen(true);
  };

  return (
    <div className="stock-details-overlay">
      <div className="stock-details-popup">
        <div className="stock-details-header">
          <div>
            <h5>{symbol}</h5>
            <small>{companyName}</small>
          </div>

          <button
            type="button"
            className="stock-details-close"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        <div className="stock-details-price">
          <strong>₹{currentPrice.toLocaleString("en-IN")}</strong>

          <span className={priceChange >= 0 ? "text-success" : "text-danger"}>
            {priceChange >= 0 ? "+" : ""}₹{priceChange.toFixed(2)} (
            {priceChange >= 0 ? "+" : ""}
            {priceChangePercentage.toFixed(2)}%)
          </span>
        </div>

        <div className="stock-details-info">
          <div className="stock-detail-item">
            <span>Symbol</span>
            <strong>{symbol}</strong>
          </div>

          <div className="stock-detail-item">
            <span>Company</span>
            <strong>{companyName}</strong>
          </div>

          <div className="stock-detail-item">
            <span>Current Price</span>
            <strong>₹{currentPrice.toLocaleString("en-IN")}</strong>
          </div>

          <div className="stock-detail-item">
            <span>Previous Close</span>
            <strong>₹{previousClose.toLocaleString("en-IN")}</strong>
          </div>

          <div className="stock-detail-item">
            <span>Change</span>
            <strong
              className={priceChange >= 0 ? "text-success" : "text-danger"}
            >
              {priceChange >= 0 ? "+" : ""}₹{priceChange.toFixed(2)}
            </strong>
          </div>

          <div className="stock-detail-item">
            <span>Change %</span>
            <strong
              className={priceChange >= 0 ? "text-success" : "text-danger"}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChangePercentage.toFixed(2)}%
            </strong>
          </div>
        </div>

        <div className="stock-details-actions">
          <button
            type="button"
            className="stock-details-buy"
            onClick={handleBuy}
          >
            Buy
          </button>

          <button
            type="button"
            className="stock-details-sell"
            onClick={handleSell}
          >
            Sell
          </button>

          <button
            type="button"
            className="stock-details-chart"
            onClick={handleChart}
          >
            View Chart
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockDetailsPopup;
