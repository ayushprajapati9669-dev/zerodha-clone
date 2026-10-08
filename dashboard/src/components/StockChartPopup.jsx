import { useContext, useEffect, useState } from "react";

import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { AppContext } from "../context/AppContext";

import "../styles/StockChartPopup.css";

function StockChartPopup() {
  // ==================================================
  // State
  // ==================================================

  const [selectedRange, setSelectedRange] = useState("1M");

  const [chartData, setChartData] = useState([]);

  const [isChartLoading, setIsChartLoading] = useState(false);

  const [chartError, setChartError] = useState("");

  const { selectedChartStock, setIsStockChartOpen } = useContext(AppContext);

  // ==================================================
  // Close Chart Popup
  // ==================================================

  const handleClose = () => {
    setIsStockChartOpen(false);
  };

  // ==================================================
  // Fetch Historical Chart Data
  // ==================================================

  useEffect(() => {
    if (!selectedChartStock) {
      setChartData([]);
      setChartError("");
      return;
    }

    const fetchChartData = async () => {
      try {
        setIsChartLoading(true);
        setChartError("");
        setChartData([]);

        const response = await axios.get(
          `http://localhost:3000/api/market/prices/${encodeURIComponent(
            selectedChartStock.symbol,
          )}/history`,
          {
            params: {
              range: selectedRange,
            },
          },
        );

        const data = response.data?.data;

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No chart data available");
        }

        // ----------------------------------------------
        // Ensure chronological order
        // Oldest -> Newest
        // ----------------------------------------------

        const formattedData = data
          .filter((item) => item?.time && Number.isFinite(Number(item?.price)))
          .map((item) => ({
            ...item,
            price: Number(item.price),
          }))
          .sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
          );

        if (formattedData.length === 0) {
          throw new Error("No valid chart data available");
        }

        setChartData(formattedData);
      } catch (error) {
        console.error("Unable to fetch chart data:", error);

        setChartData([]);

        setChartError(
          error.response?.data?.message || "Unable to load chart data",
        );
      } finally {
        setIsChartLoading(false);
      }
    };

    fetchChartData();
  }, [selectedChartStock, selectedRange]);

  // ==================================================
  // Tooltip Formatter
  // ==================================================

  const formatTooltipValue = (value) => {
    return [
      `₹${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      "Price",
    ];
  };

  // ==================================================
  // X Axis Formatter
  // ==================================================

  const formatXAxisDate = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    // ------------------------------------------------
    // 1 Month
    // ------------------------------------------------

    if (selectedRange === "1M") {
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });
    }

    // ------------------------------------------------
    // 1 Year
    // ------------------------------------------------

    if (selectedRange === "1Y") {
      return date.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
    }

    // ------------------------------------------------
    // Long ranges
    // ------------------------------------------------

    return date.getFullYear().toString();
  };

  // ==================================================
  // Don't Render Without Stock
  // ==================================================

  if (!selectedChartStock) {
    return null;
  }

  // ==================================================
  // JSX
  // ==================================================

  return (
    <div className="stock-chart-overlay">
      <div className="stock-chart-popup">
        {/* ========================================= */}
        {/* Header */}
        {/* ========================================= */}

        <div className="stock-chart-header">
          <div>
            <h5>{selectedChartStock.symbol}</h5>

            <small>{selectedChartStock.companyName}</small>
          </div>

          <button
            type="button"
            className="stock-chart-close"
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {/* ========================================= */}
        {/* Current Price */}
        {/* ========================================= */}

        <div className="stock-chart-information">
          <strong>
            ₹
            {Number(selectedChartStock.currentPrice).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>

          <span>Current Price</span>
        </div>

        {/* ========================================= */}
        {/* Chart Ranges */}
        {/* ========================================= */}

        <div className="stock-chart-ranges">
          {["1M", "1Y", "5Y", "10Y", "MAX"].map((range) => (
            <button
              key={range}
              type="button"
              className={selectedRange === range ? "active" : ""}
              onClick={() => setSelectedRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        {/* ========================================= */}
        {/* Chart */}
        {/* ========================================= */}

        <div className="stock-chart-container">
          {/* --------------------------------------- */}
          {/* Loading */}
          {/* --------------------------------------- */}

          {isChartLoading && (
            <div className="text-center text-muted">Loading chart...</div>
          )}

          {/* --------------------------------------- */}
          {/* Error */}
          {/* --------------------------------------- */}

          {!isChartLoading && chartError && (
            <div className="text-center text-danger">
              <i className="bi bi-exclamation-circle fs-4 d-block mb-2"></i>

              {chartError}
            </div>
          )}

          {/* --------------------------------------- */}
          {/* Chart */}
          {/* --------------------------------------- */}

          {!isChartLoading && !chartError && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="time"
                  tickFormatter={formatXAxisDate}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}`
                  }
                />

                <Tooltip formatter={formatTooltipValue} />

                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#f05a28"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {/* --------------------------------------- */}
          {/* Empty Data */}
          {/* --------------------------------------- */}

          {!isChartLoading && !chartError && chartData.length === 0 && (
            <div className="text-center text-muted">
              No historical data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockChartPopup;
