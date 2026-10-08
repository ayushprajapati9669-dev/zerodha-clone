import { useEffect, useState } from "react";

import axios from "axios";
import "../styles/Notifications.css";
function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const [category, setCategory] = useState("all");

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async (selectedPage = 1, append = false) => {
    try {
      setIsLoading(true);

      const response = await axios.get(
        "http://localhost:3000/api/notifications",
        {
          withCredentials: true,

          params: {
            page: selectedPage,
            limit: 10,
            type: category,
            unread: showUnreadOnly,
          },
        },
      );

      const data = response.data;

      setNotifications((previous) =>
        append ? [...previous, ...data.notifications] : data.notifications,
      );

      setHasMore(data.pagination?.hasMore || false);

      setPage(selectedPage);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, [category, showUnreadOnly]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:3000/api/notifications/${notificationId}/read`,
        {},
        {
          withCredentials: true,
        },
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(
        "http://localhost:3000/api/notifications/read-all",
        {},
        {
          withCredentials: true,
        },
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/api/notifications/${id}`, {
        withCredentials: true,
      });

      setNotifications((previous) =>
        previous.filter((notification) => notification._id !== id),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const deleteAll = async () => {
    try {
      await axios.delete("http://localhost:3000/api/notifications/all", {
        withCredentials: true,
      });

      setNotifications([]);
    } catch (error) {
      console.error(error);
    }
  };

  const getTime = (createdAt) => {
    const now = new Date();

    const created = new Date(createdAt);

    const seconds = Math.floor((now - created) / 1000);

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
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

      default:
        return "bi bi-info-circle";
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h3>Notifications</h3>

          <p>Stay updated with your trading activity.</p>
        </div>

        <div className="notification-page-actions">
          <button type="button" onClick={markAllAsRead}>
            Mark all as read
          </button>

          <button type="button" onClick={deleteAll}>
            Delete all
          </button>
        </div>
      </div>

      <div className="notification-filters">
        <div>
          {[
            ["all", "All"],
            ["order", "Orders"],
            ["fund", "Funds"],
            ["system", "System"],
          ].map((item) => (
            <button
              key={item[0]}
              className={category === item[0] ? "active" : ""}
              onClick={() => setCategory(item[0])}
            >
              {item[1]}
            </button>
          ))}
        </div>

        <label>
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(event) => setShowUnreadOnly(event.target.checked)}
          />
          Unread only
        </label>
      </div>

      <div className="notifications-page-list">
        {isLoading ? (
          <div className="notification-page-empty">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-page-empty">
            <i className="bi bi-bell-slash"></i>

            <h5>No notifications</h5>

            <p>You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`notification-page-item ${
                !notification.isRead ? "notification-unread" : ""
              }`}
              key={notification._id}
              onClick={() => markAsRead(notification._id)}
            >
              <div className="notification-icon">
                <i className={getIcon(notification)}></i>
              </div>

              <div className="notification-content">
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
                onClick={(event) => {
                  event.stopPropagation();

                  deleteNotification(notification._id);
                }}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {hasMore && (
        <button
          className="notification-load-more"
          onClick={() => fetchNotifications(page + 1, true)}
        >
          Load more
        </button>
      )}
    </div>
  );
}

export default Notifications;
