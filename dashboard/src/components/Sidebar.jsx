import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";
import axios from "axios";
import { useState } from "react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
function Sidebar() {
  const { handleLogout, logoutErrorMsg } = useContext(AppContext);
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="logo-text">zerodha</span>
      </div>

      {/* Navigation */}
      <div className="sidebar-menu">
        <NavLink to="/ai-assistant" className="sidebar-link">
          <i className="fa-solid fa-robot"></i>
          <span>AI Assistant</span>
        </NavLink>
        <NavLink to={"/dashboard"} className="sidebar-link">
          <i className="bi bi-grid"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to={"/analytics"} className="sidebar-link">
          <i className="bi bi-pie-chart"></i>
          <span>Analytics</span>
        </NavLink>

        <NavLink to={"/risk"} className="sidebar-link">
          <i className="bi bi-shield-check"></i>
          <span>Risk Guard</span>
        </NavLink>

        <NavLink to={"/holdings"} className="sidebar-link">
          <i className="bi bi-briefcase"></i>
          <span>Holdings</span>
        </NavLink>

        <NavLink to={"/orders"} className="sidebar-link">
          <i className="bi bi-cart3"></i>
          <span>Orders</span>
        </NavLink>

        <NavLink to={"/positions"} className="sidebar-link">
          <i className="bi bi-bar-chart"></i>
          <span>Positions</span>
        </NavLink>

        <NavLink to={"/funds"} className="sidebar-link">
          <i className="bi bi-wallet2"></i>
          <span>Funds</span>
        </NavLink>

        <NavLink to={"/journal"} className="sidebar-link">
          <i className="bi bi-journal-text"></i>
          <span>Journal</span>
        </NavLink>

        <NavLink to={"/backtest"} className="sidebar-link">
          <i className="bi bi-cpu"></i>
          <span>Backtest</span>
        </NavLink>
      </div>

      {/* Bottom menu */}
      <div className="sidebar-bottom">
        <NavLink to={"/settings"} className="sidebar-link">
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </NavLink>

        {/* <a href="#" className="sidebar-link">
          <i className="bi bi-box-arrow-right"></i>
          <span>Logout</span>
        </a> */}
        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>
          <span>Logout</span>
        </button>

        {logoutErrorMsg && <div className="logout-error">{logoutErrorMsg}</div>}
      </div>
    </div>
  );
}

export default Sidebar;
