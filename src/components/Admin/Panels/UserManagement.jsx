import React, { useState, useEffect } from "react";
import axios from 'axios';
import "../../Styles/sUsers.css";
import searchIcon from "../../Assets/search_icon.png";
import profIcon from "../../Assets/user_icon.png";
import addUserIcon from "../../Assets/adduser.png";
import AddUser from "./Modal/AddUser";
import ViewUserModal from "./Modal/ViewUser"; // ➡️ Import ViewUserModal
import { logAuditFrontend } from '../../logAuditFrontend';

const API_BASE = "https://ibayanihubweb-backend.onrender.com"; 

const UserManagement = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [parishFilter, setParishFilter] = useState("All");
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showViewUserModal, setShowViewUserModal] = useState(false); // ➡️ NEW
    const [selectedUser, setSelectedUser] = useState(null); // ➡️ NEW
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [activeTab, setActiveTab] = useState('active');

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

    const formatDate = (date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formatTime = (date) => date.toLocaleTimeString("en-US");

    const formatBirthdate = (birthdate) => {
        if (!birthdate) return 'MM/DD/YYYY';
        const dateObj = new Date(birthdate);
        if (isNaN(dateObj)) return 'Invalid Date';
        return dateObj.toLocaleDateString("en-US");
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
            })
            .catch((error) => {
                let msg = 'Failed to update user status';
                if (error.response && error.response.data && error.response.data.message) {
                    msg += `: ${error.response.data.message}`;
                }
                alert(msg);
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

    return (
        <div id="users-container">
            {/* HEADER */}
            <div id="users-header-container">
                <div className="header-box date-box">
                    <p className="date">{formatDate(dateTime)}</p>
                    <p className="time">{formatTime(dateTime)}</p>
                </div>

                <div className="header-box search-box">
                    <input
                        type="text"
                        placeholder="Search by name, username, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <img src={searchIcon} alt="Search" />
                </div>

                <div className="header-box profile-box">
                    <img src={profIcon} alt="User" className="profile-icon" />
                    <div className="profile-info">
                        {loggedInAdmin ? (
                            <>
                                <p className="profile-name">
                                    {`${loggedInAdmin.admin_firstName} ${loggedInAdmin.admin_middleName || ''} ${loggedInAdmin.admin_lastName}`}
                                </p>
                                <p className="profile-email">{loggedInAdmin.admin_email}</p>
                            </>
                        ) : (
                            <>
                                <p className="profile-name">Loading...</p>
                                <p className="profile-email">Fetching admin data</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* TOP BAR */}
            <div className="users-top-bar">
                <div className="users-title">
                    <p className="title">Users</p>
                    <p className="count">({activeTab === 'active' ? activeUsers.length : deactivatedUsers.length})</p>
                </div>
                <div className="users-filters">
                    <button className={activeTab === 'active' ? 'active-tab' : ''} onClick={() => setActiveTab('active')}>Active</button>
                    <button className={activeTab === 'deactivated' ? 'active-tab' : ''} onClick={() => setActiveTab('deactivated')}>Deactivated</button>
                    <button className="add-user-button" onClick={() => setShowAddUserModal(true)}>
                        <span>Add User</span>
                        <img src={addUserIcon} alt="Add User" />
                    </button>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">Status</option>
                        <option value="Online">Online</option>
                        <option value="Offline">Offline</option>
                    </select>
                    <select value={parishFilter} onChange={(e) => setParishFilter(e.target.value)}>
                        <option value="All">Vicariate/Parish</option>
                        {parishOptions.map((parish, idx) => (
                            <option key={idx} value={parish}>{parish}</option>
                        ))}
                    </select>
                    <button className="download-button" onClick={handleDownloadUsers}>Download</button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="users-content list-view">
                {activeTab === 'active' ? (
                    activeUsers.length === 0 ? (
                        <p>No users found</p>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Username</th>
                                    <th>Phone No.</th>
                                    <th>Email</th>
                                    <th>Full Name</th>
                                    <th>Birthdate</th>
                                    <th>Gender</th>
                                    <th>Address</th>
                                    <th>Vicariate/Parish</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeUsers.map((user, index) => (
                                    <tr key={user._id}>
                                        <td>{String(index + 1).padStart(2, '0')}</td>
                                        <td>{user.username || 'N/A'}</td>
                                        <td>{user.mobileNumber || user.phoneNumber}</td>
                                        <td>{user.email || 'N/A'}</td>
                                        <td>{`${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`}</td>
                                        <td>{formatBirthdate(user.dateOfBirth)}</td>
                                        <td>{user.gender || 'N/A'}</td>
                                        <td>{user.address || 'N/A'} {user.city || 'N/A'}</td>
                                        <td>{user.parish || 'N/A'}</td>
                                        <td>
                                            <span className={user.isOnline ? "status-online" : "status-offline"}>
                                                {user.isOnline ? "Online" : "Offline"}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="view-button"
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
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    deactivatedUsers.length === 0 ? (
                        <p>No deactivated users</p>
                    ) : (
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Username</th>
                                    <th>Phone No.</th>
                                    <th>Email</th>
                                    <th>Full Name</th>
                                    <th>Birthdate</th>
                                    <th>Gender</th>
                                    <th>Address</th>
                                    <th>Vicariate/Parish</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deactivatedUsers.map((user, index) => (
                                    <tr key={user._id}>
                                        <td>{String(index + 1).padStart(2, '0')}</td>
                                        <td>{user.username || 'N/A'}</td>
                                        <td>{user.mobileNumber || user.phoneNumber}</td>
                                        <td>{user.email || 'N/A'}</td>
                                        <td>{`${user.firstName || ''} ${user.middleName || ''} ${user.lastName || ''}`}</td>
                                        <td>{formatBirthdate(user.dateOfBirth)}</td>
                                        <td>{user.gender || 'N/A'}</td>
                                        <td>{user.address || 'N/A'} {user.city || 'N/A'}</td>
                                        <td>{user.parish || 'N/A'}</td>
                                        <td>
                                            <span className={user.isOnline ? "status-online" : "status-offline"}>
                                                {user.isOnline ? "Online" : "Offline"}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="view-button"
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
                                ))}
                            </tbody>
                        </table>
                    )
                )}
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
                        <button className="close-button" onClick={() => setShowViewUserModal(false)}>X</button>
                        <ViewUserModal user={selectedUser} onClose={() => setShowViewUserModal(false)} onStatusChange={handleUserStatusChange} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
