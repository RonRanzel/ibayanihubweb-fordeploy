import React, { useState, useEffect } from "react";
import axios from 'axios';
import "../../Styles/sUsers.css";
import searchIcon from "../../Assets/searchicon.svg";
import profIcon from "../../Assets/user_icon.png";
import addUserIcon from "../../Assets/addicon.svg";
import dlIcon from "../../Assets/downloadicon.svg";
import filterIcon from "../../Assets/filtericon.svg";
import AddUser from "./Modal/AddUser";
import ViewUserModal from "./Modal/ViewUser";
import ConfirmAlert from "./Modal/ConfirmAlert";
import Alert from "./Modal/Alert"; // <-- Import your Alert component
import { logAuditFrontend } from '../../logAuditFrontend';

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

const UserManagement = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [parishFilter, setParishFilter] = useState("All");
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showViewUserModal, setShowViewUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [activeTab, setActiveTab] = useState('active');
    const [confirmAlert, setConfirmAlert] = useState({ open: false, type: "warning", message: "", onConfirm: null });
    const [alertProps, setAlertProps] = useState({ open: false, message: "", type: "success", title: "" }); // <-- Alert state

    useEffect(() => {
        axios.get(`${API_BASE}/api/getUsers`)
            .then((response) => setUsers(response.data))
            .catch((error) => {
                console.log("Error fetching users:", error);
            });
    }, []);

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            axios.get(`${API_BASE}/api/getAdminByEmail/${email}`)
                .then((response) => setLoggedInAdmin(response.data))
                .catch((error) => {
                    console.log("Error fetching logged-in admin:", error);
                });
        }
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }) : "N/A";

    const formatBirthdate = (birthdate) => {
        if (!birthdate) return 'MM/DD/YYYY';
        const dateObj = new Date(birthdate);
        if (isNaN(dateObj)) return 'Invalid Date';
        return dateObj.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    };

    const parishOptions = [...new Set(users.map(user => user.parish).filter(p => p))];

    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.toLowerCase();
        const searchMatch =
            (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            fullName.includes(searchTerm.toLowerCase());

        const statusMatch = statusFilter === "All" ||
            (statusFilter === "Online" && user.isOnline) ||
            (statusFilter === "Offline" && !user.isOnline);

        const parishMatch = parishFilter === "All" || user.parish === parishFilter;

        return searchMatch && statusMatch && parishMatch;
    });

    const activeUsers = users.filter(user => !user.isDeactivated);
    const deactivatedUsers = users.filter(user => user.isDeactivated);

    const handleUserStatusChange = (userId, deactivate) => {
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
                const url = deactivate ? `${API_BASE}/api/deactivate` : `${API_BASE}/api/reactivate`;
                axios.post(url, { userId })
                    .then(() => {
                        logAuditFrontend({
                            userId: localStorage.getItem('adminEmail') || 'unknown',
                            userType: 'admin',
                            action: deactivate ? 'Deactivate User' : 'Reactivate User',
                            details: `${deactivate ? 'Deactivated' : 'Reactivated'} user with ID: ${userId}`,
                            platform: 'web'
                        });
                        axios.get(`${API_BASE}/api/getUsers`).then((response) => setUsers(response.data));
                        setShowViewUserModal(false);
                        setConfirmAlert({ ...confirmAlert, open: false });

                        // CUSTOM ALERT HERE
                        setAlertProps({
                            open: true,
                            message: deactivate ? "Account Deactivated" : "Account Reactivated",
                            type: "success",
                            title: "Success"
                        });
                    })
                    .catch((error) => {
                        let msg = 'Failed to update user status';
                        if (error.response && error.response.data && error.response.data.message) {
                            msg += `: ${error.response.data.message}`;
                        }
                        setConfirmAlert({
                            ...confirmAlert,
                            open: true,
                            type: "error",
                            title: "Failed",
                            message: msg,
                            confirmText: "OK",
                            cancelText: "",
                            onConfirm: () => setConfirmAlert({ ...confirmAlert, open: false }),
                        });
                    });
            }
        });
    };

    // Download users as CSV
    const handleDownloadUsers = () => {
        const data = (activeTab === 'active' ? activeUsers : deactivatedUsers);
        if (!data.length) return alert('No users to download.');
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'Download Users',
            details: `Downloaded ${activeTab} users as CSV`,
            platform: 'web'
        });
        const headers = [
            'Username', 'Phone No.', 'Email', 'Full Name', 'Birthdate', 'Gender', 'Address', 'Vicariate/Parish', 'Status', 'Deactivated'
        ];
        const rows = data.map(user => [
            user.username || '',
            user.mobileNumber || user.phoneNumber || '',
            user.email || '',
            `${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`.trim(),
            user.dateOfBirth || '',
            user.gender || '',
            `${user.address || ''} ${user.city || ''}`.trim(),
            user.parish || '',
            user.isOnline ? 'Online' : 'Offline',
            user.isDeactivated ? 'Yes' : 'No'
        ]);
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View User Management',
            details: 'Admin viewed the User Management panel',
            platform: 'web'
        });
    }, []);

    useEffect(() => {
        if (activeTab) {
            logAuditFrontend({
                userId: localStorage.getItem('adminEmail') || 'unknown',
                userType: 'admin',
                action: 'Switch User Tab',
                details: `Admin switched to ${activeTab} users tab`,
                platform: 'web'
            });
        }
    }, [activeTab]);

    // Set admin online status on mount/unmount (for user management panel)
    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (!email) return;
        axios.post(`${API_BASE}/api/setAdminStatus`, { email, status: true });
        const handleUnload = () => {
            navigator.sendBeacon && navigator.sendBeacon(
                `${API_BASE}/api/setAdminStatus`,
                JSON.stringify({ email, status: false })
            );
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            axios.post(`${API_BASE}/api/setAdminStatus`, { email, status: false });
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);

    // Auto-close the alert after 3 seconds
    useEffect(() => {
        if (alertProps.open) {
            const timer = setTimeout(() => {
                setAlertProps(props => ({ ...props, open: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [alertProps.open]);

    // Columns for Active and Deactivated tabs
    const activeUserListColumns = [
        { key: "fullName", label: "Name" },
        { key: "username", label: "Username" },
        { key: "mobileNumber", label: "Phone No." },
        { key: "email", label: "Email" },
        { key: "dateOfBirth", label: "Birthdate" },
        { key: "gender", label: "Gender" },
        { key: "civilStatus", label: "Civil Status" },
        { key: "address", label: "Address" },
        { key: "parish", label: "Vicariate/Parish" },
        { key: "isOnline", label: "Status" },
        { key: "createdAt", label: "Created At" },
        { key: "action", label: "Action" },
    ];
    const deactivatedUserListColumns = [
        { key: "fullName", label: "Name" },
        { key: "username", label: "Username" },
        { key: "mobileNumber", label: "Phone No." },
        { key: "email", label: "Email" },
        { key: "dateOfBirth", label: "Birthdate" },
        { key: "gender", label: "Gender" },
        { key: "civilStatus", label: "Civil Status" },
        { key: "address", label: "Address" },
        { key: "parish", label: "Vicariate/Parish" },
        { key: "deactivatedAt", label: "Deactivated At" },
        { key: "action", label: "Action" },
    ];

    const renderUserListRow = (user, isDeactivated = false) => {
        return (
            <tr key={user._id}>
                <td>
                    {`${user.firstName || ''} ${user.middleName ? user.middleName + " " : ""}${user.lastName || ''}`.trim()}
                </td>
                <td>{user.username || "N/A"}</td>
                <td>{user.mobileNumber || user.phoneNumber || "N/A"}</td>
                <td>{user.email || "N/A"}</td>
                <td>
                    {formatBirthdate(user.dateOfBirth)}
                </td>
                <td>{user.gender || "N/A"}</td>
                <td>{user.civilStatus || "N/A"}</td>
                <td>
                    {`${user.address || ''}${user.city ? ' ' + user.city : ''}`.trim() || "N/A"}
                </td>
                <td>{user.parish || "N/A"}</td>
                {isDeactivated ? (
                    <td>
                        {user.deactivatedAt
                            ? formatDate(user.deactivatedAt)
                            : user.updatedAt
                                ? formatDate(user.updatedAt)
                                : "N/A"}
                    </td>
                ) : (
                    <>
                        <td>
                            <span className={user.isOnline ? "status-label-online" : "status-label-offline"}>
                                {user.isOnline ? "Online" : "Offline"}
                            </span>
                        </td>
                        <td>
                            {user.createdAt
                                ? formatDate(user.createdAt)
                                : "N/A"}
                        </td>
                    </>
                )}
                <td>
                    <button
                        className="view-btn-list"
                        onClick={() => {
                            setSelectedUser(user);
                            setShowViewUserModal(true);
                            logAuditFrontend({
                                userId: localStorage.getItem('adminEmail') || 'unknown',
                                userType: 'admin',
                                action: 'View User Profile',
                                details: `Viewed user profile: ${user.username || ''} (${user.firstName || ''} ${user.lastName || ''})`,
                                platform: 'web'
                            });
                        }}
                    >
                        View
                    </button>
                </td>
            </tr>
        );
    };

    return (
        <div id="users-container">
            <div className="dashb-header">
                <div className="dashb-header-left">
                    <div className="dashb-date-time-box">
                        <div className="dashb-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="dashb-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
                    </div>
                </div>
                <div className="dashb-title-main">User Management</div>
                <div className="dashb-header-right">
                    <div className="dashb-admin-profile">
                        <img src={profIcon} alt="User" className="dashb-admin-img" />
                        <div className="dashb-admin-details">
                            <span className="dashb-admin-name">
                                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
                            </span>
                            <span className="dashb-admin-email">{loggedInAdmin?.admin_email || ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP BAR */}
            <div className="users-top-bar">
                <div className="users-tabs">
                    <button className={activeTab === 'active' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('active')}> Active Users</button>
                    <button className={activeTab === 'deactivated' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('deactivated')}>Deactivated Users</button>
                </div>
                <div className="users-search-container">
                    <button className="users-add-button" onClick={() => setShowAddUserModal(true)}>
                        <img src={addUserIcon} alt="Add User" />
                        <span>Add User</span>
                    </button>
                    <div className="users-searchbar">
                        <img src={searchIcon} alt="Search" className="users-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, username, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="users-search-input"
                        />
                    </div>
                    <div className="users-filter">
                        <img src={filterIcon} className="users-filter-icon" />
                    </div>
                    <button className="users-download-button" onClick={handleDownloadUsers}>
                        <img src={dlIcon} alt="----" />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {/* USER LIST VIEW --- Active and Deactivated */}
            <div className="users-content users-list-view">
                <table className="user-list-table">
                    <thead>
                        <tr>
                            {(activeTab === 'active' ? activeUserListColumns : deactivatedUserListColumns).map(col => (
                                <th key={col.key}>{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {(activeTab === 'active' ? activeUsers : deactivatedUsers).length === 0 ? (
                            <tr>
                                <td colSpan={(activeTab === 'active' ? activeUserListColumns.length : deactivatedUserListColumns.length)} style={{ textAlign: 'center', fontWeight: 500 }}>
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            (activeTab === 'active'
                                ? activeUsers.map(user => renderUserListRow(user, false))
                                : deactivatedUsers.map(user => renderUserListRow(user, true))
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="close-button" onClick={() => setShowAddUserModal(false)}>X</button>
                        <AddUser onClose={() => setShowAddUserModal(false)} />
                    </div>
                </div>
            )}

            {/* View User Modal */}
            {showViewUserModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <ViewUserModal user={selectedUser} onClose={() => setShowViewUserModal(false)} onStatusChange={handleUserStatusChange} />
                    </div>
                </div>
            )}

            {/* Confirm Alert */}
            <ConfirmAlert
                open={confirmAlert.open}
                title={confirmAlert.title}
                message={confirmAlert.message}
                type={confirmAlert.type}
                confirmText={confirmAlert.confirmText}
                cancelText={confirmAlert.cancelText}
                onConfirm={() => {
                    if (confirmAlert.onConfirm) confirmAlert.onConfirm();
                }}
                onCancel={() => setConfirmAlert({ ...confirmAlert, open: false })}
            />

            {/* Modern Success/Error Alert */}
            {alertProps.open && (
                <Alert
                    message={alertProps.message}
                    type={alertProps.type}
                    title={alertProps.title}
                    duration={3000}
                    onClose={() => setAlertProps({ ...alertProps, open: false })}
                />
            )}
        </div>
    );
};

export default UserManagement;