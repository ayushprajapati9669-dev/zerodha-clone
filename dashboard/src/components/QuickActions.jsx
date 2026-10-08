import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { AppContext } from "../context/AppContext";

function QuickActions() {
  const navigate = useNavigate();

  const { setIsStockSelectionPopupOpen, setQuickTradeType } =
    useContext(AppContext);

  const handleBuyStock = () => {
    setQuickTradeType("buy");
    setIsStockSelectionPopupOpen(true);
  };

  const handleSellStock = () => {
    setQuickTradeType("sell");
    setIsStockSelectionPopupOpen(true);
  };

  const handleViewOrders = () => {
    navigate("/orders");
  };

  const handleAddFunds = () => {
    navigate("/funds");
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <div>
          <h5>Quick Actions</h5>
          <small className="text-muted">Frequently used actions</small>
        </div>
      </div>

      <div className="quick-actions">
        <button
          type="button"
          className="quick-action-button"
          onClick={handleBuyStock}
        >
          <i className="bi bi-cart-plus"></i>
          <span>Buy Stock</span>
        </button>

        <button
          type="button"
          className="quick-action-button"
          onClick={handleSellStock}
        >
          <i className="bi bi-cart-dash"></i>
          <span>Sell Stock</span>
        </button>

        <button
          type="button"
          className="quick-action-button"
          onClick={handleViewOrders}
        >
          <i className="bi bi-receipt"></i>
          <span>View Orders</span>
        </button>

        <button
          type="button"
          className="quick-action-button"
          onClick={handleAddFunds}
        >
          <i className="bi bi-wallet2"></i>
          <span>Add Funds</span>
        </button>
      </div>
    </div>
  );
}

export default QuickActions;
