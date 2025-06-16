import React, { useState } from "react";
import "../../../Styles/ModalStyles/sViewUser.css";
import ConfirmAlert from "./ConfirmAlert";
import EditUser from "./EditUser";
import EditIcon from '../../../Assets/edit.svg';
import DeacIcon from '../../../Assets/deac.svg';

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "participations", label: "Participations" },
  { key: "postings", label: "Postings" },
  { key: "badges", label: "Badges" },
];

const formatBirthdate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d)) return "Invalid Date";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const ViewUser = ({ user, onClose, onStatusChange, refreshUsers }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmAlert, setConfirmAlert] = useState({ open: false });
  const [showEditUser, setShowEditUser] = useState(false);

  if (!user) return null;

  // Handles the decision to deactivate/reactivate. This only opens the confirm dialog.
  const showStatusChangeConfirm = (deactivate) => {
    setConfirmAlert({
      open: true,
      type: deactivate ? "warning" : "success",
      title: deactivate ? "Deactivate User" : "Reactivate User",
      message: deactivate
        ? "Are you sure you want to deactivate this user? They will lose access to the platform."
        : "Are you sure you want to reactivate this user? They will regain access to the platform.",
      confirmText: deactivate ? "Deactivate" : "Reactivate",
      cancelText: "Cancel",
      onConfirm: () => {
        if (onStatusChange) onStatusChange(user._id, deactivate);
        setConfirmAlert({ open: false });
      }
    });
  };

  return (
    <>
      <div className="modal-overlay-userprofile">
        <div className="modal-userprofile">
          <div className="modal-userprofile-header">
            <div className="modal-userprofile-title">
              User <span className="modal-userprofile-title-highlight">Profile</span>
            </div>
            <button className="modal-userprofile-close" onClick={onClose} aria-label="Close">
              <span className="modal-userprofile-close-x">✕</span>
            </button>
          </div>
          <div className="modal-userprofile-row modal-userprofile-row-top">
            <div className="modal-userprofile-avatar">
              <div className="modal-userprofile-avatar-circle">
                <span className="modal-userprofile-avatar-icon" />
              </div>
            </div>
            <div className="modal-userprofile-userinfo">
              <div className="modal-userprofile-user-main">
                <span className="modal-userprofile-user-name">
                  {`${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`}
                </span>
                <span className="modal-userprofile-status">
                  {user.isOnline ? (
                    <span className="modal-userprofile-status-online">Online</span>
                  ) : (
                    <span className="modal-userprofile-status-offline">Offline</span>
                  )}
                </span>
              </div>
              <div className="modal-userprofile-user-row">
                <span className="modal-userprofile-user-username">@{user.username || "N/A"}</span>
                {user.mobileNumber || user.phoneNumber ? (
                  <>
                    <span className="modal-userprofile-user-sep">|</span>
                    <span>
                      (+63) {String(user.mobileNumber || user.phoneNumber).replace(/^0/, "")}
                    </span>
                  </>
                ) : null}
                <span className="modal-userprofile-user-sep">|</span>
                <span className="modal-userprofile-user-email">{user.email || "N/A"}</span>
                {(user.address || user.city) ? (
                  <>
                    <span className="modal-userprofile-user-sep">|</span>
                    <span className="modal-userprofile-user-address">
                      {(user.address || "") + (user.city ? " " + user.city : "")}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          {/* TAB BAR */}
          <div className="modal-userprofile-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`modal-userprofile-tab-btn${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
            <div className="modal-userprofile-tabs-actions">
              <button className="modal-userprofile-edit-btn" onClick={() => setShowEditUser(true)}>
                <img src={EditIcon} alt="Edit" style={{ marginRight: 6, width: 18, height: 18 }} />
                Edit User
              </button>
              {!user.isDeactivated ? (
                <button className="modal-userprofile-deactivate-btn" onClick={() => showStatusChangeConfirm(true)}>
                  <img src={DeacIcon} alt="Deactivate" style={{ width: 20, height: 20, marginRight: 7 }} /> Deactivate
                </button>
              ) : (
                <button className="modal-userprofile-reactivate-btn" onClick={() => showStatusChangeConfirm(false)}>
                  Reactivate
                </button>
              )}
            </div>
          </div>
          {/* TAB CONTENT */}
          {activeTab === "overview" && (
            <div className="modal-userprofile-section">
              <div className="modal-userprofile-info-card">
                <div className="modal-userprofile-info-title">Personal Information</div>
                <div className="modal-userprofile-info-grid">
                  <div>
                    <span className="modal-userprofile-info-label">Name</span>
                    <span className="modal-userprofile-info-value">
                      {`${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""}`}
                    </span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Gender</span>
                    <span className="modal-userprofile-info-value">{user.gender || "N/A"}</span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Birthdate</span>
                    <span className="modal-userprofile-info-value">{formatBirthdate(user.dateOfBirth)}</span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Address</span>
                    <span className="modal-userprofile-info-value">
                      {(user.address || "") + (user.city ? " " + user.city : "")}
                    </span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Civil Status</span>
                    <span className="modal-userprofile-info-value">{user.civilStatus || "N/A"}</span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Vicariate/Parish</span>
                    <span className="modal-userprofile-info-value">{user.parish || "N/A"}</span>
                  </div>
                </div>
                <div className="modal-userprofile-info-title" style={{ marginTop: "1.5em" }}>Account Information</div>
                <div className="modal-userprofile-info-grid">
                  <div>
                    <span className="modal-userprofile-info-label">Username</span>
                    <span className="modal-userprofile-info-value">{user.username || "N/A"}</span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Phone Number</span>
                    <span className="modal-userprofile-info-value">
                      {user.mobileNumber || user.phoneNumber
                        ? `(+63) ${String(user.mobileNumber || user.phoneNumber).replace(/^0/, "")}`
                        : "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="modal-userprofile-info-label">Email</span>
                    <span className="modal-userprofile-info-value">{user.email || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Placeholder for other tabs */}
          {activeTab !== "overview" && (
            <div className="modal-userprofile-section">
              <div style={{ color: "#bbb", textAlign: "center", padding: "40px 0" }}>
                No data yet for this tab.
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmAlert
        open={confirmAlert.open}
        title={confirmAlert.title}
        message={confirmAlert.message}
        type={confirmAlert.type}
        confirmText={confirmAlert.confirmText}
        cancelText={confirmAlert.cancelText}
        onConfirm={confirmAlert.onConfirm}
        onCancel={() => setConfirmAlert({ open: false })}
      />
      {showEditUser && (
        <EditUser
          user={user}
          onClose={() => setShowEditUser(false)}
          onSuccess={() => {
            setShowEditUser(false);
            if (refreshUsers) refreshUsers();
          }}
        />
      )}
    </>
  );
};

export default ViewUser;