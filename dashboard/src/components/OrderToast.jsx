import "../styles/OrderToast.css";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import React, { useEffect } from "react";
function OrderToast() {
  const { orderToast, setIsOpenOrderToast } = useContext(AppContext);

  useEffect(() => {
    if (!orderToast) {
      return;
    }
    const timer = setTimeout(() => {
      setIsOpenOrderToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [setIsOpenOrderToast, orderToast]);
  if (!orderToast) {
    return null;
  }

  return (
    <div
      className={`order-toast ${
        orderToast.message === "cancelled"
          ? "cancelled"
          : orderToast.type === "buy"
            ? "buy"
            : "sell"
      }`}
    >
      <div className="order-toast-icon">
        <i
          className={
            orderToast.message === "cancelled"
              ? "bi bi-x-lg"
              : orderToast.type === "buy"
                ? "bi bi-arrow-down-left"
                : "bi bi-arrow-up-right"
          }
        ></i>
      </div>

      <div className="order-toast-content">
        <strong>
          {orderToast.message === "cancelled"
            ? "Order cancelled successfully"
            : orderToast.type === "buy"
              ? "Order placed successfully"
              : "Order sold successfully"}
        </strong>
        <span>
          {orderToast.symbol} · {orderToast.type.toUpperCase()} ·{" "}
          {orderToast.quantity} Qty
          {orderToast.message === "cancelled" && " · Cancelled"}
        </span>
      </div>

      <button onClick={() => setIsOpenOrderToast(false)}>
        <i className="bi bi-x"></i>
      </button>
    </div>
  );
}

export default OrderToast;
