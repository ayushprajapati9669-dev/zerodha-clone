import { createContext, useState, useEffect } from "react";
import axios from "axios";
import socket from "../socket";

export const AppContext = createContext();

export function AppProvider({ children }) {
  // ==================================================
  // Orders
  // ==================================================

  const [orderToast, setOrderToast] = useState(null);

  const [isOpenOrderToast, setIsOpenOrderToast] = useState(false);

  const [orderVersion, setOrderVersion] = useState(0);

  // ==================================================
  // Trade
  // ==================================================

  const [isTradePopupOpen, setIsTradePopupOpen] = useState(false);

  const [selectedStock, setSelectedStock] = useState(null);

  const [stockType, setStockType] = useState("");

  const [isExitMode, setIsExitMode] = useState(false);

  const [quickTradeType, setQuickTradeType] = useState(null);

  // ==================================================
  // Holdings
  // ==================================================

  const [holdingVersion, setHoldingVersion] = useState(0);

  const [holdings, setHoldings] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const [isHoldingsLoading, setIsHoldingsLoading] = useState(true);

  const [holdingsError, setHoldingsError] = useState("");

  // ==================================================
  // Positions
  // ==================================================

  const [positionVersion, setPositionVersion] = useState(0);

  // ==================================================
  // Funds
  // ==================================================

  const [availableBalance, setAvailableBalance] = useState(0);

  const [usedBalance, setUsedBalance] = useState(0);

  const [reservedBalance, setReservedBalance] = useState(0);

  const [isFundLoading, setIsFundLoading] = useState(true);

  const [fundVersion, setFundVersion] = useState(0);

  const [fundToast, setFundToast] = useState(null);

  const [isOpenFundToast, setIsOpenFundToast] = useState(false);

  // ==================================================
  // Errors
  // ==================================================

  const [errorMessage, setErrorMessage] = useState("");

  // ==================================================
  // Stock Selection
  // ==================================================

  const [isStockSelectionPopupOpen, setIsStockSelectionPopupOpen] =
    useState(false);

  // ==================================================
  // Market Prices
  // ==================================================

  const [marketPrices, setMarketPrices] = useState({});

  const [currentStockMarketPrice, setCurrentStockMarketPrice] = useState(0);

  const [isMarketPricesLoading, setIsMarketPricesLoading] = useState(true);

  const [marketPricesError, setMarketPricesError] = useState("");

  // ==================================================
  // Stock Chart
  // ==================================================

  const [isStockChartOpen, setIsStockChartOpen] = useState(false);

  const [selectedChartStock, setSelectedChartStock] = useState(null);

  // ==================================================
  // Stock Details
  // ==================================================

  const [isStockDetailsOpen, setIsStockDetailsOpen] = useState(false);

  const [selectedDetailsStock, setSelectedDetailsStock] = useState(null);

  // ==================================================
  // Current User
  // ==================================================

  const [currentUser, setCurrentUser] = useState(null);

  const [userLoading, setUserLoading] = useState(true);

  // ==================================================
  // Logout
  // ==================================================

  const [logoutErrorMsg, setLogoutErrorMsg] = useState("");

  // ==================================================
  // Notifications
  // ==================================================

  const [notifications, setNotifications] = useState([]);

  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);

  const [notificationsError, setNotificationsError] = useState("");

  const [notificationPagination, setNotificationPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // ==================================================
  // Theme
  // ==================================================

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  // ==================================================
  // Theme Effect
  // ==================================================

  useEffect(() => {
    const root = document.documentElement;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "dark" || (theme === "system" && mediaQuery.matches);

      root.setAttribute("data-theme", isDark ? "dark" : "light");
    };

    applyTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);

      return () => {
        mediaQuery.removeEventListener("change", applyTheme);
      };
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  // ==================================================
  // Current User
  // ==================================================

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/auth/me", {
          withCredentials: true,
        });

        setCurrentUser(response.data.user);
      } catch (error) {
        console.log("Failed to fetch current user:", error);
      } finally {
        setUserLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // ==================================================
  // Notifications - Initial Fetch
  // ==================================================

  useEffect(() => {
    const fetchInitialNotifications = async () => {
      if (userLoading || !currentUser) {
        return;
      }

      try {
        setIsNotificationsLoading(true);

        setNotificationsError("");

        const response = await axios.get(
          "http://localhost:3000/api/notifications",
          {
            params: {
              page: 1,
              limit: 10,
              type: "all",
              unread: "false",
            },

            withCredentials: true,
          },
        );

        setNotifications(response.data.notifications || []);

        setNotificationPagination(
          response.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasMore: false,
          },
        );
      } catch (error) {
        console.log("Failed to fetch notifications:", error);

        setNotificationsError(
          error.response?.data?.message || "Unable to fetch notifications",
        );
      } finally {
        setIsNotificationsLoading(false);
      }
    };

    fetchInitialNotifications();
  }, [userLoading, currentUser]);

  // ==================================================
  // Notification Socket
  // ==================================================

  useEffect(() => {
    if (userLoading || !currentUser?._id) {
      return;
    }

    const userId = currentUser._id;

    // Connect socket
    socket.connect();

    // Join user's private room
    socket.emit("join-user-room", userId);

    // ----------------------------------------------
    // NEW NOTIFICATION
    // ----------------------------------------------
    const handleNewNotification = (notification) => {
      if (!notification?._id) {
        return;
      }

      setNotifications((previousNotifications) => {
        const alreadyExists = previousNotifications.some(
          (item) => item._id === notification._id,
        );

        if (alreadyExists) {
          return previousNotifications;
        }

        return [notification, ...previousNotifications];
      });

      // Pagination total update
      setNotificationPagination((previous) => ({
        ...previous,
        total: previous.total + 1,
      }));
    };

    // ----------------------------------------------
    // NOTIFICATION UPDATED
    // ----------------------------------------------
    const handleNotificationUpdated = (updatedNotification) => {
      if (!updatedNotification?._id) {
        return;
      }

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification._id === updatedNotification._id
            ? updatedNotification
            : notification,
        ),
      );
    };

    // ----------------------------------------------
    // NOTIFICATION DELETED
    // ----------------------------------------------
    const handleNotificationDeleted = ({ notificationId }) => {
      if (!notificationId) {
        return;
      }

      setNotifications((previousNotifications) =>
        previousNotifications.filter(
          (notification) => notification._id !== notificationId,
        ),
      );

      setNotificationPagination((previous) => ({
        ...previous,
        total: Math.max(previous.total - 1, 0),
      }));
    };

    // ----------------------------------------------
    // READ ALL
    // ----------------------------------------------
    const handleReadAll = () => {
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    };

    // ----------------------------------------------
    // SOCKET EVENTS
    // ----------------------------------------------
    socket.on("new-notification", handleNewNotification);

    socket.on("notification:updated", handleNotificationUpdated);

    socket.on("notification:deleted", handleNotificationDeleted);

    socket.on("notification:read-all", handleReadAll);

    // ----------------------------------------------
    // CLEANUP
    // ----------------------------------------------
    return () => {
      socket.off("new-notification", handleNewNotification);

      socket.off("notification:updated", handleNotificationUpdated);

      socket.off("notification:deleted", handleNotificationDeleted);

      socket.off("notification:read-all", handleReadAll);

      socket.disconnect();
    };
  }, [userLoading, currentUser]);

  // ==================================================
  // Unread Notification Count
  // ==================================================

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  // ==================================================
  // Load More Notifications
  // ==================================================

  const loadMoreNotifications = async () => {
    if (!notificationPagination.hasMore || isNotificationsLoading) {
      return;
    }

    try {
      setIsNotificationsLoading(true);

      const nextPage = notificationPagination.page + 1;

      const response = await axios.get(
        "http://localhost:3000/api/notifications",
        {
          params: {
            page: nextPage,
            limit: 10,
            type: "all",
            unread: "false",
          },

          withCredentials: true,
        },
      );

      const newNotifications = response.data.notifications || [];

      setNotifications((previousNotifications) => {
        const existingIds = new Set(
          previousNotifications.map((notification) => notification._id),
        );

        const uniqueNewNotifications = newNotifications.filter(
          (notification) => !existingIds.has(notification._id),
        );

        return [...previousNotifications, ...uniqueNewNotifications];
      });

      setNotificationPagination(response.data.pagination);
    } catch (error) {
      console.log("Failed to load more notifications:", error);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  // ==================================================
  // Market Prices
  // ==================================================

  const fetchMarketPrices = async () => {
    try {
      setIsMarketPricesLoading(true);

      setMarketPricesError("");

      const response = await axios.get(
        "http://localhost:3000/api/market/prices",
      );

      const prices = {};

      response.data?.data?.forEach((stock) => {
        prices[stock.symbol] = stock;
      });

      setMarketPrices(prices);

      const failedStocks = (response.data?.failedStocks || []).filter(
        (symbol) => symbol !== "NIFTY 50" && symbol !== "SENSEX",
      );

      if (failedStocks.length > 0) {
        console.warn("Some market prices failed:", failedStocks);
      }
    } catch (error) {
      console.log("Unable to fetch market prices:", error);

      setMarketPricesError("Unable to load market data");
    } finally {
      setIsMarketPricesLoading(false);
    }
  };

  // ==================================================
  // Real Market Price Polling
  // ==================================================

  useEffect(() => {
    fetchMarketPrices();

    const marketPriceInterval = setInterval(() => {
      fetchMarketPrices();
    }, 5 * 1000);

    return () => {
      clearInterval(marketPriceInterval);
    };
  }, []);

  // ==================================================
  // Funds
  // ==================================================

  useEffect(() => {
    const getFund = async () => {
      try {
        setIsFundLoading(true);

        const response = await axios.get("http://localhost:3000/api/funds", {
          withCredentials: true,
        });

        setAvailableBalance(Number(response.data?.availableBalance || 0));

        setUsedBalance(Number(response.data?.usedBalance || 0));

        setReservedBalance(Number(response.data?.reservedBalance || 0));
      } catch (error) {
        console.error("Failed to fetch funds:", error);
      } finally {
        setIsFundLoading(false);
      }
    };

    if (!userLoading && currentUser) {
      getFund();
    }
  }, [userLoading, currentUser, orderVersion, fundVersion]);

  // ==================================================
  // Holdings
  // ==================================================

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setIsHoldingsLoading(true);

        setHoldingsError("");

        const response = await axios.get("http://localhost:3000/api/holdings", {
          withCredentials: true,
        });

        setHoldings(response.data || []);
      } catch (error) {
        console.error("Failed to fetch holdings:", error);

        setHoldingsError(
          error.response?.data?.message || "Unable to fetch holdings",
        );
      } finally {
        setIsHoldingsLoading(false);
      }
    };

    if (!userLoading && currentUser) {
      fetchHoldings();
    }
  }, [userLoading, currentUser, holdingVersion]);

  // ==================================================
  // Logout
  // ==================================================

  const handleLogout = async () => {
    setLogoutErrorMsg("");

    try {
      await axios.post(
        "http://localhost:3000/api/auth/logout",
        {},
        {
          withCredentials: true,
        },
      );

      window.location.href = "http://localhost:5173/login";
    } catch (error) {
      console.log(error);

      setLogoutErrorMsg(error.response?.data?.message || "Logout failed");
    }
  };

  // ==================================================
  // Context
  // ==================================================

  return (
    <AppContext.Provider
      value={{
        // --------------------------------------------
        // Orders
        // --------------------------------------------

        orderToast,
        setOrderToast,

        isOpenOrderToast,
        setIsOpenOrderToast,

        orderVersion,
        setOrderVersion,

        // --------------------------------------------
        // Trade
        // --------------------------------------------

        selectedStock,
        setSelectedStock,

        stockType,
        setStockType,

        isTradePopupOpen,
        setIsTradePopupOpen,

        isExitMode,
        setIsExitMode,

        quickTradeType,
        setQuickTradeType,

        // --------------------------------------------
        // Holdings
        // --------------------------------------------

        holdings,
        setHoldings,

        holdingVersion,
        setHoldingVersion,

        isLoading,
        setIsLoading,

        isHoldingsLoading,
        holdingsError,

        // --------------------------------------------
        // Positions
        // --------------------------------------------

        positionVersion,
        setPositionVersion,

        // --------------------------------------------
        // Funds
        // --------------------------------------------

        availableBalance,
        usedBalance,
        reservedBalance,

        isFundLoading,

        fundVersion,
        setFundVersion,

        fundToast,
        setFundToast,

        isOpenFundToast,
        setIsOpenFundToast,

        // --------------------------------------------
        // Market Prices
        // --------------------------------------------

        marketPrices,

        fetchMarketPrices,

        currentStockMarketPrice,
        setCurrentStockMarketPrice,

        isMarketPricesLoading,
        marketPricesError,

        // --------------------------------------------
        // Stock Selection
        // --------------------------------------------

        isStockSelectionPopupOpen,
        setIsStockSelectionPopupOpen,

        // --------------------------------------------
        // Stock Chart
        // --------------------------------------------

        isStockChartOpen,
        setIsStockChartOpen,

        selectedChartStock,
        setSelectedChartStock,

        // --------------------------------------------
        // Stock Details
        // --------------------------------------------

        isStockDetailsOpen,
        setIsStockDetailsOpen,

        selectedDetailsStock,
        setSelectedDetailsStock,

        // --------------------------------------------
        // User
        // --------------------------------------------

        currentUser,
        setCurrentUser,

        userLoading,

        // --------------------------------------------
        // Logout
        // --------------------------------------------

        handleLogout,
        logoutErrorMsg,

        // --------------------------------------------
        // Errors
        // --------------------------------------------

        errorMessage,
        setErrorMessage,

        // --------------------------------------------
        // Theme
        // --------------------------------------------

        theme,
        setTheme,

        // --------------------------------------------
        // Notifications
        // --------------------------------------------

        notifications,
        setNotifications,

        isNotificationsLoading,
        notificationsError,

        notificationPagination,
        setNotificationPagination,

        unreadNotificationCount,

        loadMoreNotifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
