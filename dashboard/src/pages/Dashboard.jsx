import { useContext } from "react";

import { AppContext } from "../context/AppContext";
import DashboardSummary from "../components/DashboardSummary";
import MarketWatchlist from "../components/MarketWatchlist";
import QuickActions from "../components/QuickActions";
import StockSelectionPopup from "../components/StockSelectionPopup";
import StockChartPopup from "../components/StockChartPopup";
import StockDetailsPopup from "../components/StockDetailsPopup";
import "../styles/Dashboard.css";

function Dashboard() {
  const { isStockSelectionPopupOpen, isStockChartOpen, isStockDetailsOpen } =
    useContext(AppContext);

  return (
    <div className="dashboard-container">
      {/* Summary Cards */}
      <DashboardSummary />

      {/* Main Dashboard Grid */}
      <div className="row g-4">
        {/* Market Watch */}
        <div className="col-lg-5">
          <MarketWatchlist />
        </div>

        {/* Quick Actions */}
        <div className="col-lg-7">
          <QuickActions />
        </div>
      </div>

      {/* Stock Selection Popup */}
      {isStockSelectionPopupOpen && <StockSelectionPopup />}
      {isStockChartOpen && <StockChartPopup />}
      {isStockDetailsOpen && <StockDetailsPopup />}
    </div>
  );
}

export default Dashboard;
