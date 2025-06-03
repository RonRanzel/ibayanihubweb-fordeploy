import React, { useState } from "react";
import "../../../Styles/ModalStyles/sViewAdmin.css";
import ConfirmAlert from "./ConfirmAlert";
import Alert from "./Alert"; // <-- import the Alert component
import EditAdminProfile from "./EditAdminProfile";

const ViewAdmin = ({ admin, onClose, onStatusChange, onEdit, onProfileUpdate }) => {
    const [confirmAlert, setConfirmAlert] = useState({ open: false });
    const [errorAlert, setErrorAlert] = useState({ open: false, message: "" });
    const [showEdit, setShowEdit] = useState(false);

    if (!admin) return null;

    const formatBirthdate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d)) return 'Invalid Date';
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    // Wrap onStatusChange to catch possible errors and show alert if failed
    const wrappedOnStatusChange = async (id, deactivate) => {
        try {
            // If onStatusChange returns a Promise, await it
            const result = onStatusChange && (await onStatusChange(id, deactivate));
            // If onStatusChange throws, it will be caught by catch below
            // Optionally: you can check result for failure if you want
        } catch (error) {
            let message = "Failed to update admin status";
            if (error?.response?.data?.message) {
                message += `: ${error.response.data.message}`;
            } else if (error?.message) {
                message += `: ${error.message}`;
            }
            setErrorAlert({
                open: true,
                message,
            });
        }
    };

    const handleDeactivate = () => {
        setConfirmAlert({
            open: true,
            type: "warning",
            title: "Deactivate Admin",
            message: "Are you sure you want to deactivate this admin? They will lose access to the platform.",
            confirmText: "Deactivate",
            cancelText: "Cancel",
            onConfirm: async () => {
                setConfirmAlert({ open: false });
                await wrappedOnStatusChange(admin._id, true);
            }
        });
    };

    const handleReactivate = () => {
        setConfirmAlert({
            open: true,
            type: "success",
            title: "Reactivate Admin",
            message: "Are you sure you want to reactivate this admin? They will regain access to the platform.",
            confirmText: "Reactivate",
            cancelText: "Cancel",
            onConfirm: async () => {
                setConfirmAlert({ open: false });
                await wrappedOnStatusChange(admin._id, false);
            }
        });
    };

    return (
        <>
            {showEdit ? (
                <EditAdminProfile
                    admin={admin}
                    onClose={() => setShowEdit(false)}
                    onSave={updatedAdmin => {
                        setShowEdit(false);
                        if (onProfileUpdate) onProfileUpdate(updatedAdmin);
                    }}
                />
            ) : (
            <div className="modal-overlay-adminprofile">
                <div className="modal-content-adminprofile">
                    <div className="profile-header-adminprofile">
                        <h2>
                            Admin <span className="profile-highlight-adminprofile">Profile</span>
                        </h2>
                        <button className="close-btn-adminprofile" onClick={onClose} aria-label="Close">&times;</button>
                    </div>

                    <div className="profile-picture-adminprofile">
                        <div className="circle-avatar-adminprofile"></div>
                    </div>

                    <div className="profile-details-grid-adminprofile">
                        <div>
                            <span className="profile-label-adminprofile">Name</span>
                            <div className="profile-value-adminprofile">{`${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`}</div>
                        </div>
                        <div>
                            <span className="profile-label-adminprofile">Birthdate</span>
                            <div className="profile-value-adminprofile">{formatBirthdate(admin.admin_dateOfBirth)}</div>
                        </div>
                        <div>
                            <span className="profile-label-adminprofile">Gender</span>
                            <div className="profile-value-adminprofile">{admin.admin_gender || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="profile-label-adminprofile">Email</span>
                            <div className="profile-value-adminprofile">{admin.admin_email || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="profile-label-adminprofile">Phone Number</span>
                            <div className="profile-value-adminprofile">{admin.admin_phoneNumber || 'N/A'}</div>
                        </div>
                        <div>
                            <span className="profile-label-adminprofile">Role</span>
                            <div className="profile-value-adminprofile">{admin.admin_role || 'N/A'}</div>
                        </div>
                        <div style={{gridColumn: "1 / span 3"}}>
                            <span className="profile-label-adminprofile">Address</span>
                            <div className="profile-value-adminprofile">{`${admin.admin_address || ''} ${admin.admin_city || ''}`.trim()}</div>
                        </div>
                        <div>
                            <span className="profile-label-adminprofile">Status</span>
                            <div className={admin.isOnline
                                ? "profile-status-online-adminprofile profile-value-adminprofile"
                                : "profile-status-offline-adminprofile profile-value-adminprofile"}>
                                {admin.isOnline ? "Online" : "Offline"}
                            </div>
                        </div>
                    </div>

                    <div className="profile-actions-adminprofile">
                        <button className="edit-btn-adminprofile" onClick={() => setShowEdit(true)}>Edit Profile</button>
                        {!admin.isDeactivated ? (
                            <button className="deactivate-btn-adminprofile" onClick={handleDeactivate}>Deactivate</button>
                        ) : (
                            <button className="reactivate-btn-adminprofile" onClick={handleReactivate}>Reactivate</button>
                        )}
                    </div>
                </div>
            </div>
            )}
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
            <Alert
                type="error"
                title="Failed"
                message={errorAlert.message}
                onClose={() => setErrorAlert({ open: false, message: "" })}
                okText="OK"
                cancelText=""
                // only show if errorAlert.open is true
                style={{ display: errorAlert.open ? undefined : "none" }}
            />
        </>
    );
};

export default ViewAdmin;