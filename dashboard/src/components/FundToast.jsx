import React, { useEffect } from "react";
import "../styles/FundToast.css";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
function FundToast() {
  const { fundToast, setIsOpenFundToast } = useContext(AppContext);
  if (!fundToast) {
    return;
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpenFundToast(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [fundToast, setIsOpenFundToast]);
  return (
    <div className="fund-toast">
      <div className="fund-toast-icon">
        <i className="bi bi-check-lg"></i>
      </div>

      <div className="fund-toast-content">
        <strong>{fundToast.message}</strong>
        <span>
          ₹{fundToast.amount.toLocaleString("en-IN")} added to your available
          balance
        </span>
      </div>

      <button
        type="button"
        className="fund-toast-close"
        onClick={() => setIsOpenFundToast(false)}
      >
        &times;
      </button>
    </div>
  );
}

export default FundToast;
