import { useContext, useEffect, useRef, useState } from "react";

import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { AppContext } from "../context/AppContext";

function WatchListActions({
  stock,
  isInWatchlist,
  onToggleWatchlist,
  onSetAlert,
}) {
  const {
    setSelectedStock,
    setStockType,
    setIsTradePopupOpen,
    setCurrentStockMarketPrice,
    setSelectedChartStock,
    setIsStockChartOpen,
    setSelectedDetailsStock,
    setIsStockDetailsOpen,
  } = useContext(AppContext);

  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

  const [isWatchlistUpdating, setIsWatchlistUpdating] = useState(false);

  const menuRef = useRef(null);

  // ==================================================
  // CLOSE MENU ON OUTSIDE CLICK
  // ==================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMoreOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // ==================================================
  // BUY
  // ==================================================

  const handleBuy = (event) => {
    event?.stopPropagation();

    setSelectedStock(stock);
    setCurrentStockMarketPrice(Number(stock.currentPrice || 0));
    setStockType("buy");
    setIsTradePopupOpen(true);

    setIsMoreOptionsOpen(false);
  };

  // ==================================================
  // SELL
  // ==================================================

  const handleSell = (event) => {
    event?.stopPropagation();

    setSelectedStock(stock);
    setCurrentStockMarketPrice(Number(stock.currentPrice || 0));
    setStockType("sell");
    setIsTradePopupOpen(true);

    setIsMoreOptionsOpen(false);
  };

  // ==================================================
  // CHART
  // ==================================================

  const handleChart = (event) => {
    event?.stopPropagation();

    setSelectedChartStock(stock);
    setIsStockChartOpen(true);

    setIsMoreOptionsOpen(false);
  };

  // ==================================================
  // DETAILS
  // ==================================================

  const handleStockDetails = (event) => {
    event?.stopPropagation();

    setSelectedDetailsStock(stock);
    setIsStockDetailsOpen(true);

    setIsMoreOptionsOpen(false);
  };

  // ==================================================
  // MORE
  // ==================================================

  const handleMoreClick = (event) => {
    event.stopPropagation();

    setIsMoreOptionsOpen((previous) => !previous);
  };

  // ==================================================
  // WATCHLIST
  // ==================================================

  const handleWatchlist = async (event) => {
    event.stopPropagation();

    if (isWatchlistUpdating) {
      return;
    }

    try {
      setIsWatchlistUpdating(true);

      const success = await onToggleWatchlist(stock);

      if (success) {
        setIsMoreOptionsOpen(false);
      }
    } catch (error) {
      console.error("Watchlist update failed:", error);
    } finally {
      setIsWatchlistUpdating(false);
    }
  };

  return (
    <div className="stock-actions" onClick={(event) => event.stopPropagation()}>
      {/* =========================================
          BUY
      ========================================= */}

      <button
        type="button"
        className="buy-button tooltip-btn"
        data-tooltip="Buy"
        onClick={handleBuy}
      >
        B
      </button>

      {/* =========================================
          SELL
      ========================================= */}

      <button
        type="button"
        className="sell-button tooltip-btn"
        data-tooltip="Sell"
        onClick={handleSell}
      >
        S
      </button>

      {/* =========================================
          CHART
      ========================================= */}

      <button
        type="button"
        className="chart-button tooltip-btn"
        data-tooltip="View Chart"
        onClick={handleChart}
      >
        <SignalCellularAltIcon />
      </button>

      {/* =========================================
          MORE
      ========================================= */}

      <div className="more-options-container" ref={menuRef}>
        <button
          type="button"
          className={`more-button tooltip-btn ${
            isMoreOptionsOpen ? "more-button-active" : ""
          }`}
          data-tooltip="More Options"
          onClick={handleMoreClick}
        >
          <MoreHorizIcon />
        </button>

        {/* =========================================
            MORE MENU
        ========================================= */}

        {isMoreOptionsOpen && (
          <div
            className="more-options-menu"
            onClick={(event) => event.stopPropagation()}
          >
            {/* BUY */}

            <button type="button" onClick={handleBuy}>
              <i className="bi bi-cart-plus"></i>
              <span>Buy</span>
            </button>

            {/* SELL */}

            <button type="button" onClick={handleSell}>
              <i className="bi bi-cart-dash"></i>
              <span>Sell</span>
            </button>

            {/* CHART */}

            <button type="button" onClick={handleChart}>
              <i className="bi bi-bar-chart"></i>
              <span>View Chart</span>
            </button>

            {/* DETAILS */}

            <button type="button" onClick={handleStockDetails}>
              <i className="bi bi-info-circle"></i>
              <span>Stock Details</span>
            </button>

            {/* PRICE ALERT */}
            {onSetAlert && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMoreOptionsOpen(false);
                  onSetAlert(stock);
                }}
              >
                <i className="bi bi-bell"></i>
                <span>Set Price Alert</span>
              </button>
            )}

            <div className="more-menu-divider"></div>

            {/* WATCHLIST */}

            <button
              type="button"
              onClick={handleWatchlist}
              disabled={isWatchlistUpdating}
              className={
                isInWatchlist
                  ? "watchlist-remove-option"
                  : "watchlist-add-option"
              }
            >
              {isWatchlistUpdating ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <i
                    className={isInWatchlist ? "bi bi-star-fill" : "bi bi-star"}
                  ></i>

                  <span>
                    {isInWatchlist
                      ? "Remove from Watchlist"
                      : "Add to Watchlist"}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default WatchListActions;
