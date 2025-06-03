import React, { useState } from "react";
import "../../../Styles/ModalStyles/sViewUser.css"; // Your modal CSS
import ConfirmAlert from "./ConfirmAlert"; // Your custom confirm modal

const ViewUser = ({ user, onClose, onStatusChange }) => {
    const [confirmAlert, setConfirmAlert] = useState({ open: false });

    if (!user) return null;

    const formatBirthdate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d)) return 'Invalid Date';
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    const handleDeactivate = () => {
        setConfirmAlert({
            open: true,
            type: "warning",
            title: "Deactivate User",
            message: "Are you sure you want to deactivate this user? They will lose access to the platform.",
            confirmText: "Deactivate",
            cancelText: "Cancel",
            onConfirm: () => {
                onStatusChange && onStatusChange(user._id, true);
                setConfirmAlert({ open: false });
            }
        });
    };

    const handleReactivate = () => {
        setConfirmAlert({
            open: true,
            type: "success",
            title: "Reactivate User",
            message: "Are you sure you want to reactivate this user? They will regain access to the platform.",
            confirmText: "Reactivate",
            cancelText: "Cancel",
            onConfirm: () => {
                onStatusChange && onStatusChange(user._id, false);
                setConfirmAlert({ open: false });
            }
        });
    };

    return (
        <>
            <div className="modal-overlay-userprofile">
                <div className="modal-content-userprofile">
                    <div className="profile-header-userprofile">
                        <h2>
                            User <span className="profile-highlight-userprofile">Profile</span>
                        </h2>
                        <button className="close-btn-userprofile" onClick={onClose} aria-label="Close">&times;</button>
                    </div>

                    <div className="profile-picture-userprofile">
                        <div className="circle-avatar-userprofile"></div>
                    </div>

                    <div className="profile-details-grid">
                        <div>
                            <span className="profile-label-userprofile">Name</span>
                            <div className="profile-value-userprofile">{`${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`}</div>
                        </div>
                        <div>
                            <span className="profile-label-userprofile">Birthdate</span>
                            <div className="profile-value-userprofile">{formatBirthdate(user.dateOfBirth)}</div>
                        </div>
                        <div>
                            <span className="profile-label-userprofile">Gender</span>
                            <div className="profile-value-userprofile">{user.gender || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="profile-label-userprofile">Email</span>
                            <div className="profile-value-userprofile">{user.email || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="profile-label-userprofile">Phone Number</span>
                            <div className="profile-value-userprofile">{user.mobileNumber || user.phoneNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="profile-label-userprofile">Username</span>
                            <div className="profile-value-userprofile">{user.username || 'N/A'}</div>
                        </div>
                        <div style={{ gridColumn: "1 / span 3" }}>
                            <span className="profile-label-userprofile">Address</span>
                            <div className="profile-value-userprofile">{`${user.address || ''} ${user.city || ''}`.trim()}</div>
                        </div>
                        <div>
                            <span className="profile-label-userprofile">Status</span>
                            <div className={user.isOnline ? "profile-status-online profile-value-userprofile" : "profile-status-offline profile-value-userprofile"}>
                                {user.isOnline ? "Online" : "Offline"}
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions-userprofile">
                        {/* You might want to add an edit button here if you have edit functionality */}
                        {!user.isDeactivated ? (
                            <button className="deactivate-btn-userprofile" onClick={handleDeactivate}>Deactivate</button>
                        ) : (
                            <button className="reactivate-btn-userprofile" onClick={handleReactivate}>Reactivate</button>
                        )}
                    </div>
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
        </>
    );
};

export default ViewUser;