import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Holdings from "./pages/Holdings";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import Positions from "./pages/Positions";
import Funds from "./pages/Funds";
import AIAssistant from "./components/AIAssistant";
import Notifications from "./pages/Notifications";
import PortfolioAnalytics from "./pages/PortfolioAnalytics";
import RiskManagement from "./pages/RiskManagement";
import TradingJournal from "./pages/TradingJournal";
import StrategyBacktest from "./pages/StrategyBacktest";
import PaperTrading from "./pages/PaperTrading";
import TournamentAdmin from "./pages/TournamentAdmin";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppProvider from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<PortfolioAnalytics />} />
            <Route path="/risk" element={<RiskManagement />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/journal" element={<TradingJournal />} />
            <Route path="/backtest" element={<StrategyBacktest />} />
            <Route path="/paper-trading" element={<PaperTrading />} />
            <Route path="/admin/tournaments" element={<TournamentAdmin />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
