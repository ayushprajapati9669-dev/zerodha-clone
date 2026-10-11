
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
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
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const deleteAll = async () => {
    const confirmed = window.confirm(
      category === "all"
        ? "Delete all your notifications?"
        : `Delete all ${CATEGORIES.find((item) => item.value === category)?.label ||
        "selected"
        } notifications?`
    );

    if (!confirmed) return;

    try {
      setIsActionLoading(true);

      await axios.delete(`${API_URL}/all`, {
        withCredentials: true,
        data: { type: category },
      });

      setNotifications([]);
      setPage(1);
      setHasMore(false);
      setErrorMessage("");
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
                onClick={() => markAsRead(notification._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    markAsRead(notification._id);
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
    </div>
  );
}

export default Notifications;
