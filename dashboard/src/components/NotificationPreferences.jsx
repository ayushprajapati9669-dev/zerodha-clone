import { useEffect, useState } from "react";

import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "../utils/notificationPreferences";

const defaultPreferences = {
  orderPlaced: true,
  orderExecuted: true,
  orderCancelled: true,
  fundAdded: true,
  fundWithdrawn: true,
  system: true,
  security: true,
};

function NotificationPreferences() {
  const [preferences, setPreferences] = useState(defaultPreferences);

  const [isLoading, setIsLoading] = useState(true);
  const [savingType, setSavingType] = useState(null);
  const [error, setError] = useState("");

  // =========================================
  // FETCH PREFERENCES
  // =========================================

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        setError("");

        console.log("FETCHING NOTIFICATION PREFERENCES...");

        const data = await getNotificationPreferences();

        setPreferences({
          orderPlaced: data?.orderPlaced ?? true,
          orderExecuted: data?.orderExecuted ?? true,
          orderCancelled: data?.orderCancelled ?? true,
          fundAdded: data?.fundAdded ?? true,
          fundWithdrawn: data?.fundWithdrawn ?? true,
          system: data?.system ?? true,
          security: data?.security ?? true,
        });
      } catch (error) {
        console.error("FAILED TO FETCH NOTIFICATION PREFERENCES:", error);

        setError(
          error.response?.data?.message ||
            "Unable to load notification preferences.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // =========================================
  // CHANGE PREFERENCE
  // =========================================

  const handleChange = async (type) => {

    // Prevent another save while current one is running
    if (savingType !== null) {
      return;
    }

    setError("");

    // Store old state for rollback
    const previousPreferences = {
      ...preferences,
    };

    // Create updated state
    const updatedPreferences = {
      ...preferences,
      [type]: !preferences[type],
    };


    // Immediately update UI
    setPreferences(updatedPreferences);

    try {
      setSavingType(type);


      await saveNotificationPreferences(updatedPreferences);

    } catch (error) {
      console.error("FAILED TO SAVE PREFERENCES:", error);

      // API failed -> rollback
      setPreferences(previousPreferences);

      setError(
        error.response?.data?.message ||
          "Failed to save notification preference.",
      );
    } finally {
      setSavingType(null);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (isLoading) {
    return (
      <div className="text-muted d-flex align-items-center gap-2">
        <div className="spinner-border spinner-border-sm" role="status"></div>

        <span>Loading notification preferences...</span>
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="notification-preferences">
      {error && <div className="alert alert-danger">⚠️ {error}</div>}

      {/* =========================================
          ORDERS
      ========================================= */}

      <div className="notification-preference-group">
        <h6>Orders</h6>

        <label>
          <input
            type="checkbox"
            checked={preferences.orderPlaced}
            onChange={() => handleChange("orderPlaced")}
            disabled={savingType === "orderPlaced"}
          />

          <span>Order placed</span>

          {savingType === "orderPlaced" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>

        <label>
          <input
            type="checkbox"
            checked={preferences.orderExecuted}
            onChange={() => handleChange("orderExecuted")}
            disabled={savingType === "orderExecuted"}
          />

          <span>Order executed</span>

          {savingType === "orderExecuted" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>

        <label>
          <input
            type="checkbox"
            checked={preferences.orderCancelled}
            onChange={() => handleChange("orderCancelled")}
            disabled={savingType === "orderCancelled"}
          />

          <span>Order cancelled</span>

          {savingType === "orderCancelled" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>
      </div>

      {/* =========================================
          FUNDS
      ========================================= */}

      <div className="notification-preference-group">
        <h6>Funds</h6>

        <label>
          <input
            type="checkbox"
            checked={preferences.fundAdded}
            onChange={() => handleChange("fundAdded")}
            disabled={savingType === "fundAdded"}
          />

          <span>Funds added</span>

          {savingType === "fundAdded" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>

        <label>
          <input
            type="checkbox"
            checked={preferences.fundWithdrawn}
            onChange={() => handleChange("fundWithdrawn")}
            disabled={savingType === "fundWithdrawn"}
          />

          <span>Funds withdrawn</span>

          {savingType === "fundWithdrawn" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>
      </div>

      {/* =========================================
          SYSTEM & SECURITY
      ========================================= */}

      <div className="notification-preference-group">
        <h6>System & Security</h6>

        <label>
          <input
            type="checkbox"
            checked={preferences.system}
            onChange={() => handleChange("system")}
            disabled={savingType === "system"}
          />

          <span>System notifications</span>

          {savingType === "system" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>

        <label>
          <input
            type="checkbox"
            checked={preferences.security}
            onChange={() => handleChange("security")}
            disabled={savingType === "security"}
          />

          <span>Security notifications</span>

          {savingType === "security" && (
            <small className="preference-saving">Saving...</small>
          )}
        </label>
      </div>
    </div>
  );
}

export default NotificationPreferences;
