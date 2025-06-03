import React, { useState, useEffect } from "react";
import axios from 'axios';
import "../../Styles/sUsers.css";
import searchIcon from "../../Assets/search_icon.png";
import profIcon from "../../Assets/user_icon.png";
import addUserIcon from "../../Assets/adduser.png";
import AddAdmin from "./Modal/AddAdmin";
import ViewAdmin from "./Modal/ViewAdmin";
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
    date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const formatTime = date => date.toLocaleTimeString("en-US");

  const formatBirthdate = birthdate => {
    if (!birthdate) return 'MM/DD/YYYY';
    const d = new Date(birthdate);
    return isNaN(d) ? 'Invalid Date' : d.toLocaleDateString("en-US");
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

  const handleAdminStatusChange = (adminId, deactivate) => {
    const url = deactivate ? `${API_BASE}/api/deactivate` : `${API_BASE}/api/reactivate`;
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
      })
      .catch((error) => alert('Failed to update admin status'));
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
    a.download = `admins_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
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
            placeholder="Search by name, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
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
          <p className="title">Admins</p>
          <p className="count">({activeTab === 'active' ? activeAdmins.length : deactivatedAdmins.length})</p>
        </div>
        <div className="users-filters">
          <button className={activeTab === 'active' ? 'active-tab' : ''} onClick={() => setActiveTab('active')}>Active</button>
          <button className={activeTab === 'deactivated' ? 'active-tab' : ''} onClick={() => setActiveTab('deactivated')}>Deactivated</button>
          <button className="add-user-button" onClick={() => setShowAddAdminModal(true)}>
            <span>Add Admin</span>
            <img src={addUserIcon} alt="Add Admin" />
          </button>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
          <button className="download-button" onClick={handleDownloadAdmins}>Download</button>
        </div>
      </div>

      {/* ADMIN LIST */}
      <div className="users-content list-view">
        {activeTab === 'active' ? (
          activeAdmins.length === 0 ? (
            <p>No admins found</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone No.</th>
                  <th>Birthdate</th>
                  <th>Gender</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeAdmins.map((admin, index) => (
                  <tr key={admin._id}>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{`${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`}</td>
                    <td>{admin.admin_email || 'N/A'}</td>
                    <td>{admin.admin_role || 'N/A'}</td>
                    <td>{admin.admin_phoneNumber || 'N/A'}</td>
                    <td>{formatBirthdate(admin.admin_dateOfBirth)}</td>
                    <td>{admin.admin_gender || 'N/A'}</td>
                    <td>{admin.admin_address || ''} {admin.admin_city || ''}</td>
                    <td>
                      <span className={admin.isOnline ? "status-online" : "status-offline"}>
                        {admin.isOnline ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-button"
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
                ))}
              </tbody>
            </table>
          )
        ) : (
          deactivatedAdmins.length === 0 ? (
            <p>No deactivated admins</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone No.</th>
                  <th>Birthdate</th>
                  <th>Gender</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deactivatedAdmins.map((admin, index) => (
                  <tr key={admin._id}>
                    <td>{String(index + 1).padStart(2, '0')}</td>
                    <td>{`${admin.admin_firstName || ''} ${admin.admin_middleName || ''} ${admin.admin_lastName || ''}`}</td>
                    <td>{admin.admin_email || 'N/A'}</td>
                    <td>{admin.admin_role || 'N/A'}</td>
                    <td>{admin.admin_phoneNumber || 'N/A'}</td>
                    <td>{formatBirthdate(admin.admin_dateOfBirth)}</td>
                    <td>{admin.admin_gender || 'N/A'}</td>
                    <td>{admin.admin_address || ''} {admin.admin_city || ''}</td>
                    <td>
                      <span className={admin.isOnline ? "status-online" : "status-offline"}>
                        {admin.isOnline ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-button"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowViewAdminModal(true);
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
            <ViewAdmin admin={selectedAdmin} onClose={() => setShowViewAdminModal(false)} onStatusChange={handleAdminStatusChange} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;