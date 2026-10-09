import React from "react";
import PortfolioAllocationChart from "../PortfolioAllocationChart";

function PortfolioAllocationSection({ holdings }) {
  return (
    <div className="portfolio-allocation-wrapper-section">
      <div className="allocation-denominator-note">
        <i className="bi bi-pie-chart-fill me-2 text-primary"></i>
        <span>
          <strong>Allocation Calculation Note:</strong> Stock allocation percentage is calculated as{" "}
          <code>(Stock Value / Portfolio Total Holdings Value) × 100</code> using active TrueData market prices.
        </span>
      </div>

      <PortfolioAllocationChart holdings={holdings} />
    </div>
  );
}

export default PortfolioAllocationSection;
