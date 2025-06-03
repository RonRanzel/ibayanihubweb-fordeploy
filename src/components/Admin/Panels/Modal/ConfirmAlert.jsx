import React from "react";
import "../../../Styles/ModalStyles/sConfirmAlert.css";

// Props: open, title, message, onConfirm, onCancel, type ('success'|'error'|'warning'|'info')
const ConfirmAlert = ({
    open,
    title = "Confirmation",
    message,
    onConfirm,
    onCancel,
    confirmText = "Yes",
    cancelText = "Cancel",
    type = "warning",
}) => {
    if (!open) return null;


    const getIcon = () => {
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
        if (type === "warning")
        return (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="none" />
                <path d="M12 7v5M12 17h.01" stroke="#ffd600" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
            </svg>
        );
        return null;
    };

    return (
        <div className="modern-alert-overlay">
            <div className={`modern-alert modern-alert-modal ${type}`}>
                <div className="modern-alert-leftbar" />
                <div className="modern-alert-content">
                <div className="modern-alert-header">
                    <span className="modern-alert-icon">{getIcon()}</span>
                    <span className="modern-alert-title">{title}</span>
                </div>
                <div className="modern-alert-message">{message}</div>
                <div className="modern-alert-actions">
                    <button className="modern-alert-btn confirm" onClick={onConfirm}>{confirmText}</button>
                    <button className="modern-alert-btn cancel" onClick={onCancel}>{cancelText}</button>
                </div>
                </div>
        </div>
        </div>
    );
};

export default ConfirmAlert;