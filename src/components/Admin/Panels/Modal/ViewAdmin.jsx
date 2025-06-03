import React from "react";
import "../../../Styles/ModalStyles/sViewUser.css"; // Reuse or create similar CSS for admin view

const ViewAdmin = ({ admin, onClose, onStatusChange }) => {
    if (!admin) return null;

    const handleDeactivate = () => {
        if(window.confirm('Deactivate this admin?')) {
            onStatusChange && onStatusChange(admin._id, true);
        }
    };

    const handleReactivate = () => {
        if(window.confirm('Reactivate this admin?')) {
            onStatusChange && onStatusChange(admin._id, false);
        }
    };

    return (
        <div className="view-user-modal" role="dialog" aria-modal="true">
            <h2>Admin Details</h2>
            <div className="user-details">
                <p><strong>Full Name:</strong> {`${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`}</p>
                <p><strong>Email:</strong> {admin.admin_email || 'N/A'}</p>
                <p><strong>Role:</strong> {admin.admin_role || 'N/A'}</p>
                <p><strong>Phone Number:</strong> {admin.admin_phoneNumber || 'N/A'}</p>
                <p><strong>Birthdate:</strong> {admin.admin_dateOfBirth ? new Date(admin.admin_dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Gender:</strong> {admin.admin_gender || 'N/A'}</p>
                <p><strong>Address:</strong> {admin.admin_address || ''} {admin.admin_city || ''}</p>
                <p><strong>Status:</strong> {admin.isOnline ? 'Online' : 'Offline'}{admin.isDeactivated ? ' (Deactivated)' : ''}</p>
            </div>
            <div style={{marginTop: '1rem'}}>
                {!admin.isDeactivated ? (
                    <button className="deactivate-button" onClick={handleDeactivate}>Deactivate</button>
                ) : (
                    <button className="reactivate-button" onClick={handleReactivate}>Reactivate</button>
                )}
                <button className="close-button" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default ViewAdmin;
