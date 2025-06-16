import React, { useState } from "react";
import "../../../Styles/ModalStyles/sViewAdmin.css";
import ConfirmAlert from "./ConfirmAlert";
import Alert from "./Alert";
import EditAdminProfile from "./EditAdminProfile";

const ViewAdmin = ({ admin, onClose, onStatusChange, onEdit, onProfileUpdate }) => {
    const [errorAlert, setErrorAlert] = useState({ open: false, message: "" });
    const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
    const [showEdit, setShowEdit] = useState(false);
    const [confirmAlert, setConfirmAlert] = useState({ open: false });

    if (!admin) return null;

    const formatBirthdate = (date) => {
        if (!date) return 'N/A';
        const d = new Date(date);
        if (isNaN(d)) return 'Invalid Date';
        return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    // Only allow deactivate/reactivate from inside ViewAdmin, not from list page!
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
                try {
                    await onStatusChange(admin._id, true);
                    setSuccessAlert({ open: true, message: "Deactivate Successfully" });
                } catch (error) {
                    let message = "Failed to update admin status";
                    if (error?.response?.data?.message) {
                        message += `: ${error.response.data.message}`;
                    } else if (error?.message) {
                        message += `: ${error.message}`;
                    }
                    setErrorAlert({ open: true, message });
                }
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
                try {
                    await onStatusChange(admin._id, false);
                    setSuccessAlert({ open: true, message: "Reactivate Successfully" });
                } catch (error) {
                    let message = "Failed to update admin status";
                    if (error?.response?.data?.message) {
                        message += `: ${error.response.data.message}`;
                    } else if (error?.message) {
                        message += `: ${error.message}`;
                    }
                    setErrorAlert({ open: true, message });
                }
            }
        });
    };

    const fullName = `${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`.replace(/\s+/g, ' ').trim();
    const address = `${admin.admin_address || ''} ${admin.admin_city || ''}`.replace(/\s+/g, ' ').trim();

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
                    <div className="profile-info-row-adminprofile">
                        <div className="profile-picture-adminprofile">
                            <div className="circle-avatar-adminprofile"></div>
                        </div>
                        <div className="profile-main-details-adminprofile">
                            <div className="profile-main-name-adminprofile">
                                {fullName}
                                <span className={admin.isOnline ? "profile-status-online-adminprofile" : "profile-status-offline-adminprofile"} style={{marginLeft:16, fontWeight:600, fontSize: "1.08rem"}}>
                                    {admin.isOnline ? "Online" : "Offline"}
                                </span>
                            </div>
                            <div className="profile-main-meta-adminprofile">
                                <span>{admin.admin_role || "N/A"}</span>
                                <span className="profile-sep-adminprofile">|</span>
                                <span>{admin.admin_phoneNumber ? `(+63) ${String(admin.admin_phoneNumber).replace(/^0/, "")}` : "N/A"}</span>
                                <span className="profile-sep-adminprofile">|</span>
                                <span>{admin.admin_email || "N/A"}</span>
                                <span className="profile-sep-adminprofile">|</span>
                                <span>{address}</span>
                            </div>
                        </div>
                    </div>
                    <div className="profile-actions-adminprofile">
                        <button className="edit-btn-adminprofile" onClick={() => setShowEdit(true)}>Edit Admin</button>
                        {!admin.isDeactivated ? (
                            <button className="deactivate-btn-adminprofile" onClick={handleDeactivate}>Deactivate</button>
                        ) : (
                            <button className="reactivate-btn-adminprofile" onClick={handleReactivate}>Reactivate</button>
                        )}
                    </div>
                    <div className="profile-card-adminprofile">
                        <div className="profile-section-title-adminprofile">Personal Information</div>
                        <div className="profile-details-row-adminprofile">
                            <div>
                                <span className="profile-label-adminprofile">Name</span>
                                <div className="profile-value-adminprofile">{fullName}</div>
                            </div>
                            <div>
                                <span className="profile-label-adminprofile">Gender</span>
                                <div className="profile-value-adminprofile">{admin.admin_gender || 'N/A'}</div>
                            </div>
                            <div>
                                <span className="profile-label-adminprofile">Birthdate</span>
                                <div className="profile-value-adminprofile">{formatBirthdate(admin.admin_dateOfBirth)}</div>
                            </div>
                            <div>
                                <span className="profile-label-adminprofile">Address</span>
                                <div className="profile-value-adminprofile">{address}</div>
                            </div>
                            <div>
                                <span className="profile-label-adminprofile">Role</span>
                                <div className="profile-value-adminprofile">{admin.admin_role || "N/A"}</div>
                            </div>
                        </div>
                        <div className="profile-section-title-adminprofile" style={{marginTop: "1.1em"}}>Account Information</div>
                        <div className="profile-details-row-adminprofile">
                            <div>
                                <span className="profile-label-adminprofile">Email</span>
                                <div className="profile-value-adminprofile">{admin.admin_email || "N/A"}</div>
                            </div>
                            <div>
                                <span className="profile-label-adminprofile">Phone Number</span>
                                <div className="profile-value-adminprofile">{admin.admin_phoneNumber ? `(+63) ${String(admin.admin_phoneNumber).replace(/^0/, "")}` : "N/A"}</div>
                            </div>
                        </div>
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
                type="success"
                title="Success"
                message={successAlert.message}
                open={successAlert.open}
                onClose={() => setSuccessAlert({ open: false, message: "" })}
                duration={2000}
            />
            <Alert
                type="error"
                title="Failed"
                message={errorAlert.message}
                open={errorAlert.open}
                onClose={() => setErrorAlert({ open: false, message: "" })}
                okText="OK"
                cancelText=""
            />
        </>
    );
};

export default ViewAdmin;