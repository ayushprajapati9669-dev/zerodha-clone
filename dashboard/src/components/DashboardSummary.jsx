import { useContext } from "react";

import { AppContext } from "../context/AppContext";
import { calculatePortfolioSummary } from "../helpers/portfolioHelper";

function DashboardSummary() {
  const {
    availableBalance,
    holdings,
    marketPrices = {},
    isMarketPricesLoading,
    marketPricesError,
  } = useContext(AppContext);

  const portfolioSummary = calculatePortfolioSummary(holdings, marketPrices);

  const isMarketDataUnavailable =
    isMarketPricesLoading || Boolean(marketPricesError);

  const marketDataDisplay = isMarketPricesLoading ? "Loading..." : "--";

  const totalProfitIsPositive = portfolioSummary.totalProfitLoss >= 0;

  const totalProfitPercentIsPositive =
    portfolioSummary.totalProfitLossPercent >= 0;

  const dayProfitIsPositive = portfolioSummary.totalDayProfitLoss >= 0;

  return (
    <div className="row g-4 mb-4">
      {/* Total Investment */}
      <div className="col-md-6 col-xl-3">
        <div className="summary-card">
          <div className="summary-card-header">
            <span>Total Investment</span>
            <i className="bi bi-wallet2"></i>
          </div>

          <h3>₹{portfolioSummary.totalInvestment.toLocaleString("en-IN")}</h3>

          <small className="text-muted">Amount invested</small>
        </div>
      </div>

      {/* Current Value */}
      <div className="col-md-6 col-xl-3">
        <div className="summary-card">
          <div className="summary-card-header">
            <span>Current Value</span>
            <i className="bi bi-graph-up"></i>
          </div>

          <h3>
            {isMarketDataUnavailable
              ? marketDataDisplay
              : `₹${portfolioSummary.currentValue.toLocaleString("en-IN")}`}
          </h3>

          <small className="text-success">Portfolio value</small>
        </div>
      </div>

      {/* Total Profit */}
      <div className="col-md-6 col-xl-3">
        <div className="summary-card">
          <div className="summary-card-header">
            <span>Total Profit</span>
            <i className="bi bi-arrow-up-right"></i>
          </div>

          <h3
            className={totalProfitIsPositive ? "text-success" : "text-danger"}
          >
            {isMarketDataUnavailable
              ? marketDataDisplay
              : `${totalProfitIsPositive ? "+" : "-"}₹${Math.abs(
                  portfolioSummary.totalProfitLoss,
                ).toLocaleString("en-IN")}`}
          </h3>

          <small
            className={
              totalProfitPercentIsPositive ? "text-success" : "text-danger"
            }
          >
            {isMarketDataUnavailable
              ? marketDataDisplay
              : `${totalProfitPercentIsPositive ? "+" : ""}${Math.abs(
                  portfolioSummary.totalProfitLossPercent,
                ).toFixed(2)}%`}
          </small>

          <div className="mt-1">
            <small className="text-muted">Day P&L: </small>

            <small
              className={dayProfitIsPositive ? "text-success" : "text-danger"}
            >
              {isMarketDataUnavailable
                ? marketDataDisplay
                : `${dayProfitIsPositive ? "+" : "-"}₹${Math.abs(
                    portfolioSummary.totalDayProfitLoss,
                  ).toFixed(2)}`}
            </small>
          </div>
        </div>
      </div>

      {/* Available Balance */}
      <div className="col-md-6 col-xl-3">
        <div className="summary-card">
          <div className="summary-card-header">
            <span>Available Balance</span>
            <i className="bi bi-cash-stack"></i>
          </div>

          <h3>₹{availableBalance.toLocaleString("en-IN")}</h3>

          <small className="text-muted">Available for trading</small>
        </div>
      </div>
    </div>
  );
}

export default DashboardSummary;
