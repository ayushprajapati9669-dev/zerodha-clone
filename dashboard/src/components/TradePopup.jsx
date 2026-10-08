import "../styles/TradePopUp.css";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";

function TradePopup() {
  // Form-related states
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("Market");
  const [price, setPrice] = useState("");

  // Error states
  const [balanceError, setBalanceError] = useState("");
  const [holdingsError, setHoldingsError] = useState("");

  // User's available holdings for the selected stock
  const [availableHolding, setAvailableHolding] = useState(0);

  // User's available positions for the selected stock
  const [availablePosition, setAvailablePosition] = useState(0);

  const [product, setProduct] = useState("CNC");
  const [isProductDisabled, setIsProductDisabled] = useState(false);

  const {
    setOrderToast,
    setIsOpenOrderToast,
    selectedStock,
    stockType,
    setIsTradePopupOpen,
    setHoldingVersion,
    setOrderVersion,
    availableBalance,
    isFundLoading,
    currentStockMarketPrice,
    setPositionVersion,
    isExitMode,
    setIsExitMode,
  } = useContext(AppContext);

  // Use live market price if available
  const marketPrice =
    currentStockMarketPrice ??
    selectedStock.currentPrice ??
    selectedStock.price ??
    0;

  // Amount for Limit order
  const estimatedAmount = Number(quantity || 0) * Number(price || 0);

  // Fetch holdings
  useEffect(() => {
    const getAllHoldings = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/holdings",{withCredentials:true});

        const holding = res.data?.find(
          (stock) => stock.symbol === selectedStock.symbol,
        );

        setAvailableHolding(
          holding
            ? Number(holding.quantity) - Number(holding.reservedQuantity || 0)
            : 0,
        );
      } catch (err) {
        console.log(
          "Error while fetching holdings:",
          err.response?.data || err.message,
        );
      }
    };

    getAllHoldings();
  }, [selectedStock]);

  // Fetch positions
  useEffect(() => {
    const getAllPositions = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/positions", {
          withCredentials: true,
        });

        const position = res.data?.find(
          (stock) => stock.symbol === selectedStock.symbol,
        );

        setAvailablePosition(
          position
            ? Number(position.quantity) - Number(position.reservedQuantity || 0)
            : 0,
        );
      } catch (err) {
        console.log(
          "Error while fetching positions:",
          err.response?.data || err.message,
        );
      }
    };

    getAllPositions();
  }, [selectedStock]);

  // Set product according to selected stock
  useEffect(() => {
    if (selectedStock?.product) {
      setProduct(selectedStock.product);

      setIsProductDisabled(
        selectedStock.product === "MIS" || selectedStock.product === "CNC",
      );
    } else {
      setProduct("CNC");
      setIsProductDisabled(false);
    }
  }, [selectedStock]);

  // Set quantity while exiting a position/holding
  useEffect(() => {
    if (isExitMode && selectedStock) {
      setQuantity(selectedStock.quantity);
    }
  }, [selectedStock, isExitMode]);

  // Handle Buy/Sell order
  const handleTrade = async (e) => {
    e.preventDefault();

    const form = e.currentTarget;

    // Bootstrap validation
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      return;
    }

    const tradeQuantity = Number(quantity);

    const tradePrice =
      orderType === "Market" ? Number(marketPrice) : Number(price);

    const tradeAmount = tradePrice * tradeQuantity;

    // Don't submit while funds are loading
    if (isFundLoading) {
      return;
    }

    // Clear old errors
    setBalanceError("");
    setHoldingsError("");

    // --------------------------------
    // BUY BALANCE VALIDATION
    // --------------------------------

    if (stockType === "buy" && tradeAmount > availableBalance) {
      setBalanceError(`Insufficient balance`);
      return;
    }

    // --------------------------------
    // SELL CNC VALIDATION
    // --------------------------------

    if (
      stockType === "sell" &&
      product === "CNC" &&
      tradeQuantity > availableHolding
    ) {
      setHoldingsError("Insufficient holdings");
      return;
    }

    // --------------------------------
    // SELL MIS VALIDATION
    // --------------------------------

    if (
      stockType === "sell" &&
      product === "MIS" &&
      tradeQuantity > availablePosition
    ) {
      setHoldingsError("Insufficient positions");
      return;
    }

    try {
      // Send order to backend
      await axios.post(
        "http://localhost:3000/api/orders",
        {
          symbol: selectedStock.symbol,
          companyName: selectedStock.companyName,
          type: stockType.trim(),
          quantity: tradeQuantity,
          orderType: orderType,
          price: tradePrice,
          product: product,
        },
        { withCredentials: true },
      );

      // Show success toast
      setOrderToast({
        symbol: selectedStock.symbol,
        type: stockType,
        quantity: tradeQuantity,
        message: "placed",
      });

      setIsOpenOrderToast(true);

      // Refresh dependent pages/data
      setHoldingVersion((prev) => prev + 1);
      setOrderVersion((prev) => prev + 1);
      setPositionVersion((prev) => prev + 1);

      // Close popup
      setIsTradePopupOpen(false);
      setIsExitMode(false);
    } catch (err) {
      console.log(
        "Error while placing order:",
        err.response?.data || err.message,
      );

      const backendMessage = err.response?.data?.message;

      if (backendMessage) {
        if (stockType === "sell") {
          setHoldingsError(backendMessage);
        } else {
          setBalanceError(backendMessage);
        }
      }
    }
  };

  return (
    <div className="trade-popup-overlay">
      <div className="trade-popup">
        {/* Popup Header */}
        <div className="trade-popup-header">
          <div>
            <h4>
              {stockType === "buy" ? "Buy" : "Sell"}{" "}
              <small className="text-muted" style={{ fontWeight: "400" }}>
                {selectedStock.symbol}
              </small>
            </h4>

            <span>{selectedStock.companyName}</span>
          </div>

          <button
            type="button"
            className="trade-popup-close"
            onClick={() => {
              setIsTradePopupOpen(false);
              setIsExitMode(false);
            }}
            aria-label="Close trade popup"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Stock Information */}
        <div className="trade-stock-info">
          {/* Market Price */}
          <div>
            <span>Market Price</span>

            <strong>₹{Number(marketPrice).toLocaleString("en-IN")}</strong>
          </div>

          {/* Available Information */}
          <div>
            {stockType === "buy" ? (
              <>
                <span>Available Balance</span>

                <strong>
                  ₹{Number(availableBalance).toLocaleString("en-IN")}
                </strong>
              </>
            ) : (
              <>
                <span>Available</span>

                <strong>
                  {product === "CNC"
                    ? `${availableHolding} shares`
                    : `${availablePosition} shares`}
                </strong>
              </>
            )}
          </div>
        </div>

        {/* Trade Form */}
        <form className="needs-validation" noValidate onSubmit={handleTrade}>
          <div className="trade-form">
            {/* Quantity */}
            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>

              <input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                className="form-control"
                required
                min="1"
                step="1"
                value={quantity}
                disabled={isExitMode}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "" || Number(value) >= 1) {
                    setQuantity(value === "" ? "" : Number(value));
                  }

                  setBalanceError("");
                  setHoldingsError("");
                }}
              />

              <div className="invalid-feedback">
                Please enter a valid quantity
              </div>
            </div>

            {/* Order Type */}
            <div className="form-group">
              <label htmlFor="orderType">Order Type</label>

              <select
                id="orderType"
                className="form-select"
                value={orderType}
                onChange={(e) => {
                  setOrderType(e.target.value);
                  setBalanceError("");
                  setHoldingsError("");
                }}
              >
                <option value="Market">Market</option>
                <option value="Limit">Limit</option>
              </select>
            </div>

            {/* Product */}
            <div className="form-group">
              <label htmlFor="product">Product</label>

              <select
                id="product"
                className="form-select"
                value={product}
                onChange={(e) => {
                  setProduct(e.target.value);
                  setBalanceError("");
                  setHoldingsError("");
                }}
                disabled={isProductDisabled}
              >
                <option value="CNC">CNC</option>
                <option value="MIS">MIS</option>
              </select>
            </div>

            {/* Price */}
            <div className="form-group">
              <label htmlFor="price">Price</label>

              <input
                id="price"
                type="number"
                className="form-control"
                min="0.01"
                step="0.01"
                required={orderType === "Limit"}
                placeholder="Enter price"
                value={
                  orderType === "Market"
                    ? Number(marketPrice).toFixed(2)
                    : price
                }
                disabled={orderType === "Market"}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setBalanceError("");
                  setHoldingsError("");
                }}
              />

              <div className="invalid-feedback">Please enter a valid price</div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="trade-summary">
            <div>
              <span>Quantity</span>
              <strong>{quantity || 0}</strong>
            </div>

            <div>
              <span>Estimated Amount</span>

              <strong>
                ₹
                {(orderType === "Market"
                  ? Number(marketPrice) * Number(quantity || 0)
                  : estimatedAmount
                ).toLocaleString("en-IN")}
              </strong>
            </div>

            {/* Balance Error */}
            {balanceError && (
              <div className="alert alert-danger m-3" role="alert">
                {balanceError}
              </div>
            )}

            {/* Holdings Error */}
            {holdingsError && (
              <div className="alert alert-danger m-3" role="alert">
                {holdingsError}
              </div>
            )}
          </div>

          {/* Popup Actions */}
          <div className="trade-popup-actions">
            <button
              type="button"
              className="trade-cancel-btn"
              onClick={() => {
                setIsTradePopupOpen(false);
                setIsExitMode(false);
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="trade-buy-btn"
              disabled={isFundLoading}
            >
              {isFundLoading
                ? "Loading..."
                : stockType === "buy"
                  ? "Buy"
                  : "Sell"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TradePopup;
