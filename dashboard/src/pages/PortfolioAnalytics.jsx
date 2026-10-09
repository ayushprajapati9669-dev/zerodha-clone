import React, { useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import {
  getAnalyticsSummary,
  getPerformanceHistory,
  getPnLBreakdown,
  getStockRankings,
} from "../services/portfolioAnalyticsService";
import AnalyticsSummaryCards from "../components/analytics/AnalyticsSummaryCards";
import PortfolioPerformanceChart from "../components/analytics/PortfolioPerformanceChart";
import ProfitLossBreakdown from "../components/analytics/ProfitLossBreakdown";
import StockPerformanceTable from "../components/analytics/StockPerformanceTable";
import PortfolioAllocationSection from "../components/analytics/PortfolioAllocationSection";
import "../styles/PortfolioAnalytics.css";

function PortfolioAnalytics() {
  const { holdings = [] } = useContext(AppContext);

  const [summaryData, setSummaryData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [rankingsData, setRankingsData] = useState(null);

  const [selectedRange, setSelectedRange] = useState("1M");
  const [symbolFilter, setSymbolFilter] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPerformance, setLoadingPerformance] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingRankings, setLoadingRankings] = useState(true);

  const [errorSummary, setErrorSummary] = useState(null);
  const [errorPerformance, setErrorPerformance] = useState(null);

  // Load summary and initial data
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      setErrorSummary(null);
      const res = await getAnalyticsSummary();
      if (res.success) {
        setSummaryData(res.data);
      }
    } catch (err) {
      setErrorSummary(err.response?.data?.message || "Failed to load summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Load performance line chart data on range change
  const fetchPerformance = async (range) => {
    try {
      setLoadingPerformance(true);
      setErrorPerformance(null);
      const res = await getPerformanceHistory(range);
      if (res.success) {
        setPerformanceData(res.data);
      }
    } catch (err) {
      setErrorPerformance(err.response?.data?.message || "Failed to load performance chart");
    } finally {
      setLoadingPerformance(false);
    }
  };

  // Load P&L breakdown
  const fetchBreakdown = async (symbol) => {
    try {
      setLoadingBreakdown(true);
      const res = await getPnLBreakdown(symbol);
      if (res.success) {
        setBreakdownData(res.data);
      }
    } catch (err) {
      console.error("Error loading breakdown:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  // Load stock rankings
  const fetchRankings = async () => {
    try {
      setLoadingRankings(true);
      const res = await getStockRankings();
      if (res.success) {
        setRankingsData(res.data);
      }
    } catch (err) {
      console.error("Error loading rankings:", err);
    } finally {
      setLoadingRankings(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchRankings();
    fetchBreakdown(symbolFilter);
  }, []);

  useEffect(() => {
    fetchPerformance(selectedRange);
  }, [selectedRange]);

  const handleRangeChange = (range) => {
    setSelectedRange(range);
  };

  const handleStockFilterChange = (symbol) => {
    setSymbolFilter(symbol);
    fetchBreakdown(symbol);
  };

  const handleRefresh = () => {
    fetchSummary();
    fetchPerformance(selectedRange);
    fetchBreakdown(symbolFilter);
    fetchRankings();
  };

  return (
    <div className="dashboard-container analytics-page-container">
      {/* Header */}
      <div className="analytics-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Portfolio Analytics</h4>
          <p className="text-muted mb-0">
            Comprehensive portfolio performance tracking, P&L breakdown, allocation, and stock rankings
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm refresh-analytics-btn"
          onClick={handleRefresh}
        >
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Analytics
        </button>
      </div>

      {errorSummary && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorSummary}
        </div>
      )}

      {/* 1. Summary Cards */}
      <AnalyticsSummaryCards summary={summaryData} loading={loadingSummary} />

      {/* 2. Performance Over Time Chart */}
      <div className="mt-4">
        <PortfolioPerformanceChart
          performanceData={performanceData}
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
          loading={loadingPerformance}
          error={errorPerformance}
        />
      </div>

      {/* 3. Realized vs Unrealized P&L Breakdown */}
      <div className="mt-4">
        <ProfitLossBreakdown
          breakdownData={breakdownData}
          loading={loadingBreakdown}
          onStockFilterChange={handleStockFilterChange}
        />
      </div>

      {/* 4. Best & Worst Performers + Stock Rankings Table */}
      <div className="mt-4">
        <StockPerformanceTable
          rankingsData={rankingsData}
          loading={loadingRankings}
        />
      </div>

      {/* 5. Portfolio Allocation Analytics */}
      <div className="mt-4">
        <PortfolioAllocationSection holdings={holdings} />
      </div>
    </div>
  );
}

export default PortfolioAnalytics;
