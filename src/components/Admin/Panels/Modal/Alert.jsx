
import React, { useEffect } from "react";
import "../../../Styles/ModalStyles/sAlert.css";

const Alert = ({
  message,
  type = "success",
  onClose,
  duration = 2500,
  title,
  subtext,
  icon,
}) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  // Icon fallback based on type
  const getIcon = () => {
    if (icon) return icon;
    if (type === "success")
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="none" />
          <path d="M7 12.5l3 3 7-7" stroke="#38d97a" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    if (type === "error")
      return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="12" fill="none" />
          <path d="M8 8l8 8M16 8l-8 8" stroke="#ff3c3c" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        </svg>
      );
    // Add more icons as needed
    return null;
  };

  return (
    <div className={`modern-alert ${type}`}>
      <div className="modern-alert-leftbar" />
      <div className="modern-alert-content">
        <div className="modern-alert-header">
          <span className="modern-alert-icon">{getIcon()}</span>
          <span className="modern-alert-title">{title || (type === "success" ? "Passed" : "Notice")}</span>
        </div>
        <div className="modern-alert-message">{message}</div>
        {subtext && <div className="modern-alert-subtext">{subtext}</div>}
      </div>
    </div>
  );
};

export default Alert;