import { useContext, useEffect, useRef, useState } from "react";

import axios from "axios";

import { io } from "socket.io-client";

import { AppContext } from "../context/AppContext";

import { useNavigate } from "react-router-dom";
import "../styles/NotificationDropdown.css";
const socket = io("http://localhost:3000", {
  withCredentials: true,
  autoConnect: false,
});

function NotificationDropdown() {
  const navigate = useNavigate();

  const {
    currentUser,
    notifications,
    setNotifications,
    unreadNotificationCount,
  } = useContext(AppContext);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const notificationDropdownRef = useRef(null);

  // ======================================
  // SOCKET CONNECTION
  // ======================================

  useEffect(() => {
    if (!currentUser?._id) {
      return;
    }

    socket.connect();

    socket.emit("join-user-room", currentUser._id);

    const handleNewNotification = (notification) => {
      setNotifications((previous) => {
        const exists = previous.some((item) => item._id === notification._id);

        if (exists) {
          return previous;
        }

        return [notification, ...previous];
      });
    };

    socket.on("new-notification", handleNewNotification);

    return () => {
      socket.off("new-notification", handleNewNotification);

      socket.disconnect();
    };
  }, [currentUser?._id, setNotifications]);

  // ======================================
  // OUTSIDE CLICK
  // ======================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // ======================================
  // MARK ALL READ
  // ======================================

  const markAllNotificationsAsRead = async () => {
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
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // ======================================
  // MARK ONE READ
  // ======================================

  const markNotificationAsRead = async (notificationId) => {
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
      console.error("Failed to mark notification as read:", error);
    }
  };

  // ======================================
  // DELETE
  // ======================================

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:3000/api/notifications/${notificationId}`,
        {
          withCredentials: true,
        },
      );

      setNotifications((previous) =>
        previous.filter((notification) => notification._id !== notificationId),
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  // ======================================
  // TIME
  // ======================================

  const getNotificationTime = (createdAt) => {
    const now = new Date();

    const created = new Date(createdAt);

    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    return created.toLocaleDateString("en-IN");
  };

  // ======================================
  // ICON
  // ======================================

  const getNotificationIcon = (notification) => {
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

  // ======================================
  // PRIORITY
  // ======================================

  const getPriorityClass = (priority) => {
    if (priority === "high") {
      return "notification-high";
    }

    if (priority === "low") {
      return "notification-low";
    }

    return "";
  };

  return (
    <div
      className="notification-dropdown-container"
      ref={notificationDropdownRef}
    >
      <button
        type="button"
        className="notification-button"
        aria-label="Notifications"
        onClick={() => setIsNotificationOpen((previous) => !previous)}
      >
        <i className="bi bi-bell"></i>

        {unreadNotificationCount > 0 && (
          <span className="notification-count-badge">
            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
          </span>
        )}
      </button>

      {isNotificationOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div>
              <h6>Notifications</h6>

              <span>
                {unreadNotificationCount > 0
                  ? `${unreadNotificationCount} unread`
                  : "All caught up"}
              </span>
            </div>

            {unreadNotificationCount > 0 && (
              <button type="button" onClick={markAllNotificationsAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <div
                  className={`notification-item ${
                    !notification.isRead ? "notification-unread" : ""
                  } ${getPriorityClass(notification.priority)}`}
                  key={notification._id}
                  onClick={() => markNotificationAsRead(notification._id)}
                >
                  <div className="notification-icon">
                    <i className={getNotificationIcon(notification)}></i>
                  </div>

                  <div className="notification-content">
                    <strong>{notification.title}</strong>

                    <span>{notification.message}</span>

                    <small>{getNotificationTime(notification.createdAt)}</small>
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
            ) : (
              <div className="notification-empty">
                <i className="bi bi-bell-slash"></i>

                <p>No notifications</p>
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <button
              type="button"
              className="notification-view-all-btn"
              onClick={() => {
                setIsNotificationOpen(false);

                navigate("/notifications");
              }}
            >
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
