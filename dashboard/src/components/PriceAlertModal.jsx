import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "../styles/PriceAlertModal.css";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  "http://localhost:3000";

const DEFAULT_MARKET_STOCKS = [
  { symbol: "RELIANCE", companyName: "Reliance Industries" },
  { symbol: "TCS", companyName: "Tata Consultancy Services" },
  { symbol: "INFY", companyName: "Infosys" },
  { symbol: "HDFCBANK", companyName: "HDFC Bank" },
  { symbol: "ICICIBANK", companyName: "ICICI Bank" },
  { symbol: "SBIN", companyName: "State Bank of India" },
  { symbol: "BHARTIARTL", companyName: "Bharti Airtel" },
  { symbol: "ITC", companyName: "ITC Limited" },
  { symbol: "KOTAKBANK", companyName: "Kotak Mahindra Bank" },
  { symbol: "AXISBANK", companyName: "Axis Bank" },
  { symbol: "MARUTI", companyName: "Maruti Suzuki" },
  { symbol: "WIPRO", companyName: "Wipro" },
  { symbol: "HINDUNILVR", companyName: "Hindustan Unilever" },
  { symbol: "SUNPHARMA", companyName: "Sun Pharma" },
];

function PriceAlertModal({
  isOpen,
  onClose,
  initialStock = null,
  marketPrices = {},
  availableStocks = [],
}) {
  const [activeTab, setActiveTab] = useState("create"); // 'create' | 'list'
  const [symbol, setSymbol] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [condition, setCondition] = useState("above");
  const [targetPrice, setTargetPrice] = useState("");

  // Stock selector states
  const [isChangingStock, setIsChangingStock] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const [alerts, setAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const prevIsOpenRef = useRef(false);
  const prevInitialStockRef = useRef(null);
  const marketPricesRef = useRef(marketPrices);

  useEffect(() => {
    marketPricesRef.current = marketPrices;
  }, [marketPrices]);

  // Combine available stocks with default stock universe
  const allStockChoices = useMemo(() => {
    const map = new Map();
    DEFAULT_MARKET_STOCKS.forEach((stk) => {
      map.set(stk.symbol.toUpperCase(), { ...stk });
    });
    (availableStocks || []).forEach((stk) => {
      if (stk?.symbol) {
        const sym = stk.symbol.toUpperCase();
        const existing = map.get(sym) || {};
        map.set(sym, { ...existing, ...stk, symbol: sym });
      }
    });
    Object.values(marketPrices || {}).forEach((stk) => {
      if (stk?.symbol) {
        const sym = stk.symbol.toUpperCase();
        const existing = map.get(sym) || {};
        map.set(sym, { ...existing, ...stk, symbol: sym });
      }
    });
    return Array.from(map.values());
  }, [availableStocks, marketPrices]);

  // Filter stocks for search
  const filteredStocks = useMemo(() => {
    const q = stockSearchQuery.trim().toLowerCase();
    if (!q) return allStockChoices;
    return allStockChoices.filter((s) => {
      const sym = (s.symbol || "").toLowerCase();
      const comp = (s.companyName || "").toLowerCase();
      return sym.includes(q) || comp.includes(q);
    });
  }, [allStockChoices, stockSearchQuery]);

  // Compute live LTP reactively without touching targetPrice state
  const liveLtp = useMemo(() => {
    if (!symbol) return 0;
    const sym = symbol.toUpperCase();
    const tickPrice = Number(marketPrices[sym]?.currentPrice);
    if (Number.isFinite(tickPrice) && tickPrice > 0) {
      return tickPrice;
    }
    return 0;
  }, [symbol, marketPrices]);

  // Fetch alerts list
  const fetchAlerts = async () => {
    try {
      setIsLoadingAlerts(true);
      const res = await axios.get(`${API_BASE_URL}/api/price-alerts`, {
        withCredentials: true,
      });
      if (res.data?.success) {
        setAlerts(res.data.alerts || []);
      }
    } catch (err) {
      console.error("Failed to fetch price alerts:", err);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Setup form strictly on modal open or genuine initialStock switch
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setErrorMessage("");
      setSuccessMessage("");
      setIsSubmitting(false);
      setActiveTab("create");
      setStockSearchQuery("");
      setHighlightedIndex(0);

      if (initialStock?.symbol) {
        const sym = initialStock.symbol.toUpperCase();
        const comp = initialStock.companyName || sym;
        setSymbol(sym);
        setCompanyName(comp);
        setIsChangingStock(false);
        setIsDropdownOpen(false);

        const currentLtpVal =
          Number(marketPricesRef.current[sym]?.currentPrice) ||
          Number(initialStock.currentPrice) ||
          0;
        if (currentLtpVal > 0) {
          setTargetPrice(Number((currentLtpVal * 1.02).toFixed(2)));
        } else {
          setTargetPrice("");
        }
      } else {
        setSymbol("");
        setCompanyName("");
        setTargetPrice("");
        setIsChangingStock(true);
        setIsDropdownOpen(false);
      }

      fetchAlerts();
    } else if (isOpen && initialStock && initialStock !== prevInitialStockRef.current) {
      const sym = initialStock.symbol.toUpperCase();
      const comp = initialStock.companyName || sym;
      setSymbol(sym);
      setCompanyName(comp);
      setIsChangingStock(false);
      setIsDropdownOpen(false);

      const currentLtpVal =
        Number(marketPricesRef.current[sym]?.currentPrice) ||
        Number(initialStock.currentPrice) ||
        0;
      if (currentLtpVal > 0) {
        setTargetPrice(Number((currentLtpVal * 1.02).toFixed(2)));
      } else {
        setTargetPrice("");
      }
    }

    prevIsOpenRef.current = isOpen;
    prevInitialStockRef.current = initialStock;
  }, [isOpen, initialStock]); // Notice: marketPrices is omitted to prevent overwriting user input on ticks!

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen]);

  if (!isOpen) return null;

  // Handle selecting a stock from the selector
  const handleSelectStock = (stk) => {
    const sym = (stk.symbol || "").toUpperCase();
    const comp = stk.companyName || sym;
    setSymbol(sym);
    setCompanyName(comp);
    setIsChangingStock(false);
    setIsDropdownOpen(false);
    setStockSearchQuery("");
    setHighlightedIndex(0);

    const price =
      Number(marketPrices[sym]?.currentPrice) ||
      Number(stk.currentPrice) ||
      0;
    if (price > 0) {
      const mult = condition === "below" ? 0.98 : 1.02;
      setTargetPrice(Number((price * mult).toFixed(2)));
    } else {
      setTargetPrice("");
    }
    setErrorMessage("");
  };

  // Keyboard navigation inside stock search input
  const handleSearchKeyDown = (e) => {
    if (!isDropdownOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsDropdownOpen(true);
      return;
    }

    if (!isDropdownOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredStocks.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredStocks.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredStocks[highlightedIndex]) {
        handleSelectStock(filteredStocks[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  // Create alert handler
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!symbol.trim()) {
      setErrorMessage("Please select a stock first.");
      return;
    }

    const parsedPrice = Number(targetPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage("Please enter a valid positive target price.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${API_BASE_URL}/api/price-alerts`,
        {
          symbol: symbol.trim().toUpperCase(),
          companyName: companyName.trim() || symbol.trim().toUpperCase(),
          condition,
          targetPrice: parsedPrice,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setSuccessMessage(
          `Alert created for ${symbol.toUpperCase()} at ₹${parsedPrice.toLocaleString("en-IN")}`
        );
        fetchAlerts();
        setTimeout(() => {
          setActiveTab("list");
          setSuccessMessage("");
        }, 1100);
      } else {
        setErrorMessage(res.data?.message || "Failed to create price alert.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create price alert.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete alert handler
  const handleDeleteAlert = async (alertId) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/api/price-alerts/${alertId}`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      }
    } catch (err) {
      console.error("Failed to delete alert:", err);
    }
  };

  // Quick preset helper (+1%, +2%, -1%, etc.)
  const applyPercentDelta = (percent) => {
    if (liveLtp > 0) {
      const nextPrice = liveLtp * (1 + percent / 100);
      setTargetPrice(Number(nextPrice.toFixed(2)));
      if (percent > 0) setCondition("above");
      if (percent < 0) setCondition("below");
    }
  };

  return (
    <div className="price-alert-overlay" onClick={onClose}>
      <div
        className="price-alert-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-alert-title"
      >
        {/* Header */}
        <div className="price-alert-header">
          <div className="price-alert-header-info">
            <i className="bi bi-bell-fill text-warning me-2"></i>
            <h5 id="price-alert-title" className="m-0">
              Price Alerts
            </h5>
          </div>
          <button
            type="button"
            className="btn-close-alert"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="price-alert-tabs">
          <button
            type="button"
            className={`price-alert-tab ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <i className="bi bi-plus-circle me-1"></i> New Alert
          </button>
          <button
            type="button"
            className={`price-alert-tab ${activeTab === "list" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("list");
              fetchAlerts();
            }}
          >
            <i className="bi bi-list-ul me-1"></i> Active Alerts
            {alerts.length > 0 && (
              <span className="badge bg-secondary ms-1">{alerts.length}</span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="price-alert-body">
          {activeTab === "create" ? (
            <form onSubmit={handleCreateAlert} className="price-alert-form">
              {errorMessage && (
                <div className="alert alert-danger py-2 px-3 small" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-1"></i> {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="alert alert-success py-2 px-3 small" role="alert">
                  <i className="bi bi-check-circle-fill me-1"></i> {successMessage}
                </div>
              )}

              {/* Stock Selection / Banner */}
              <div className="mb-3">
                <label className="form-label small text-muted">Stock Symbol</label>

                {symbol && !isChangingStock ? (
                  /* Display Selected Stock Card */
                  <div className="stock-info-banner">
                    <div className="stock-info-symbol">
                      <strong>{symbol}</strong>
                      <span className="stock-info-company text-muted ms-2">
                        {companyName}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      {liveLtp > 0 ? (
                        <div className="stock-info-ltp">
                          <span className="text-muted small me-1">LTP:</span>
                          <strong className="text-primary">
                            ₹{liveLtp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      ) : (
                        <span className="badge bg-secondary-subtle text-muted small">
                          Awaiting tick
                        </span>
                      )}

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary btn-change-stock"
                        onClick={() => {
                          setIsChangingStock(true);
                          setIsDropdownOpen(true);
                          setTimeout(() => searchInputRef.current?.focus(), 50);
                        }}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Searchable Stock Selector Input with Dropdown */
                  <div className="stock-selector-container" ref={dropdownRef}>
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input
                        ref={searchInputRef}
                        type="text"
                        className="form-control"
                        placeholder="Search stock symbol or name (e.g. RELIANCE, TCS)..."
                        value={stockSearchQuery}
                        onChange={(e) => {
                          setStockSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                          setHighlightedIndex(0);
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onKeyDown={handleSearchKeyDown}
                        autoFocus={!symbol}
                      />
                      {symbol && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setIsChangingStock(false)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {/* Dropdown Options */}
                    {isDropdownOpen && (
                      <div className="stock-dropdown-menu" role="listbox">
                        {filteredStocks.length > 0 ? (
                          filteredStocks.map((stk, idx) => {
                            const sym = stk.symbol.toUpperCase();
                            const priceVal =
                              Number(marketPrices[sym]?.currentPrice) ||
                              Number(stk.currentPrice) ||
                              0;
                            const isHighlighted = idx === highlightedIndex;

                            return (
                              <div
                                key={sym}
                                role="option"
                                aria-selected={isHighlighted}
                                className={`stock-dropdown-item ${
                                  isHighlighted ? "highlighted" : ""
                                }`}
                                onClick={() => handleSelectStock(stk)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                              >
                                <div className="stock-dropdown-item-left">
                                  <strong>{sym}</strong>
                                  <small className="text-muted ms-2">
                                    {stk.companyName}
                                  </small>
                                </div>
                                {priceVal > 0 && (
                                  <span className="stock-dropdown-item-price">
                                    ₹{priceVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="stock-dropdown-empty">
                            No matching stocks found for "{stockSearchQuery}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Condition Choice */}
              <div className="mb-3">
                <label className="form-label small text-muted">Trigger Condition</label>
                <div className="condition-toggle-group">
                  <button
                    type="button"
                    className={`condition-btn ${condition === "above" ? "active above" : ""}`}
                    onClick={() => {
                      setCondition("above");
                      if (liveLtp > 0 && (!targetPrice || targetPrice < liveLtp)) {
                        setTargetPrice(Number((liveLtp * 1.02).toFixed(2)));
                      }
                    }}
                  >
                    <i className="bi bi-arrow-up-circle me-1"></i> Rises Above (≥)
                  </button>
                  <button
                    type="button"
                    className={`condition-btn ${condition === "below" ? "active below" : ""}`}
                    onClick={() => {
                      setCondition("below");
                      if (liveLtp > 0 && (!targetPrice || targetPrice > liveLtp)) {
                        setTargetPrice(Number((liveLtp * 0.98).toFixed(2)));
                      }
                    }}
                  >
                    <i className="bi bi-arrow-down-circle me-1"></i> Falls Below (≤)
                  </button>
                </div>
              </div>

              {/* Target Price */}
              <div className="mb-3">
                <label className="form-label small text-muted" htmlFor="target-price-input">
                  Target Price (₹)
                </label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input
                    id="target-price-input"
                    type="number"
                    step="0.05"
                    min="0.01"
                    className="form-control"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    required
                  />
                </div>

                {/* Quick percentage helper pills */}
                {liveLtp > 0 && (
                  <div className="price-presets mt-2">
                    <span className="text-muted small me-2">Quick set:</span>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => applyPercentDelta(1)}
                    >
                      +1%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => applyPercentDelta(2)}
                    >
                      +2%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => applyPercentDelta(5)}
                    >
                      +5%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => applyPercentDelta(-1)}
                    >
                      -1%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => applyPercentDelta(-2)}
                    >
                      -2%
                    </button>
                    <button
                      type="button"
                      className="btn-preset"
                      onClick={() => applyPercentDelta(-5)}
                    >
                      -5%
                    </button>
                  </div>
                )}
              </div>

              {/* Explanation Note */}
              <div className="alert-explanation small text-muted mb-3">
                <i className="bi bi-info-circle me-1"></i>
                You will be notified once when {symbol || "the selected stock"}{" "}
                {condition === "above" ? "crosses above" : "drops below"}{" "}
                ₹{Number(targetPrice) > 0 ? Number(targetPrice).toLocaleString("en-IN") : "target price"}.
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary"
                  disabled={isSubmitting || !symbol || !targetPrice}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                      ></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bell-fill me-1"></i> Set Alert
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="price-alerts-list">
              {isLoadingAlerts ? (
                <div className="text-center py-4">
                  <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                  <span className="small text-muted">Loading alerts...</span>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
                  <h6>No active alerts</h6>
                  <p className="small mb-3">
                    Set a price alert on any stock to get notified when it reaches your target.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setActiveTab("create")}
                  >
                    Create an Alert
                  </button>
                </div>
              ) : (
                <div className="alerts-container">
                  {alerts.map((alert) => (
                    <div key={alert._id} className="alert-item-card">
                      <div className="alert-item-details">
                        <div className="d-flex align-items-center gap-2">
                          <strong className="alert-symbol">{alert.symbol}</strong>
                          <span
                            className={`badge alert-badge ${
                              alert.condition === "above"
                                ? "bg-success-subtle text-success"
                                : "bg-danger-subtle text-danger"
                            }`}
                          >
                            {alert.condition === "above" ? "≥" : "≤"} ₹
                            {Number(alert.targetPrice).toLocaleString("en-IN")}
                          </span>
                          {alert.isTriggered ? (
                            <span className="badge bg-warning-subtle text-warning">
                              Triggered
                            </span>
                          ) : (
                            <span className="badge bg-info-subtle text-info">
                              Waiting
                            </span>
                          )}
                        </div>
                        <div className="alert-meta small text-muted mt-1">
                          {alert.companyName}
                          {alert.isTriggered && alert.triggeredPrice && (
                            <span className="ms-2 text-warning">
                              • Hit at ₹{Number(alert.triggeredPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger alert-delete-btn"
                        title="Delete alert"
                        onClick={() => handleDeleteAlert(alert._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PriceAlertModal;
