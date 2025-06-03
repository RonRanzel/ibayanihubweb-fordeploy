import React from "react";
import "../../../Styles/ModalStyles/sViewUser.css";

const ViewUser = ({ user, onClose, onStatusChange }) => {
    if (!user) return null;

    const handleDeactivate = () => {
        if(window.confirm('Deactivate this user?')) {
            onStatusChange && onStatusChange(user._id, true);
        }
    };

    const handleReactivate = () => {
        if(window.confirm('Reactivate this user?')) {
            onStatusChange && onStatusChange(user._id, false);
        }
    };

    return (
        <div className="view-user-modal" role="dialog" aria-modal="true">
        <h2>User Details</h2>
        <div className="user-details">
            <p><strong>Username:</strong> {user.username || 'N/A'}</p>
            <p><strong>Phone Number:</strong> {user.mobileNumber || user.phoneNumber || 'N/A'}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p><strong>Full Name:</strong> {`${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`}</p>
            <p><strong>Birthdate:</strong> {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Gender:</strong> {user.gender || 'N/A'}</p>
            <p><strong>Address:</strong> {user.address || ''} {user.city || ''}</p>
            <p><strong>Vicariate/Parish:</strong> {user.parish || 'N/A'}</p>
            <p><strong>Status:</strong> {user.isOnline ? 'Online' : 'Offline'}{user.isDeactivated ? ' (Deactivated)' : ''}</p>
        </div>
        <div style={{marginTop: '1rem'}}>
            {!user.isDeactivated ? (
                <button className="deactivate-button" onClick={handleDeactivate}>Deactivate</button>
            ) : (
                <button className="reactivate-button" onClick={handleReactivate}>Reactivate</button>
            )}
            <button className="close-button" onClick={onClose}>Close</button>
        </div>
        </div>
    );
};

export default ViewUser;