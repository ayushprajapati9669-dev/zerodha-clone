import React from "react";
import "../styles/Orders.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import SearchIcon from "@mui/icons-material/Search";
import StockChartPopup from "../components/StockChartPopup";

function Orders() {
  const [allOrders, setAllOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilterOrderCount, setActiveFilterOrderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [orderSortBy, setOrderSortBy] = useState("default");
  const [sortedOrders, setSortedOrders] = useState([]);

  const {
    orderVersion,
    setOrderVersion,
    setOrderToast,
    setIsOpenOrderToast,

    // Chart
    marketPrices = {},
    setSelectedChartStock,
    setIsStockChartOpen,
    isStockChartOpen,
  } = useContext(AppContext);

  useEffect(() => {
    console.log("order version=", orderVersion);

    setIsLoading(true);

    axios
      .get("http://localhost:3000/api/orders", {
        withCredentials: true,
      })
      .then((res) => {
        setAllOrders(res.data);
        setFilteredOrders(res.data);
        setActiveFilterOrderCount(res.data.length);
        setIsLoading(false);
      })
      .catch((err) => {
        console.log("unable to fetch order in useEffect (Orders): ", err);

        setErrorMessage(
          err.response?.data?.message || "Unable to fetch orders",
        );

        setIsLoading(false);
      });
  }, [orderVersion]);

  const confirmCancelOrder = () => {
    setErrorMessage("");
    console.log("order id=", selectedOrderId);

    axios
      .post(
        "http://localhost:3000/api/orders/cancel-limit",
        {
          orderId: selectedOrderId,
        },
        { withCredentials: true },
      )
      .then((res) => {
        setOrderVersion((prev) => prev + 1);

        setOrderToast({
          symbol: res.data.order.symbol,
          type: res.data.order.type,
          quantity: res.data.order.quantity,
          message: "cancelled",
        });

        setIsOpenOrderToast(true);
      })
      .catch((err) => {
        console.log("error: ", err);
        console.log("order message: ", err.response);

        setErrorMessage(
          err.response?.data?.message || "unable to process request",
        );
      })
      .finally(() => {
        setShowCancelModal(false);
        setSelectedOrderId(null);
      });
  };

  const handleAllOrders = () => {
    setActiveFilter("All");
    setFilteredOrders(allOrders);
    setActiveFilterOrderCount(allOrders.length);
  };

  const handlePendingOrders = () => {
    setActiveFilter("Pending");

    const pendingOrdersCount = allOrders?.reduce((total, order) => {
      return total + (order.status === "pending" ? 1 : 0);
    }, 0);

    setActiveFilterOrderCount(pendingOrdersCount);

    const pendingOrders = allOrders?.filter(
      (order) => order.status === "pending",
    );

    setFilteredOrders(pendingOrders);
  };

  const handleCompletedOrders = () => {
    setActiveFilter("Completed");

    const completedOrdersCount = allOrders?.reduce((total, order) => {
      return total + (order.status === "completed" ? 1 : 0);
    }, 0);

    setActiveFilterOrderCount(completedOrdersCount);

    const completedOrders = allOrders?.filter(
      (order) => order.status === "completed",
    );

    setFilteredOrders(completedOrders);
  };

  const handleCancelledOrders = () => {
    setActiveFilter("Cancelled");

    const cancelledOrdersCount = allOrders?.reduce((total, order) => {
      return total + (order.status === "cancelled" ? 1 : 0);
    }, 0);

    setActiveFilterOrderCount(cancelledOrdersCount);

    const cancelledOrders = allOrders?.filter(
      (order) => order.status === "cancelled",
    );

    setFilteredOrders(cancelledOrders);
  };

  const filteredOrdersSearch = filteredOrders.filter((order) => {
    const searchValue = searchTerm.toLowerCase().trim();

    return (
      order.symbol.toLowerCase().includes(searchValue) ||
      order.companyName.toLowerCase().includes(searchValue)
    );
  });

  useEffect(() => {
    console.log("order sort by value=", orderSortBy);

    const sortedOrder = [...filteredOrdersSearch].sort((a, b) => {
      if (orderSortBy === "default") return 0;

      if (orderSortBy === "date-newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      if (orderSortBy === "date-oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (orderSortBy === "quantity-high") {
        return Number(b.quantity) - Number(a.quantity);
      }

      if (orderSortBy === "quantity-low") {
        return Number(a.quantity) - Number(b.quantity);
      }

      if (orderSortBy === "price-high") {
        return Number(b.price) - Number(a.price);
      }

      if (orderSortBy === "price-low") {
        return Number(a.price) - Number(b.price);
      }

      if (orderSortBy === "total-high") {
        const aPrice = Number(a.price) * Number(a.quantity);
        const bPrice = Number(b.price) * Number(b.quantity);

        return bPrice - aPrice;
      }

      if (orderSortBy === "total-low") {
        const aPrice = Number(a.price) * Number(a.quantity);
        const bPrice = Number(b.price) * Number(b.quantity);

        return aPrice - bPrice;
      }

      return 0;
    });

    setSortedOrders(sortedOrder);
  }, [orderSortBy, filteredOrders, searchTerm]);

  return (
    <div className="dashboard-container">
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal">
            <h5>Cancel Order</h5>

            <p>Are you sure you want to cancel this order?</p>

            <div className="cancel-modal-actions">
              <button
                type="button"
                className="cancel-no-btn"
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedOrderId(null);
                }}
              >
                No
              </button>
              &nbsp;
              <button
                type="button"
                className="cancel-yes-btn"
                onClick={confirmCancelOrder}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="order-details-modal-overlay">
          <div className="order-details-modal">
            <div className="order-details-header">
              <div>
                <h5>Order Details</h5>
                <span>{selectedOrder.symbol}</span>
              </div>

              <button
                type="button"
                className="order-details-close"
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrder(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="order-details-body">
              <div className="order-detail-item">
                <span>Company</span>
                <strong>{selectedOrder.companyName}</strong>
              </div>

              <div className="order-detail-item">
                <span>Product</span>
                <strong>{selectedOrder.product}</strong>
              </div>

              <div className="order-detail-item">
                <span>Type</span>
                <strong>{selectedOrder.type.toUpperCase()}</strong>
              </div>

              <div className="order-detail-item">
                <span>Quantity</span>
                <strong>{Number(selectedOrder.quantity)}</strong>
              </div>

              <div className="order-detail-item">
                <span>Order Type</span>
                <strong>{selectedOrder.orderType}</strong>
              </div>

              <div className="order-detail-item">
                <span>Price</span>
                <strong>
                  ₹{Number(selectedOrder.price).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="order-detail-item">
                <span>Total Amount</span>
                <strong>
                  ₹
                  {(
                    Number(selectedOrder.quantity) * Number(selectedOrder.price)
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="order-detail-item">
                <span>Status</span>
                <strong>{selectedOrder.status}</strong>
              </div>

              <div className="order-detail-item">
                <span>Reserved Amount</span>
                <strong>
                  {Number(selectedOrder.reservedAmount) > 0
                    ? `₹${Number(selectedOrder.reservedAmount).toLocaleString(
                        "en-IN",
                      )}`
                    : "-"}
                </strong>
              </div>

              <div className="order-detail-item">
                <span>Order Time</span>
                <strong>
                  {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="order-details-footer">
              <button
                type="button"
                onClick={() => {
                  setShowOrderDetails(false);
                  setSelectedOrder(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4>Orders</h4>

        {errorMessage && (
          <div className="alert alert-danger orders-error-message">
            {errorMessage}
          </div>
        )}

        <p className="text-muted">View and manage your orders</p>
      </div>

      <div className="dashboard-card orders-card">
        <div className="dashboard-card-header orders-header">
          <div>
            <h5>Order History</h5>

            <small className="text-muted">
              {activeFilterOrderCount} orders
            </small>
          </div>

          <div className="position-search-container">
            <SearchIcon className="position-search-icon" />

            <input
              type="text"
              className="position-search-input"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />

            {searchTerm && (
              <button
                type="button"
                className="clear-position-search"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="order-filters">
            <button
              className={activeFilter === "All" ? "active" : ""}
              onClick={handleAllOrders}
            >
              All
            </button>

            <button
              className={activeFilter === "Pending" ? "active" : ""}
              onClick={handlePendingOrders}
            >
              Pending
            </button>

            <button
              className={activeFilter === "Completed" ? "active" : ""}
              onClick={handleCompletedOrders}
            >
              Completed
            </button>

            <button
              className={activeFilter === "Cancelled" ? "active" : ""}
              onClick={handleCancelledOrders}
            >
              Cancelled
            </button>
          </div>

          <div className="order-sort-container">
            <label htmlFor="order-sort">Sort by</label>

            <select
              id="order-sort"
              className="order-sort-select"
              onChange={(e) => {
                setOrderSortBy(e.target.value);
              }}
            >
              <option value="default">Default</option>
              <option value="date-newest">Newest First</option>
              <option value="date-oldest">Oldest First</option>
              <option value="quantity-high">Quantity: High to Low</option>
              <option value="quantity-low">Quantity: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="total-high">Total: High to Low</option>
              <option value="total-low">Total: Low to High</option>
            </select>
          </div>
        </div>

        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Product</th>
                <th>Type</th>
                <th>Qty.</th>
                <th>Order Type</th>
                <th>Price</th>
                <th>Reserved Amount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="11" className="text-center text-muted">
                    Loading orders...
                  </td>
                </tr>
              )}

              {!isLoading && sortedOrders.length === 0 && (
                <tr>
                  <td colSpan="11" className="text-center text-muted">
                    No{" "}
                    {activeFilter !== "All" ? activeFilter.toLowerCase() : ""}{" "}
                    orders found
                  </td>
                </tr>
              )}

              {sortedOrders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  },
                );

                return (
                  <tr key={order._id}>
                    <td>
                      <div className="company-info">
                        <strong>{order.symbol}</strong>
                        <span>{order.companyName}</span>
                      </div>
                    </td>

                    <td>
                      <span className="product-badge">{order.product}</span>
                    </td>

                    <td>
                      <span
                        className={`order-type ${
                          order.type === "buy" ? "buy" : "sell"
                        }`}
                      >
                        {order.type.toUpperCase()}
                      </span>
                    </td>

                    <td>{Number(order.quantity)}</td>

                    <td>{order.orderType}</td>

                    <td>₹{Number(order.price).toLocaleString("en-IN")}</td>

                    <td>
                      {Number(order.reservedAmount) > 0
                        ? `₹${Number(order.reservedAmount).toLocaleString(
                            "en-IN",
                          )}`
                        : "-"}
                    </td>

                    <td>
                      ₹
                      {Number(
                        order.quantity * Number(order.price),
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={`order-status ${
                          order.status === "completed"
                            ? "completed"
                            : order.status === "cancelled"
                              ? "cancelled"
                              : "pending"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td className="order-time">{formattedDate}</td>

                    <td>
                      {order.status === "pending" &&
                        order.orderType === "Limit" && (
                          <button
                            className="cancel-order-btn"
                            type="button"
                            onClick={() => {
                              setSelectedOrderId(order._id);
                              setShowCancelModal(true);
                            }}
                          >
                            Cancel
                          </button>
                        )}

                      <button
                        type="button"
                        className="order-details-btn ms-2"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                      >
                        Details
                      </button>

                      {/* Chart */}
                      <button
                        type="button"
                        className="order-details-btn ms-2"
                        onClick={() => {
                          const marketData = marketPrices[order.symbol];

                          const chartStock = {
                            symbol: order.symbol,
                            companyName: order.companyName,
                            currentPrice:
                              marketData?.currentPrice ?? Number(order.price),
                            previousClose:
                              marketData?.previousClose ?? Number(order.price),
                          };

                          setSelectedChartStock(chartStock);
                          setIsStockChartOpen(true);
                        }}
                      >
                        Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Chart */}
      {isStockChartOpen && <StockChartPopup />}
    </div>
  );
}

export default Orders;
