import React, { useState, useEffect } from "react";
import axios from 'axios';
import "../../Styles/sAdmin.css";
import searchIcon from "../../Assets/searchicon.svg";
import profIcon from "../../Assets/user_icon.png";
import addUserIcon from "../../Assets/addicon.svg";
import dlIcon from "../../Assets/downloadicon.svg";
import filterIcon from "../../Assets/filtericon.svg";
import AddAdmin from "./Modal/AddAdmin";
import ViewAdmin from "./Modal/ViewAdmin";
import ConfirmAlert from "./Modal/ConfirmAlert";
import { logAuditFrontend } from '../../logAuditFrontend';

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

const AdminManagement = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showViewAdminModal, setShowViewAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [confirmAlert, setConfirmAlert] = useState({ open: false, type: "warning", message: "", onConfirm: null });

  // Fetch all admins
  useEffect(() => {
    axios.get(`${API_BASE}/api/getAdmin`)
      .then(response => setAdmins(response.data))
      .catch(error => console.log("Error fetching admins:", error));
  }, []);

  // Fetch logged-in admin details
  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      axios.get(`${API_BASE}/api/getAdminByEmail/${email}`)
        .then(response => setLoggedInAdmin(response.data))
        .catch(error => console.log("Error fetching logged-in admin:", error));
    }
  }, []);

  // Live clock update
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = date =>
    date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

  const formatBirthdate = birthdate => {
    if (!birthdate) return 'MM/DD/YYYY';
    const d = new Date(birthdate);
    return isNaN(d) ? 'Invalid Date' : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const activeAdmins = admins.filter(admin => !admin.isDeactivated);
  const deactivatedAdmins = admins.filter(admin => admin.isDeactivated);

  const filteredAdmins = (activeTab === 'active' ? activeAdmins : deactivatedAdmins).filter(admin => {
    const fullName = `${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`.toLowerCase();
    const searchMatch =
      (admin.admin_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.includes(searchTerm.toLowerCase());

    const statusMatch =
      statusFilter === "All" ||
      (statusFilter === "Online" && admin.isOnline) ||
      (statusFilter === "Offline" && !admin.isOnline);

    return searchMatch && statusMatch;
  });

  // Use ConfirmAlert for deactivate/reactivate
  const handleAdminStatusChange = (adminId, deactivate) => {
    setConfirmAlert({
      open: true,
      type: deactivate ? "warning" : "success",
      title: deactivate ? "Deactivate Admin" : "Reactivate Admin",
      message: deactivate
        ? "Are you sure you want to deactivate this admin? They will lose access to the platform."
        : "Are you sure you want to reactivate this admin? They will regain access to the platform.",
      confirmText: deactivate ? "Deactivate" : "Reactivate",
      cancelText: "Cancel",
      onConfirm: () => {
        // Use new explicit endpoints for admin management
        const url = deactivate ? `${API_BASE}/api/deactivateAdmin` : `${API_BASE}/api/reactivateAdmin`;
        axios.post(url, { adminId })
          .then(() => {
            logAuditFrontend({
              userId: localStorage.getItem('adminEmail') || 'unknown',
              userType: 'admin',
              action: deactivate ? 'Deactivate Admin' : 'Reactivate Admin',
              details: `${deactivate ? 'Deactivated' : 'Reactivated'} admin with ID: ${adminId}`,
              platform: 'web'
            });
            axios.get(`${API_BASE}/api/getAdmin`).then((response) => setAdmins(response.data));
            setShowViewAdminModal(false);
            setConfirmAlert({ ...confirmAlert, open: false });
          })
          .catch((error) => {
            let msg = 'Failed to update admin status';
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

  // Download admins as CSV
  const handleDownloadAdmins = () => {
    const data = (activeTab === 'active' ? activeAdmins : deactivatedAdmins);
    if (!data.length) return alert('No admins to download.');
    logAuditFrontend({
      userId: localStorage.getItem('adminEmail') || 'unknown',
      userType: 'admin',
      action: 'Download Admins',
      details: `Downloaded ${activeTab} admins as CSV`,
      platform: 'web'
    });
    const headers = [
      'Full Name', 'Email', 'Role', 'Phone No.', 'Birthdate', 'Gender', 'Address', 'Status', 'Deactivated'
    ];
    const rows = data.map(admin => [
      `${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`.trim(),
      admin.admin_email || '',
      admin.admin_role || '',
      admin.admin_phoneNumber || '',
      admin.admin_dateOfBirth || '',
      admin.admin_gender || '',
      `${admin.admin_address || ''} ${admin.admin_city || ''}`.trim(),
      admin.isOnline ? 'Online' : 'Offline',
      admin.isDeactivated ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Set admin online status on mount/unmount
  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (!email) return;
    // Set online on mount
    axios.post(`${API_BASE}/api/setAdminStatus`, { email, status: true });
    // Set offline on tab close
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

  useEffect(() => {
    logAuditFrontend({
      userId: localStorage.getItem('adminEmail') || 'unknown',
      userType: 'admin',
      action: 'View Admin Management',
      details: 'Admin viewed the Admin Management panel',
      platform: 'web'
    });
  }, []);

  // Columns for Active and Deactivated tabs (per Image 4)
  const activeAdminListColumns = [
    { key: "fullName", label: "Name" },
    { key: "admin_email", label: "Email" },
    { key: "admin_role", label: "Role" },
    { key: "admin_dateOfBirth", label: "Birthdate" },
    { key: "admin_gender", label: "Gender" },
    { key: "admin_phoneNumber", label: "Phone Number" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Created At" },
    { key: "action", label: "Action" },
  ];
  const deactivatedAdminListColumns = [
    { key: "fullName", label: "Name" },
    { key: "admin_email", label: "Email" },
    { key: "admin_role", label: "Role" },
    { key: "admin_dateOfBirth", label: "Birthdate" },
    { key: "admin_gender", label: "Gender" },
    { key: "admin_phoneNumber", label: "Phone Number" },
    { key: "deactivatedAt", label: "Deactivated At" },
    { key: "action", label: "Action" },
  ];

  const renderAdminListRow = (admin, i, isDeactivated = false) => (
    <tr key={admin._id}>
      <td>
        {`${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_last_name || admin.admin_lastName || ''}`}
      </td>
      <td>{admin.admin_email || 'N/A'}</td>
      <td><b>{admin.admin_role || 'N/A'}</b></td>
      <td><b>{formatBirthdate(admin.admin_dateOfBirth)}</b></td>
      <td><b>{admin.admin_gender || 'N/A'}</b></td>
      <td><b>{admin.admin_phoneNumber || 'N/A'}</b></td>
      {isDeactivated ? (
        <td>
          {admin.deactivatedAt
            ? formatDate(admin.deactivatedAt)
            : admin.updatedAt
              ? formatDate(admin.updatedAt)
              : "N/A"}
        </td>
      ) : (
        <>
          <td>
            <span className={admin.isOnline ? "admin-status-label-online" : "admin-status-label-offline"}>
              {admin.isOnline ? "Online" : "Offline"}
            </span>
          </td>
          <td>
            {admin.createdAt
              ? formatDate(admin.createdAt)
              : "N/A"}
          </td>
        </>
      )}
      <td>
        <button
          className="admin-view-btn-list"
          onClick={() => {
            setSelectedAdmin(admin);
            setShowViewAdminModal(true);
            logAuditFrontend({
              userId: localStorage.getItem('adminEmail') || 'unknown',
              userType: 'admin',
              action: 'View Admin Profile',
              details: `Viewed admin profile: ${admin.admin_email} (${admin.admin_firstName} ${admin.admin_lastName})`,
              platform: 'web'
            });
          }}
        >
          View
        </button>
      </td>
    </tr>
  );

  // Handle admin profile update from modal
  const handleProfileUpdate = (updatedAdmin) => {
    setAdmins((prev) => prev.map(a => a._id === updatedAdmin._id ? updatedAdmin : a));
    setSelectedAdmin(updatedAdmin);
  };

  return (
    <div className="admins-container">
      {/* HEADER */}
      <div className="admins-header">
        <div className="admins-header-left">
          <div className="admins-date-time-box">
            <div className="admins-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="admins-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
          </div>
        </div>
        <div className="admins-title-main">Admin Management</div>
        <div className="admins-header-right">
          <div className="admins-admin-profile">
            <img src={profIcon} alt="User" className="admins-admin-img" />
            <div className="admins-admin-details">
              <span className="admins-admin-name">
                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
              </span>
              <span className="admins-admin-email">{loggedInAdmin?.admin_email || ''}</span>
            </div>
          </div>
        </div>
      </div>
      {/* TOP BAR */}
      <div className="admins-top-bar">
        <div className="admins-tabs">
          <button className={activeTab === 'active' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('active')}> Active Admins</button>
          <button className={activeTab === 'deactivated' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('deactivated')}>Deactivated Admins</button>
        </div>
        <div className="admins-search-container">
          <button className="admins-add-button" onClick={() => setShowAddAdminModal(true)}>
            <img src={addUserIcon} alt="Add User" />
            <span>Add Admin</span>
          </button>
          <div className="admins-searchbar">
            <img src={searchIcon} alt="Search" className="admins-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admins-search-input"
            />
          </div>
          <div className="admins-filter">
            <img src={filterIcon} className="admins-filter-icon" />
          </div>
          <button className="admins-download-button" onClick={handleDownloadAdmins}>
            <img src={dlIcon} alt="----" />
            <span>Download</span>
          </button>
        </div>
      </div>
      {/* ADMIN TABLE VIEW */}
      <div className="admins-content-table-view">
        <table className="admin-table">
          <thead>
            <tr>
              {(activeTab === 'active' ? activeAdminListColumns : deactivatedAdminListColumns).map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'active'
              ? activeAdmins.map((admin, i) => renderAdminListRow(admin, i, false))
              : deactivatedAdmins.map((admin, i) => renderAdminListRow(admin, i, true))
            )}
            {(activeTab === 'active' ? activeAdmins : deactivatedAdmins).length === 0 && (
              <tr>
                <td colSpan={(activeTab === 'active' ? activeAdminListColumns.length : deactivatedAdminListColumns.length)} style={{ textAlign: 'center', fontWeight: 500 }}>
                  No admins found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD ADMIN MODAL */}
      {showAddAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setShowAddAdminModal(false)}>X</button>
            <AddAdmin onClose={() => setShowAddAdminModal(false)} />
          </div>
        </div>
      )}

      {/* VIEW ADMIN MODAL */}
      {showViewAdminModal && selectedAdmin && (
        <div className="modal-overlay">
          <div className="modal-content">
            <ViewAdmin
              admin={selectedAdmin}
              onClose={() => setShowViewAdminModal(false)}
              onStatusChange={handleAdminStatusChange}
              onProfileUpdate={handleProfileUpdate}
            />
          </div>
        </div>
      )}

      {/* Confirm Alert Modal */}
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
    </div>
  );
};

export default AdminManagement;