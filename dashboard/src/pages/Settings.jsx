import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import "../styles/setting.css";
import NotificationPreferences from "../components/NotificationPreferences";

function Settings() {
  const { currentUser, userLoading, setCurrentUser, theme, setTheme } =
    useContext(AppContext);

  // =========================================
  // Profile
  // =========================================
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // =========================================
  // Password
  // =========================================
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // =========================================
  // Security
  // =========================================
  const [securityMessage, setSecurityMessage] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [loggingOutSessions, setLoggingOutSessions] = useState(false);

  // =========================================
  // Trading Preferences
  // =========================================
  const [defaultProduct, setDefaultProduct] = useState("CNC");
  const [defaultOrderType, setDefaultOrderType] = useState("Market");
  const [confirmOrder, setConfirmOrder] = useState(true);
  const [confirmCancel, setConfirmCancel] = useState(true);

  // =========================================
  // Delete Account
  // =========================================
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // =========================================
  // Load User
  // =========================================
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setMobile(currentUser.mobile || "");
    }
  }, [currentUser]);

  // =========================================
  // Load Trading Settings
  // =========================================
  useEffect(() => {
    const savedSettings = localStorage.getItem("tradingSettings");

    if (!savedSettings) return;

    try {
      const settings = JSON.parse(savedSettings);

      setDefaultProduct(settings.defaultProduct || "CNC");

      setDefaultOrderType(settings.defaultOrderType || "Market");

      setConfirmOrder(
        settings.confirmOrder !== undefined ? settings.confirmOrder : true,
      );

      setConfirmCancel(
        settings.confirmCancel !== undefined ? settings.confirmCancel : true,
      );
    } catch (error) {
      console.error("Failed to load trading settings:", error);
    }
  }, []);

  // =========================================
  // Save Trading Settings
  // =========================================
  useEffect(() => {
    const settings = {
      defaultProduct,
      defaultOrderType,
      confirmOrder,
      confirmCancel,
    };

    localStorage.setItem("tradingSettings", JSON.stringify(settings));
  }, [defaultProduct, defaultOrderType, confirmOrder, confirmCancel]);

  // =========================================
  // Theme
  // =========================================
  const handleThemeChange = (value) => {
    setTheme(value);
  };

  // =========================================
  // Profile Edit
  // =========================================
  const handleEdit = () => {
    setName(currentUser.name || "");
    setMobile(currentUser.mobile || "");

    setMessage("");
    setError("");

    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(currentUser.name || "");
    setMobile(currentUser.mobile || "");

    setMessage("");
    setError("");

    setIsEditing(false);
  };

  // =========================================
  // Update Profile
  // =========================================
  const handleSave = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (name.trim().length < 2) {
      setError("Name must contain at least 2 characters.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError("Mobile number must be a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.put(
        "http://localhost:3000/api/auth/profile",
        {
          name: name.trim(),
          mobile: mobile.trim(),
        },
        {
          withCredentials: true,
        },
      );

      setCurrentUser(response.data.user);

      setMessage(response.data.message || "Profile updated successfully.");

      setIsEditing(false);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // Change Password
  // =========================================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordError("");
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword.length > 30) {
      setPasswordError("New password cannot exceed 30 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await axios.put(
        "http://localhost:3000/api/auth/password",
        {
          currentPassword,
          newPassword,
        },
        {
          withCredentials: true,
        },
      );

      setPasswordMessage(
        response.data.message || "Password changed successfully.",
      );

      setShowPasswordForm(false);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);

      setPasswordError(
        error.response?.data?.message ||
          "Unable to change password. Please try again.",
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // =========================================
  // Logout Other Sessions
  // =========================================
  const handleLogoutOtherSessions = async () => {
    setSecurityMessage("");
    setSecurityError("");

    const confirmed = window.confirm(
      "Are you sure you want to logout from all other sessions?",
    );

    if (!confirmed) return;

    try {
      setLoggingOutSessions(true);

      const response = await axios.post(
        "http://localhost:3000/api/auth/logout-other-sessions",
        {},
        {
          withCredentials: true,
        },
      );

      setSecurityMessage(
        response.data.message || "All other sessions have been logged out.",
      );
    } catch (error) {
      console.error(error);

      setSecurityError(
        error.response?.data?.message || "Failed to logout other sessions.",
      );
    } finally {
      setLoggingOutSessions(false);
    }
  };

  // =========================================
  // Delete Account
  // =========================================
  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Please enter your password.");
      return;
    }

    const confirmed = window.confirm(
      "This action is permanent. Are you sure you want to delete your account?",
    );

    if (!confirmed) return;

    try {
      setDeletingAccount(true);

      await axios.delete("http://localhost:3000/api/auth/account", {
        data: {
          password: deletePassword,
        },
        withCredentials: true,
      });

      window.location.href = "http://localhost:5174/";
    } catch (error) {
      console.error(error);

      setDeleteError(
        error.response?.data?.message || "Failed to delete account.",
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  // =========================================
  // Avatar
  // =========================================
  const getAvatarLetter = (name) => {
    if (!name) return "U";

    return name.trim().charAt(0).toUpperCase();
  };

  // =========================================
  // Loading
  // =========================================
  if (userLoading) {
    return (
      <div className="settings-loading">
        <div className="spinner-border text-primary"></div>
        <span>Loading settings...</span>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="dashboard-container settings-page">
      {/* =========================================
          PAGE HEADER
      ========================================= */}
      <div className="settings-page-header">
        <h3>Settings</h3>

        <p className="text-muted">
          Manage your account, trading preferences and security settings.
        </p>
      </div>

      {/* =========================================
          GLOBAL SUCCESS
      ========================================= */}
      {message && (
        <div className="alert alert-success settings-alert">
          <span>✓ {message}</span>

          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
          />
        </div>
      )}

      {/* =========================================
          GLOBAL ERROR
      ========================================= */}
      {error && (
        <div className="alert alert-danger settings-alert">
          <span>⚠️ {error}</span>

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}

      {/* =========================================
          ACCOUNT INFORMATION
      ========================================= */}
      <div className="dashboard-card settings-card">
        <div className="dashboard-card-header settings-card-header">
          <div className="profile-heading">
            <div className="profile-avatar">
              {getAvatarLetter(currentUser.name)}
            </div>

            <div>
              <h5>Account Information</h5>

              <small className="profile-name">{currentUser.name}</small>
            </div>
          </div>

          {!isEditing && (
            <button className="btn btn-primary" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        <div className="settings-card-body">
          <form onSubmit={handleSave}>
            {/* Name */}
            <div className="settings-field">
              <label className="form-label">Name</label>

              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!isEditing}
              />
            </div>

            {/* Email */}
            <div className="settings-field">
              <label className="form-label">Email</label>

              <input
                type="email"
                className="form-control"
                value={currentUser.email || ""}
                readOnly
              />

              <small className="text-muted">
                Email cannot be changed from this page.
              </small>
            </div>

            {/* Client ID */}
            <div className="settings-field">
              <label className="form-label">Client ID</label>

              <input
                type="text"
                className="form-control"
                value={currentUser.clientId || ""}
                readOnly
              />

              <small className="text-muted">
                Your unique trading account ID.
              </small>
            </div>

            {/* Mobile */}
            <div className="settings-field">
              <label className="form-label">Mobile</label>

              <input
                type="text"
                className="form-control"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                readOnly={!isEditing}
                maxLength="10"
              />
            </div>

            {/* Account Type */}
            <div className="settings-field">
              <label className="form-label">Account Type</label>

              <input
                type="text"
                className="form-control"
                value={currentUser.role === "admin" ? "Administrator" : "User"}
                readOnly
              />
            </div>

            {isEditing && (
              <div className="settings-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* =========================================
          TRADING ACCOUNT
      ========================================= */}
      <div className="dashboard-card settings-card">
        <div className="dashboard-card-header">
          <h5>Trading Account</h5>
        </div>

        <div className="settings-card-body">
          <div className="settings-field">
            <label className="form-label">Account Status</label>

            <div className="account-status-wrapper">
              <span
                className={`account-status ${
                  currentUser.status === "active"
                    ? "status-active"
                    : "status-blocked"
                }`}
              >
                <span className="status-dot"></span>

                {currentUser.status === "active" ? "Active" : "Blocked"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          SECURITY
      ========================================= */}
      <div className="dashboard-card settings-card">
        <div className="dashboard-card-header">
          <h5>Security</h5>
        </div>

        {securityMessage && (
          <div className="alert alert-success settings-inner-alert">
            <span>✓ {securityMessage}</span>

            <button
              className="btn-close"
              onClick={() => setSecurityMessage("")}
            />
          </div>
        )}

        {securityError && (
          <div className="alert alert-danger settings-inner-alert">
            <span>⚠️ {securityError}</span>

            <button
              className="btn-close"
              onClick={() => setSecurityError("")}
            />
          </div>
        )}

        {passwordMessage && (
          <div className="alert alert-success settings-inner-alert">
            <span>✓ {passwordMessage}</span>

            <button
              className="btn-close"
              onClick={() => setPasswordMessage("")}
            />
          </div>
        )}

        <div className="settings-card-body">
          {/* Password */}
          {!showPasswordForm ? (
            <div className="security-item">
              <div className="security-info">
                <div className="security-icon">🔒</div>

                <div>
                  <h6 className="security-title">Password</h6>

                  <p className="security-description">
                    Your password is securely encrypted.
                  </p>

                  <div className="password-dots">••••••••••••</div>
                </div>
              </div>

              <button
                className="btn btn-primary security-button"
                onClick={() => {
                  setPasswordError("");
                  setPasswordMessage("");
                  setShowPasswordForm(true);
                }}
              >
                Change Password
              </button>
            </div>
          ) : (
            <form className="password-form" onSubmit={handleChangePassword}>
              {passwordError && (
                <div className="alert alert-danger password-alert">
                  <span>⚠️ {passwordError}</span>

                  <button
                    className="btn-close"
                    type="button"
                    onClick={() => setPasswordError("")}
                  />
                </div>
              )}

              <div className="settings-field">
                <label className="form-label">Current Password</label>

                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPasswordError("");
                  }}
                />
              </div>

              <div className="settings-field">
                <label className="form-label">New Password</label>

                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                />

                <small className="text-muted">
                  Password must contain 8-30 characters.
                </small>
              </div>

              <div className="settings-field">
                <label className="form-label">Confirm New Password</label>

                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                />
              </div>

              <div className="settings-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={changingPassword}
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={changingPassword}
                  onClick={() => {
                    setShowPasswordForm(false);

                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");

                    setPasswordError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Current Session */}
          <div className="security-item security-item-spaced">
            <div className="security-info">
              <div className="security-icon">💻</div>

              <div>
                <h6 className="security-title">Active Session</h6>

                <p className="security-description">
                  This browser is currently logged in to your account.
                </p>

                <span className="session-badge">Current Session</span>
              </div>
            </div>
          </div>

          {/* Other Sessions */}
          <div className="security-item security-item-spaced">
            <div className="security-info">
              <div className="security-icon">🚪</div>

              <div>
                <h6 className="security-title">Other Sessions</h6>

                <p className="security-description">
                  Logout your account from other devices.
                </p>
              </div>
            </div>

            <button
              className="btn btn-outline-danger security-button"
              onClick={handleLogoutOtherSessions}
              disabled={loggingOutSessions}
            >
              {loggingOutSessions ? "Logging out..." : "Logout Other Sessions"}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          TRADING PREFERENCES
      ========================================= */}
      <div className="dashboard-card settings-card">
        <div className="dashboard-card-header">
          <div>
            <h5>Trading Preferences</h5>

            <small className="text-muted">
              Choose your default trading behaviour.
            </small>
          </div>
        </div>

        <div className="settings-card-body">
          {/* Product */}
          <div className="settings-field">
            <label className="form-label">Default Product</label>

            <select
              className="form-select"
              value={defaultProduct}
              onChange={(e) => setDefaultProduct(e.target.value)}
            >
              <option value="CNC">CNC - Cash & Carry</option>

              <option value="MIS">MIS - Intraday</option>
            </select>

            <small className="text-muted">
              This product will be selected by default while placing an order.
            </small>
          </div>

          {/* Order Type */}
          <div className="settings-field">
            <label className="form-label">Default Order Type</label>

            <select
              className="form-select"
              value={defaultOrderType}
              onChange={(e) => setDefaultOrderType(e.target.value)}
            >
              <option value="Market">Market</option>

              <option value="Limit">Limit</option>
            </select>
          </div>

          {/* Confirm Order */}
          <div className="preference-row">
            <div>
              <strong>Confirm before placing order</strong>

              <p>Ask for confirmation before placing a trade.</p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={confirmOrder}
                onChange={(e) => setConfirmOrder(e.target.checked)}
              />

              <span className="slider"></span>
            </label>
          </div>

          {/* Confirm Cancel */}
          <div className="preference-row">
            <div>
              <strong>Confirm before cancelling order</strong>

              <p>Ask for confirmation before cancelling an order.</p>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={confirmCancel}
                onChange={(e) => setConfirmCancel(e.target.checked)}
              />

              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* =========================================
          NOTIFICATIONS
      ========================================= */}
      <div className="dashboard-card settings-card">
        <div className="dashboard-card-header">
          <div>
            <h5>Notifications</h5>

            <small className="text-muted">
              Choose which notifications you want to receive.
            </small>
          </div>
        </div>

        <div className="settings-card-body">
          <NotificationPreferences />
        </div>
      </div>

      {/* =========================================
          APPEARANCE
      ========================================= */}
      <div className="dashboard-card settings-card">
        <div className="dashboard-card-header">
          <div>
            <h5>Appearance</h5>

            <small className="text-muted">
              Customize how your dashboard looks.
            </small>
          </div>
        </div>

        <div className="settings-card-body">
          <div className="theme-options">
            <button
              className={`theme-option ${theme === "light" ? "selected" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              <span className="theme-icon">☀️</span>

              <span>
                <strong>Light</strong>
                <small>Use light theme</small>
              </span>
            </button>

            <button
              className={`theme-option ${theme === "dark" ? "selected" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              <span className="theme-icon">🌙</span>

              <span>
                <strong>Dark</strong>
                <small>Use dark theme</small>
              </span>
            </button>

            <button
              className={`theme-option ${theme === "system" ? "selected" : ""}`}
              onClick={() => handleThemeChange("system")}
            >
              <span className="theme-icon">💻</span>

              <span>
                <strong>System</strong>
                <small>Follow system preference</small>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          DANGER ZONE
      ========================================= */}
      <div className="dashboard-card danger-card">
        <div className="danger-header">
          <div>
            <h5>Danger Zone</h5>

            <p>These actions can permanently affect your account.</p>
          </div>
        </div>

        <div className="danger-content">
          <div>
            <h6>Delete Account</h6>

            <p>
              Permanently delete your account and associated trading data. This
              action cannot be undone.
            </p>
          </div>

          {!showDeleteForm ? (
            <button
              className="btn btn-danger"
              onClick={() => {
                setDeleteError("");
                setDeletePassword("");
                setShowDeleteForm(true);
              }}
            >
              Delete Account
            </button>
          ) : (
            <form className="delete-form" onSubmit={handleDeleteAccount}>
              {deleteError && (
                <div className="alert alert-danger">⚠️ {deleteError}</div>
              )}

              <label className="form-label">
                Enter your password to continue
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError("");
                }}
              />

              <div className="settings-buttons">
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={deletingAccount}
                >
                  {deletingAccount ? "Deleting..." : "Permanently Delete"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={deletingAccount}
                  onClick={() => {
                    setShowDeleteForm(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
