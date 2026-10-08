import { useEffect, useRef, useState, useContext } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import { AppContext } from "../context/AppContext";

import NotificationDropdown from "./NotificationDropdown";

import "../styles/TopNavigation.css";

function TopNavigation() {
  const location = useLocation();

  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { currentUser, userLoading, handleLogout, logoutErrorMsg } =
    useContext(AppContext);

  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes("/dashboard")) {
      return "Dashboard";
    }

    if (path.includes("/holdings")) {
      return "Holdings";
    }

    if (path.includes("/orders")) {
      return "Orders";
    }

    if (path.includes("/positions")) {
      return "Positions";
    }

    if (path.includes("/funds")) {
      return "Funds";
    }

    if (path.includes("/notifications")) {
      return "Notifications";
    }

    if (path.includes("/settings")) {
      return "Settings";
    }

    return "Dashboard";
  };

  const getUserInitials = () => {
    if (!currentUser) {
      return "U";
    }

    const firstName = currentUser.firstName || currentUser.name || "";

    const lastName = currentUser.lastName || "";

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <nav className="top-navigation">
      <div className="top-navigation-title">
        <h5>{getPageTitle()}</h5>

        <span>Welcome back</span>
      </div>

      <div className="top-navigation-right">
        <div className="market-status open">
          <span className="market-status-dot"></span>
          Market Open
        </div>

        <NotificationDropdown />

        <div className="profile-dropdown-container" ref={profileDropdownRef}>
          <button
            type="button"
            className="user-profile"
            onClick={() => setIsProfileOpen((previous) => !previous)}
          >
            <div className="user-avatar">{getUserInitials()}</div>

            <div className="user-profile-info">
              <span className="user-name">
                {userLoading
                  ? "Loading..."
                  : currentUser?.firstName || currentUser?.name || "User"}
              </span>

              <span>Account</span>
            </div>

            <i
              className={`bi bi-chevron-down user-profile-arrow ${
                isProfileOpen ? "rotate" : ""
              }`}
            ></i>
          </button>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">
                  {getUserInitials()}
                </div>

                <div>
                  <strong>
                    {currentUser?.firstName || currentUser?.name || "User"}
                  </strong>

                  <span>Trading Account</span>
                </div>
              </div>

              <div className="profile-dropdown-divider"></div>

              <button type="button" onClick={() => navigate("/settings")}>
                <i className="bi bi-gear"></i>
                Settings
              </button>

              <button type="button" onClick={() => navigate("/notifications")}>
                <i className="bi bi-bell"></i>
                Notifications
              </button>

              <div className="profile-dropdown-divider"></div>

              <button
                type="button"
                className="logout-button"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                Logout
              </button>

              {logoutErrorMsg && <small>{logoutErrorMsg}</small>}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default TopNavigation;
