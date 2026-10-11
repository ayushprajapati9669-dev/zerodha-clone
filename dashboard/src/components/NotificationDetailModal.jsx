import React from "react";
import "../styles/NotificationDetailModal.css";

const formatDateTime = (timestamp) => {
  if (!timestamp) return "—";
  try {
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
};

const formatEventType = (event) => {
  if (!event) return "Notification";
  return event
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function NotificationDetailModal({ notification, onClose }) {
  if (!notification) return null;

  const { title, message, type, event, priority, createdAt, isRead, metadata } =
    notification;

  return (
    <div className="notif-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="notif-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="notif-modal-header">
          <div className="notif-modal-header-title">
            <span className={`notif-type-tag notif-type-${type || "system"}`}>
              {formatEventType(event || type)}
            </span>
            <h4>{title}</h4>
          </div>
          <button
            type="button"
            className="notif-modal-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
            &times;
          </button>
        </div>

        <div className="notif-modal-meta-bar">
          <div className="notif-meta-item">
            <i className="bi bi-clock me-1"></i>
            <span>{formatDateTime(createdAt)}</span>
          </div>
          <div className="notif-meta-item">
            <span className={`notif-priority-pill priority-${priority || "normal"}`}>
              {(priority || "normal").toUpperCase()} PRIORITY
            </span>
          </div>
          <div className="notif-meta-item">
            <span className={`notif-read-status ${isRead ? "status-read" : "status-unread"}`}>
              {isRead ? "Read" : "Unread"}
            </span>
          </div>
        </div>

        <div className="notif-modal-body">
          <p className="notif-modal-message">{message}</p>

          {metadata && Object.keys(metadata).length > 0 && (
            <div className="notif-metadata-card">
              <div className="notif-metadata-heading">
                <i className="bi bi-info-circle me-1"></i> Event Details
              </div>
              <div className="notif-metadata-grid">
                {metadata.tournamentName && (
                  <div className="metadata-field">
                    <span className="field-label">Tournament:</span>
                    <span className="field-value">{metadata.tournamentName}</span>
                  </div>
                )}
                {metadata.symbol && (
                  <div className="metadata-field">
                    <span className="field-label">Symbol:</span>
                    <span className="field-value font-mono">{metadata.symbol}</span>
                  </div>
                )}
                {metadata.action && (
                  <div className="metadata-field">
                    <span className="field-label">Action:</span>
                    <span className={`field-value action-${metadata.action}`}>
                      {metadata.action}
                    </span>
                  </div>
                )}
                {metadata.quantity !== undefined && (
                  <div className="metadata-field">
                    <span className="field-label">Quantity:</span>
                    <span className="field-value">{metadata.quantity}</span>
                  </div>
                )}
                {metadata.price !== undefined && (
                  <div className="metadata-field">
                    <span className="field-label">Price:</span>
                    <span className="field-value">₹{Number(metadata.price).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {metadata.finalRank !== undefined && (
                  <div className="metadata-field">
                    <span className="field-label">Final Rank:</span>
                    <span className="field-value rank-highlight">#{metadata.finalRank}</span>
                  </div>
                )}
                {metadata.returnPercent !== undefined && (
                  <div className="metadata-field">
                    <span className="field-label">Return:</span>
                    <span className="field-value">{metadata.returnPercent}%</span>
                  </div>
                )}
                {metadata.reason && (
                  <div className="metadata-field full-width">
                    <span className="field-label">Reason:</span>
                    <span className="field-value">{metadata.reason}</span>
                  </div>
                )}
                {metadata.cancelledAt && (
                  <div className="metadata-field full-width">
                    <span className="field-label">Cancelled At:</span>
                    <span className="field-value">{formatDateTime(metadata.cancelledAt)}</span>
                  </div>
                )}
                {metadata.tournamentId && !metadata.tournamentName && (
                  <div className="metadata-field">
                    <span className="field-label">Tournament ID:</span>
                    <span className="field-value font-mono">{String(metadata.tournamentId).slice(-8)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="notif-modal-footer">
          <button type="button" className="notif-close-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
