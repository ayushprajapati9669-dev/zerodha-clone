import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import SearchIcon from "@mui/icons-material/Search";

import { AppContext } from "../context/AppContext";
import WatchListActions from "./WatchListActions";
import TradePopup from "./TradePopup";
import PriceAlertModal from "./PriceAlertModal";

import "../styles/WatchList.css";

function MarketWatchlist() {
  const [searchTerm, setSearchTerm] = useState("");
  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null);

  const [isWatchlistsLoading, setIsWatchlistsLoading] = useState(true);
  const [watchlistError, setWatchlistError] = useState("");

  // Price Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertStock, setAlertStock] = useState(null);

  // Watchlist Create / Rename / Delete Dialog States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameWatchlistName, setRenameWatchlistName] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
  // FETCH WATCHLISTS
  // ==================================================
  const fetchWatchlists = async () => {
    try {
      setIsWatchlistsLoading(true);
      setWatchlistError("");

      const response = await axios.get("http://localhost:3000/api/watchlists", {
        withCredentials: true,
      });

      const lists = response.data?.watchlists || [];
      setWatchlists(lists);

      if (lists.length > 0) {
        // Retain active selection if it still exists, else pick default or first
        setActiveWatchlistId((prev) => {
          if (prev && lists.some((l) => l._id === prev)) {
            return prev;
          }
          const defaultList = lists.find((l) => l.isDefault) || lists[0];
          return defaultList._id;
        });
      }
    } catch (error) {
      console.error("Failed to fetch watchlists:", error);
      setWatchlistError(
        error.response?.data?.message || "Failed to load watchlists"
      );
    } finally {
      setIsWatchlistsLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  // Active Watchlist Object
  const activeWatchlist = useMemo(() => {
    return (
      watchlists.find((l) => l._id === activeWatchlistId) ||
      watchlists[0] ||
      null
    );
  }, [watchlists, activeWatchlistId]);

  // Symbols in the currently active watchlist
  const activeWatchlistSymbols = useMemo(() => {
    if (!activeWatchlist?.symbols) return new Set();
    return new Set(
      activeWatchlist.symbols
        .map((item) => (typeof item === "string" ? item : item.symbol)?.toUpperCase())
        .filter(Boolean)
    );
  }, [activeWatchlist]);

  // Active watchlist stocks populated with live prices
  const activeWatchlistStocks = useMemo(() => {
    if (!activeWatchlist?.symbols) return [];

    return activeWatchlist.symbols.map((item) => {
      const sym = (typeof item === "string" ? item : item.symbol)?.toUpperCase();
      const comp = typeof item === "string" ? item : item.companyName || sym;

      const live = marketPrices[sym];
      if (live) {
        return {
          ...live,
          symbol: sym,
          companyName: live.companyName || comp,
        };
      }

      // If price not yet in marketPrices map, render safe placeholder
      return {
        symbol: sym,
        companyName: comp,
        currentPrice: 0,
        previousClose: 0,
        priceChange: 0,
        priceChangePercent: 0,
        isMarketDataAvailable: false,
      };
    });
  }, [activeWatchlist, marketPrices]);

  // ==================================================
  // ADD / REMOVE SYMBOL IN ACTIVE WATCHLIST
  // ==================================================
  const handleToggleWatchlist = async (stock) => {
    if (!stock?.symbol || !activeWatchlistId) {
      return false;
    }

    const symbol = stock.symbol.toUpperCase();
    const isAlreadyInActive = activeWatchlistSymbols.has(symbol);

    try {
      setWatchlistError("");

      if (isAlreadyInActive) {
        // DELETE from active watchlist
        await axios.delete(
          `http://localhost:3000/api/watchlists/${activeWatchlistId}/symbols/${encodeURIComponent(
            symbol
          )}`,
          { withCredentials: true }
        );

        setWatchlists((prevLists) =>
          prevLists.map((list) => {
            if (list._id === activeWatchlistId) {
              return {
                ...list,
                symbols: list.symbols.filter(
                  (s) =>
                    (typeof s === "string" ? s : s.symbol)?.toUpperCase() !== symbol
                ),
              };
            }
            return list;
          })
        );
        return true;
      }

      // ADD to active watchlist
      const response = await axios.post(
        `http://localhost:3000/api/watchlists/${activeWatchlistId}/symbols`,
        {
          symbol,
          companyName: stock.companyName || symbol,
        },
        { withCredentials: true }
      );

      const updated = response.data?.watchlist;
      if (updated) {
        setWatchlists((prevLists) =>
          prevLists.map((l) => (l._id === updated._id ? updated : l))
        );
      }
      return true;
    } catch (error) {
      console.error("Watchlist symbol toggle failed:", error.response?.data || error);
      setWatchlistError(
        error.response?.data?.message || "Failed to update watchlist item"
      );
      return false;
    }
  };

  // ==================================================
  // CREATE WATCHLIST
  // ==================================================
  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    const name = newWatchlistName.trim();
    if (!name) return;

    try {
      setWatchlistError("");
      const response = await axios.post(
        "http://localhost:3000/api/watchlists",
        { name },
        { withCredentials: true }
      );

      if (response.data?.success && response.data.watchlist) {
        const created = response.data.watchlist;
        setWatchlists((prev) => [...prev, created]);
        setActiveWatchlistId(created._id);
        setIsCreateModalOpen(false);
        setNewWatchlistName("");
      }
    } catch (error) {
      console.error("Create watchlist failed:", error);
      setWatchlistError(
        error.response?.data?.message || "Failed to create watchlist"
      );
    }
  };

  // ==================================================
  // RENAME WATCHLIST
  // ==================================================
  const handleRenameWatchlist = async (e) => {
    e.preventDefault();
    const name = renameWatchlistName.trim();
    if (!name || !activeWatchlistId) return;

    try {
      setWatchlistError("");
      const response = await axios.patch(
        `http://localhost:3000/api/watchlists/${activeWatchlistId}`,
        { name },
        { withCredentials: true }
      );

      if (response.data?.success && response.data.watchlist) {
        const updated = response.data.watchlist;
        setWatchlists((prev) =>
          prev.map((l) => (l._id === updated._id ? { ...l, name: updated.name } : l))
        );
        setIsRenameModalOpen(false);
        setRenameWatchlistName("");
      }
    } catch (error) {
      console.error("Rename watchlist failed:", error);
      setWatchlistError(
        error.response?.data?.message || "Failed to rename watchlist"
      );
    }
  };

  // ==================================================
  // DELETE WATCHLIST
  // ==================================================
  const handleDeleteWatchlist = async () => {
    if (!activeWatchlistId || watchlists.length <= 1) return;

    try {
      setWatchlistError("");
      await axios.delete(
        `http://localhost:3000/api/watchlists/${activeWatchlistId}`,
        { withCredentials: true }
      );

      const remaining = watchlists.filter((l) => l._id !== activeWatchlistId);
      setWatchlists(remaining);
      setActiveWatchlistId(remaining[0]?._id || null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete watchlist failed:", error);
      setWatchlistError(
        error.response?.data?.message || "Failed to delete watchlist"
      );
    }
  };

  // ==================================================
  // SEARCH
  // ==================================================
  const searchValue = searchTerm.toLowerCase().trim();

  // All market stocks search
  const searchResults = useMemo(() => {
    if (!searchValue) return [];

    return stocks.filter((stock) => {
      const sym = stock.symbol?.toLowerCase() || "";
      const comp = stock.companyName?.toLowerCase() || "";
      return sym.includes(searchValue) || comp.includes(searchValue);
    });
  }, [stocks, searchValue]);

  // Search in active watchlist
  const filteredActiveWatchlistStocks = useMemo(() => {
    if (!searchValue) return activeWatchlistStocks;

    return activeWatchlistStocks.filter((stock) => {
      const sym = stock.symbol?.toLowerCase() || "";
      const comp = stock.companyName?.toLowerCase() || "";
      return sym.includes(searchValue) || comp.includes(searchValue);
    });
  }, [activeWatchlistStocks, searchValue]);

  // ==================================================
  // STATES
  // ==================================================
  const showLoadingState = isMarketPricesLoading || isWatchlistsLoading;
  const showMarketError = !isMarketPricesLoading && Boolean(marketPricesError);

  // ==================================================
  // RENDER STOCK ITEM
  // ==================================================
  const renderStock = (stock) => {
    const hasMarketData = stock.isMarketDataAvailable !== false && Number(stock.currentPrice || 0) > 0;

    const currentPrice = hasMarketData ? Number(stock.currentPrice || 0) : null;
    const previousClose = hasMarketData ? Number(stock.previousClose || 0) : null;

    const priceChange =
      currentPrice !== null && previousClose !== null
        ? currentPrice - previousClose
        : null;

    const changePercentage =
      previousClose > 0 && priceChange !== null
        ? (priceChange / previousClose) * 100
        : null;

    const isPositive = priceChange !== null ? priceChange >= 0 : true;
    const isInWatchlist = activeWatchlistSymbols.has(stock.symbol?.toUpperCase());

    return (
      <div className="watchlist-item" key={stock.symbol}>
        {/* STOCK INFORMATION */}
        <div className="stock-information">
          <strong>{stock.symbol}</strong>
          <small>{stock.companyName}</small>
        </div>

        {/* PRICE */}
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

        {/* ACTIONS */}
        <WatchListActions
          stock={stock}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onSetAlert={(stk) => {
            setAlertStock(stk);
            setIsAlertModalOpen(true);
          }}
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

        <div className="d-flex align-items-center gap-2">
          {/* Price Alerts trigger */}
          <button
            type="button"
            className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1 header-alerts-btn"
            title="Price Alerts"
            onClick={() => {
              setAlertStock(null);
              setIsAlertModalOpen(true);
            }}
          >
            <i className="bi bi-bell-fill"></i>
            <span className="d-none d-sm-inline">Alerts</span>
          </button>

          {!isWatchlistsLoading && stocks.length > 0 && (
            <small className="text-muted">
              {stocks.length} {stocks.length === 1 ? "stock" : "stocks"}
            </small>
          )}
        </div>
      </div>

      {/* ==================================================
          WATCHLIST TABS STRIP
      ================================================== */}
      <div className="watchlist-tabs-container">
        <div className="watchlist-tabs-scroll">
          {watchlists.map((list, index) => {
            const isActive = list._id === activeWatchlistId;
            return (
              <button
                key={list._id}
                type="button"
                className={`watchlist-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveWatchlistId(list._id)}
                title={`${list.name} (${list.symbols?.length || 0} stocks)`}
              >
                <span className="watchlist-tab-label">{list.name || `List ${index + 1}`}</span>
                <span className="watchlist-tab-count">
                  {list.symbols?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Watchlist Actions (+, rename, delete) */}
        <div className="watchlist-tabs-controls">
          {watchlists.length < 10 && (
            <button
              type="button"
              className="btn-tab-action"
              title="Create new watchlist"
              onClick={() => {
                setNewWatchlistName(`Watchlist ${watchlists.length + 1}`);
                setIsCreateModalOpen(true);
              }}
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          )}

          {activeWatchlist && (
            <>
              <button
                type="button"
                className="btn-tab-action"
                title="Rename active watchlist"
                onClick={() => {
                  setRenameWatchlistName(activeWatchlist.name || "");
                  setIsRenameModalOpen(true);
                }}
              >
                <i className="bi bi-pencil"></i>
              </button>

              {watchlists.length > 1 && (
                <button
                  type="button"
                  className="btn-tab-action text-danger"
                  title="Delete active watchlist"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}
      <div className="position-search-container market-watch-search">
        <SearchIcon className="position-search-icon" />

        <input
          type="text"
          className="position-search-input"
          placeholder="Search stocks to add to watchlist..."
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
        {/* LOADING */}
        {showLoadingState && (
          <div className="watchlist-state">
            <div className="watchlist-spinner"></div>
            <span>Loading market data...</span>
          </div>
        )}

        {/* MARKET ERROR */}
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

        {/* WATCHLIST ERROR */}
        {!showLoadingState && !showMarketError && watchlistError && (
          <div className="watchlist-error">
            <small>{watchlistError}</small>
          </div>
        )}

        {/* SEARCH RESULTS */}
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

        {/* ACTIVE WATCHLIST STOCKS & MARKET STOCKS */}
        {!showLoadingState && !showMarketError && !searchValue && (
          <>
            {/* ACTIVE WATCHLIST */}
            <div className="watchlist-section-title my-watchlist-title">
              <span>
                <i className="bi bi-star-fill me-2"></i>
                {activeWatchlist?.name || "My Watchlist"}
              </span>

              <small className="text-muted">
                {activeWatchlistStocks.length} / 50 stocks
              </small>
            </div>

            {filteredActiveWatchlistStocks.length > 0 ? (
              filteredActiveWatchlistStocks.map(renderStock)
            ) : (
              <div className="watchlist-empty">
                <div className="watchlist-empty-icon">
                  <i className="bi bi-star"></i>
                </div>
                <h6>This watchlist is empty</h6>
                <p>Search for stocks above to add them to {activeWatchlist?.name || "this watchlist"}.</p>
              </div>
            )}

            {/* MARKET STOCKS */}
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
          </>
        )}
      </div>

      {/* ==================================================
          TRADE POPUP
      ================================================== */}
      {isTradePopupOpen && <TradePopup />}

      {/* ==================================================
          PRICE ALERT MODAL
      ================================================== */}
      <PriceAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => {
          setIsAlertModalOpen(false);
          setAlertStock(null);
        }}
        initialStock={alertStock}
        marketPrices={marketPrices}
        availableStocks={stocks}
      />

      {/* ==================================================
          CREATE WATCHLIST MODAL
      ================================================== */}
      {isCreateModalOpen && (
        <div className="price-alert-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="price-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="price-alert-header">
              <h5 className="m-0">New Watchlist</h5>
              <button
                type="button"
                className="btn-close-alert"
                onClick={() => setIsCreateModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateWatchlist} className="p-3">
              <div className="mb-3">
                <label className="form-label small text-muted">Watchlist Name</label>
                <input
                  type="text"
                  maxLength={40}
                  className="form-control"
                  placeholder="e.g. Bluechips, Banking, Tech"
                  value={newWatchlistName}
                  onChange={(e) => setNewWatchlistName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Create Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          RENAME WATCHLIST MODAL
      ================================================== */}
      {isRenameModalOpen && (
        <div className="price-alert-overlay" onClick={() => setIsRenameModalOpen(false)}>
          <div className="price-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="price-alert-header">
              <h5 className="m-0">Rename Watchlist</h5>
              <button
                type="button"
                className="btn-close-alert"
                onClick={() => setIsRenameModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRenameWatchlist} className="p-3">
              <div className="mb-3">
                <label className="form-label small text-muted">Watchlist Name</label>
                <input
                  type="text"
                  maxLength={40}
                  className="form-control"
                  value={renameWatchlistName}
                  onChange={(e) => setRenameWatchlistName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIsRenameModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary">
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================
          DELETE WATCHLIST MODAL
      ================================================== */}
      {isDeleteModalOpen && (
        <div className="price-alert-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="price-alert-modal" onClick={(e) => e.stopPropagation()}>
            <div className="price-alert-header">
              <h5 className="m-0 text-danger">Delete Watchlist</h5>
              <button
                type="button"
                className="btn-close-alert"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="p-3">
              <p className="small mb-3">
                Are you sure you want to delete <strong>{activeWatchlist?.name}</strong>?
                This action cannot be undone.
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={handleDeleteWatchlist}
                >
                  Delete Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketWatchlist;
