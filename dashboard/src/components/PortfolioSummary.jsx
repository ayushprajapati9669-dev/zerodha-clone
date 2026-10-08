import React from "react";
import { portfolioData } from "../data/dashboardData";

function PortfolioSummary() {
  const profit = portfolioData.currentValue - portfolioData.totalInvestment;

  return (
    <div className="portfolio-summary">
      <div className="portfolio-summary-item">
        <span>Invested</span>
        <strong>
          ₹{portfolioData.totalInvestment.toLocaleString("en-IN")}
        </strong>
      </div>

      <div className="portfolio-summary-item">
        <span>Current Value</span>
        <strong>₹{portfolioData.currentValue.toLocaleString("en-IN")}</strong>
      </div>

      <div className="portfolio-summary-item">
        <span>P&L</span>
        <strong className="text-success">
          +₹{profit.toLocaleString("en-IN")}
        </strong>
      </div>
    </div>
  );
}

export default PortfolioSummary;
