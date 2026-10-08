import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";
import { Outlet } from "react-router-dom";
import OrderToast from "./OrderToast";
import { useContext } from "react";
import FundToast from "./FundToast";
import { AppContext } from "../context/AppContext";
import "../styles/DashboardLayout.css";
function DashboardLayout() {
  const { isOpenOrderToast, isOpenFundToast } = useContext(AppContext);
  return (
    <>
      <div className="dashboard-layout">
        {/* Sidebar */}
        <Sidebar />
        <main className="main-content">
          {/* Top Navigation */}
          <TopNavigation />
          <Outlet />
          {isOpenOrderToast && <OrderToast />}
          {isOpenFundToast && <FundToast />}
        </main>
      </div>
    </>
  );
}

export default DashboardLayout;
