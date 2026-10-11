
import { useCallback, useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import NotificationDetailModal from "../components/NotificationDetailModal.jsx";
import "../styles/Notifications.css";

const API_URL = "http://localhost:3000/api/notifications";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "order", label: "Orders" },
  { value: "fund", label: "Funds" },
  { value: "tournament", label: "Tournaments" },
  { value: "system", label: "System" },
];

function Notifications() {
  const { setNotifications: setGlobalNotifications } = useContext(AppContext);
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchNotifications = useCallback(
    async (selectedPage = 1, append = false) => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await axios.get(API_URL, {
          withCredentials: true,
          params: {
            page: selectedPage,
            limit: 10,
            type: category,
            unread: showUnreadOnly,
          },
        });

        const data = response.data;
        const fetched = data.notifications || [];

        setNotifications((previous) => {
          if (!append) return fetched;

          const existingIds = new Set(
            previous.map((item) => item._id)
          );

          return [
            ...previous,
            ...fetched.filter(
              (item) => !existingIds.has(item._id)
            ),
          ];
        });

        setPage(selectedPage);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setErrorMessage(
          error.response?.data?.message ||
          "Unable to load notifications. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [category, showUnreadOnly]
  );

  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `${API_URL}/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true }
            : item
        )
      );

      if (showUnreadOnly) {
        await fetchNotifications(1, false);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setIsActionLoading(true);

      await axios.patch(
        `${API_URL}/read-all`,
        { type: category },
        { withCredentials: true }
      );

      await fetchNotifications(1, false);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      setErrorMessage(
        error.response?.data?.message ||
        "Unable to mark notifications as read."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`, {
        withCredentials: true,
      });

      setNotifications((previous) =>
        previous.filter((item) => item._id !== id)
      );

      // Refresh to keep pagination accurate.
      await fetchNotifications(1, false);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setErrorMessage(
        error.response?.data?.message ||
        "Unable to delete notification."
      );
    }
  };

  const deleteAll = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setIsActionLoading(true);

      await axios.delete(`${API_URL}/all`, {
        withCredentials: true,
        data: { type: category },
      });

      setNotifications([]);
      if (setGlobalNotifications) {
        setGlobalNotifications((prev) =>
          category === "all" ? [] : prev.filter((n) => n.type !== category)
        );
      }
      setPage(1);
      setHasMore(false);
      setErrorMessage("");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete notifications:", error);
      setErrorMessage(
        error.response?.data?.message ||
        "Unable to delete notifications."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleItemClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setSelectedNotification({ ...notification, isRead: true });
  };

  const getTime = (createdAt) => {
    const created = new Date(createdAt);
    const seconds = Math.floor(
      (Date.now() - created.getTime()) / 1000
    );

    if (Number.isNaN(seconds)) return "";

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    return created.toLocaleDateString("en-IN");
  };

  const getIcon = (notification) => {
    switch (notification.event) {
      case "order_placed":
        return "bi bi-plus-circle";
      case "order_executed":
        return "bi bi-check-circle";
      case "order_cancelled":
        return "bi bi-x-circle";
      case "fund_added":
        return "bi bi-wallet2";
      case "fund_withdrawn":
        return "bi bi-wallet";
      case "security":
        return "bi bi-shield-lock";
      case "tournament_joined":
        return "bi bi-trophy text-warning";
      case "tournament_trade":
        return "bi bi-arrow-left-right text-primary";
      case "tournament_disqualified":
        return "bi bi-slash-circle text-danger";
      case "tournament_completed":
        return "bi bi-award text-success";
      case "tournament_started":
        return "bi bi-play-circle text-success";
      case "final_rank_available":
        return "bi bi-award text-success";
      case "order_rejected":
        return "bi bi-exclamation-triangle text-danger";
      default:
        return "bi bi-info-circle";
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h3>Notifications</h3>
          <p>Stay updated with your trading activity and tournaments.</p>
        </div>

        <div className="notification-page-actions">
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={isActionLoading}
          >
            Mark all as read
          </button>

          <button
            type="button"
            onClick={deleteAll}
            disabled={isActionLoading}
          >
            Delete all
          </button>
        </div>
      </div>

      <div className="notification-filters">
        <div>
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={category === value ? "active" : ""}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <label>
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(event) =>
              setShowUnreadOnly(event.target.checked)
            }
          />
          Unread only
        </label>
      </div>

      {errorMessage && (
        <div className="notification-page-empty" role="alert">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchNotifications(1, false)}
          >
            Retry
          </button>
        </div>
      )}

      <div className="notifications-page-list">
        {isLoading ? (
          <div className="notification-page-empty">
            Loading notifications...
          </div>
        ) : notifications.length === 0 && !errorMessage ? (
          <div className="notification-page-empty">
            <i className="bi bi-bell-slash"></i>
            <h5>No notifications</h5>
            <p>You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification-page-item ${!notification.isRead ? "notification-unread" : ""
                }`}
              key={notification._id}
            >
              <div className="notification-icon">
                <i className={getIcon(notification)}></i>
              </div>

              <div
                className="notification-content"
                onClick={() => handleItemClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleItemClick(notification);
                  }
                }}
              >
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <small>{getTime(notification.createdAt)}</small>
              </div>

              {!notification.isRead && (
                <span className="notification-unread-dot"></span>
              )}

              <button
                type="button"
                className="notification-delete-btn"
                aria-label="Delete notification"
                disabled={isActionLoading}
                onClick={() =>
                  deleteNotification(notification._id)
                }
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {!isLoading && hasMore && (
        <button
          type="button"
          className="notification-load-more"
          onClick={() => fetchNotifications(page + 1, true)}
          disabled={isLoading}
        >
          Load more
        </button>
      )}

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}

      {isDeleteModalOpen && (
        <div className="notif-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="notif-modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div className="notif-modal-header-title">
                <span className="notif-type-tag notif-type-system">Confirm Action</span>
                <h4>Delete All Notifications</h4>
              </div>
              <button
                type="button"
                className="notif-modal-close-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <div className="notif-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
                Are you sure you want to delete all{" "}
                <strong>
                  {category === "all"
                    ? "notifications"
                    : `${CATEGORIES.find((c) => c.value === category)?.label || category} notifications`}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="notif-modal-footer" style={{ gap: 10 }}>
              <button
                type="button"
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{
                  background: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={confirmDeleteAll}
                disabled={isActionLoading}
              >
                {isActionLoading ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
