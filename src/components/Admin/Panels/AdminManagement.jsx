import React, { useState, useEffect, useRef } from "react";
import axios from 'axios';
import "../../Styles/sAdmin.css";
import "../../Styles/sHeader.css";
import searchIcon from "../../Assets/searchicon.svg";
import profIcon from "../../Assets/user_icon.png";
import addUserIcon from "../../Assets/addicon.svg";
import dlIcon from "../../Assets/downloadicon.svg";
import filterIcon from "../../Assets/filtericon.svg";
import AddAdmin from "./Modal/AddAdmin";
import ViewAdmin from "./Modal/ViewAdmin";
import { logAuditFrontend } from '../../logAuditFrontend';

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

const FILTER_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Online", label: "Online" },
  { value: "Offline", label: "Offline" },
];

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
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef();

  useEffect(() => {
    axios.get(`${API_BASE}/api/getAdmin`)
      .then(response => setAdmins(response.data))
      .catch(error => console.log("Error fetching admins:", error));
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      axios.get(`${API_BASE}/api/getAdminByEmail/${email}`)
        .then(response => setLoggedInAdmin(response.data))
        .catch(error => console.log("Error fetching logged-in admin:", error));
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close filter dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

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

  useEffect(() => {
    logAuditFrontend({
      userId: localStorage.getItem('adminEmail') || 'unknown',
      userType: 'admin',
      action: 'View Admin Management',
      details: 'Admin viewed the Admin Management panel',
      platform: 'web'
    });
  }, []);

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

  const handleProfileUpdate = (updatedAdmin) => {
    setAdmins((prev) => prev.map(a => a._id === updatedAdmin._id ? updatedAdmin : a));
    setSelectedAdmin(updatedAdmin);
  };

  // Handler passed to ViewAdmin for status changes:
  const handleAdminStatusChange = async (adminId, deactivate) => {
    const url = deactivate ? `${API_BASE}/api/deactivateAdmin` : `${API_BASE}/api/reactivateAdmin`;
    await axios.post(url, { adminId });
    logAuditFrontend({
      userId: localStorage.getItem('adminEmail') || 'unknown',
      userType: 'admin',
      action: deactivate ? 'Deactivate Admin' : 'Reactivate Admin',
      details: `${deactivate ? 'Deactivated' : 'Reactivated'} admin with ID: ${adminId}`,
      platform: 'web'
    });
    // Refresh admin list and selected admin preview
    const response = await axios.get(`${API_BASE}/api/getAdmin`);
    setAdmins(response.data);
    setSelectedAdmin(response.data.find(a => a._id === adminId));
    setShowViewAdminModal(false); // optional: close modal after action
  };

  return (
    <div className="admins-container">
      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <div className="header-cTitle">
            <p className="header-title">Admin Management</p>
          </div>
          <div className="header-cDateTime">
            <p className="header-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="header-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-cProf">
            <img src={profIcon} alt="User" className="header-img" />
            <div className="header-cName">
              <p className="header-name">{loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}</p>
              <p className="header-email">{loggedInAdmin?.admin_email || ''}</p>
            </div>
          </div>
        </div>
      </div>
      {/* TOP BAR */}
      <div className="admins-top-bar">
        <div className="admins-top-left">
          <div className="admins-tabs">
            <button className={activeTab === 'active' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('active')}> Active Admins</button>
            <button className={activeTab === 'deactivated' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('deactivated')}>Deactivated Admins</button>
          </div>
          <button className="admins-add-button" onClick={() => setShowAddAdminModal(true)}>
            <img src={addUserIcon} alt="Add User" />
            <span>Add Admin</span>
          </button>
        </div>
        <div className="admins-search-container">
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
          <div className="admins-filter" ref={filterRef}>
            <button className="admins-filter-btn" onClick={() => setFilterOpen((open) => !open)}>
              <img src={filterIcon} className="admins-filter-icon" alt="Filter" />
            </button>
            {filterOpen && (
              <div className="admins-filter-dropdown">
                {FILTER_OPTIONS.map(opt => (
                  <div
                    key={opt.value}
                    className={`admins-filter-option${statusFilter === opt.value ? " selected" : ""}`}
                    onClick={() => { setStatusFilter(opt.value); setFilterOpen(false); }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
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
              ? filteredAdmins.map((admin, i) => renderAdminListRow(admin, i, false))
              : filteredAdmins.map((admin, i) => renderAdminListRow(admin, i, true))
            )}
            {(activeTab === 'active' ? filteredAdmins : filteredAdmins).length === 0 && (
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
    </div>
  );
};

export default AdminManagement;