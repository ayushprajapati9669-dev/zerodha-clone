import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";

import { AppContext } from "../context/AppContext";
import WatchListActions from "./WatchListActions";
import TradePopup from "./TradePopup";

import "../styles/WatchList.css";

function MarketWatchlist() {
  const [searchTerm, setSearchTerm] = useState("");
  const [watchlist, setWatchlist] = useState([]);

  const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState("");

  const {
    isTradePopupOpen,
    marketPrices = {},
    isMarketPricesLoading,
    marketPricesError,
    fetchMarketPrices,
  } = useContext(AppContext);

  // ==================================================
  // ALL MARKET STOCKS
  // ==================================================

  const stocks = useMemo(() => {
    return Object.values(marketPrices);
  }, [marketPrices]);

  // ==================================================
  // FETCH WATCHLIST
  // ==================================================

  const fetchWatchlist = async () => {
    try {
      setIsWatchlistLoading(true);
      setWatchlistError("");

      const response = await axios.get("http://localhost:3000/api/watchlist", {
        withCredentials: true,
      });

      setWatchlist(response.data?.watchlist || []);
    } catch (error) {
      console.error("Failed to fetch watchlist:", error);

      setWatchlistError(
        error.response?.data?.message || "Failed to load watchlist",
      );
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  // ==================================================
  // WATCHLIST SYMBOLS
  // ==================================================

  const watchlistSymbols = useMemo(() => {
    return new Set(
      watchlist.map((item) => item.symbol?.toUpperCase()).filter(Boolean),
    );
  }, [watchlist]);

  // ==================================================
  // ADD / REMOVE WATCHLIST
  // ==================================================

  const handleToggleWatchlist = async (stock) => {
    if (!stock?.symbol) {
      return false;
    }

    const symbol = stock.symbol.toUpperCase();

    const isAlreadyInWatchlist = watchlistSymbols.has(symbol);

    try {
      setWatchlistError("");

      // ==================================================
      // REMOVE
      // ==================================================

      if (isAlreadyInWatchlist) {
        await axios.delete(
          `http://localhost:3000/api/watchlist/${encodeURIComponent(symbol)}`,
          {
            withCredentials: true,
          },
        );

        setWatchlist((previous) =>
          previous.filter((item) => item.symbol?.toUpperCase() !== symbol),
        );

        return true;
      }

      // ==================================================
      // ADD
      // ==================================================

      const response = await axios.post(
        "http://localhost:3000/api/watchlist",
        {
          symbol,
          companyName: stock.companyName,
        },
        {
          withCredentials: true,
        },
      );

      const newWatchlistItem = response.data?.watchlistItem;

      if (newWatchlistItem) {
        setWatchlist((previous) => [...previous, newWatchlistItem]);
      } else {
        setWatchlist((previous) => [
          ...previous,
          {
            symbol,
            companyName: stock.companyName,
          },
        ]);
      }

      return true;
    } catch (error) {
      console.error("Watchlist update failed:", error.response?.data || error);

      setWatchlistError(
        error.response?.data?.message || "Failed to update watchlist",
      );

      return false;
    }
  };

  // ==================================================
  // SEARCH
  // ==================================================

  const searchValue = searchTerm.toLowerCase().trim();

  // All market stocks search
  const searchResults = useMemo(() => {
    if (!searchValue) {
      return [];
    }

    return stocks.filter((stock) => {
      const symbol = stock.symbol?.toLowerCase() || "";

      const companyName = stock.companyName?.toLowerCase() || "";

      return symbol.includes(searchValue) || companyName.includes(searchValue);
    });
  }, [stocks, searchValue]);

  // ==================================================
  // MY WATCHLIST STOCKS
  // ==================================================

  const myWatchlistStocks = useMemo(() => {
    return stocks.filter((stock) =>
      watchlistSymbols.has(stock.symbol?.toUpperCase()),
    );
  }, [stocks, watchlistSymbols]);

  // ==================================================
  // SEARCH MY WATCHLIST
  // ==================================================

  const filteredWatchlistStocks = useMemo(() => {
    if (!searchValue) {
      return myWatchlistStocks;
    }

    return myWatchlistStocks.filter((stock) => {
      const symbol = stock.symbol?.toLowerCase() || "";

      const companyName = stock.companyName?.toLowerCase() || "";

      return symbol.includes(searchValue) || companyName.includes(searchValue);
    });
  }, [myWatchlistStocks, searchValue]);

  // ==================================================
  // STATES
  // ==================================================

  const showLoadingState = isMarketPricesLoading || isWatchlistLoading;

  const showMarketError = !isMarketPricesLoading && Boolean(marketPricesError);

  // ==================================================
  // RENDER STOCK
  // ==================================================

  const renderStock = (stock) => {
    const hasMarketData = stock.isMarketDataAvailable !== false;

    const currentPrice = hasMarketData ? Number(stock.currentPrice || 0) : null;

    const previousClose = hasMarketData
      ? Number(stock.previousClose || 0)
      : null;

    const priceChange =
      currentPrice !== null && previousClose !== null
        ? currentPrice - previousClose
        : null;

    const changePercentage =
      previousClose > 0 && priceChange !== null
        ? (priceChange / previousClose) * 100
        : null;

    const isPositive = priceChange !== null ? priceChange >= 0 : true;

    const isInWatchlist = watchlistSymbols.has(stock.symbol?.toUpperCase());

    return (
      <div className="watchlist-item" key={stock.symbol}>
        {/* =========================================
            STOCK INFORMATION
        ========================================= */}

        <div className="stock-information">
          <strong>{stock.symbol}</strong>

          <small>{stock.companyName}</small>
        </div>

        {/* =========================================
            PRICE
        ========================================= */}

        <div className="stock-price">
          {hasMarketData ? (
            <>
              <strong>
                ₹
                {currentPrice.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>

              {changePercentage !== null && (
                <span className={isPositive ? "text-success" : "text-danger"}>
                  {isPositive ? "+" : "-"}₹{Math.abs(priceChange).toFixed(2)}
                  {" ("}
                  {isPositive ? "+" : "-"}
                  {Math.abs(changePercentage).toFixed(2)}
                  {"%)"}
                </span>
              )}
            </>
          ) : (
            <span className="market-data-unavailable">
              Market data unavailable
            </span>
          )}
        </div>

        {/* =========================================
            ACTIONS
        ========================================= */}

        <WatchListActions
          stock={stock}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      </div>
    );
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="dashboard-card market-watch-card">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="dashboard-card-header">
        <div>
          <h5>Market Watch</h5>

          <small className="text-muted">Track your favourite stocks</small>
        </div>

        {!isWatchlistLoading && stocks.length > 0 && (
          <small className="text-muted">
            {stocks.length} {stocks.length === 1 ? "stock" : "stocks"}
          </small>
        )}
      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="position-search-container market-watch-search">
        <SearchIcon className="position-search-icon" />

        <input
          type="text"
          className="position-search-input"
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {searchTerm && (
          <button
            type="button"
            className="clear-position-search"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="watchlist">
        {/* ==================================================
            LOADING
        ================================================== */}

        {showLoadingState && (
          <div className="watchlist-state">
            <div className="watchlist-spinner"></div>

            <span>Loading market data...</span>
          </div>
        )}

        {/* ==================================================
            MARKET ERROR
        ================================================== */}

        {!showLoadingState && showMarketError && (
          <div className="watchlist-state error-state">
            <i className="bi bi-exclamation-circle"></i>

            <span>{marketPricesError}</span>

            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={fetchMarketPrices}
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================================
            WATCHLIST ERROR
        ================================================== */}

        {!showLoadingState && !showMarketError && watchlistError && (
          <div className="watchlist-error">
            <small>{watchlistError}</small>
          </div>
        )}

        {/* ==================================================
            SEARCH RESULTS
        ================================================== */}

        {!showLoadingState && !showMarketError && searchValue && (
          <div className="watchlist-search-results">
            <div className="watchlist-section-title">Search Results</div>

            {searchResults.length > 0 ? (
              searchResults.map(renderStock)
            ) : (
              <div className="watchlist-empty">
                <div className="watchlist-empty-icon">
                  <i className="bi bi-search"></i>
                </div>

                <h6>No stocks found</h6>

                <p>Try searching with a different symbol or company name.</p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            MARKET WATCH
        ================================================== */}

        {!showLoadingState && !showMarketError && !searchValue && (
          <>
            <div className="watchlist-section-title">Market Stocks</div>

            {stocks.length > 0 ? (
              stocks.map(renderStock)
            ) : (
              <div className="watchlist-empty">
                <div className="watchlist-empty-icon">
                  <i className="bi bi-bar-chart"></i>
                </div>

                <h6>No market stocks available</h6>

                <p>Market data is currently unavailable.</p>
              </div>
            )}

            {/* ==================================================
                  MY WATCHLIST
              ================================================== */}

            <div className="watchlist-section-title my-watchlist-title">
              <span>
                <i className="bi bi-star-fill me-2"></i>
                My Watchlist
              </span>

              <small className="text-muted">
                {watchlist.length} {watchlist.length === 1 ? "stock" : "stocks"}
              </small>
            </div>

            {filteredWatchlistStocks.length > 0 ? (
              filteredWatchlistStocks.map(renderStock)
            ) : (
              <div className="watchlist-empty">
                <div className="watchlist-empty-icon">
                  <i className="bi bi-star"></i>
                </div>

                <h6>Your watchlist is empty</h6>

                <p>Search for stocks and add them to your watchlist.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ==================================================
          TRADE POPUP
      ================================================== */}

      {isTradePopupOpen && <TradePopup />}
    </div>
  );
}

export default MarketWatchlist;
