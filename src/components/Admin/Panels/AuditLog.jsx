import React, { useEffect, useState } from 'react';
import { logAuditFrontend } from '../../logAuditFrontend';
import axios from 'axios';
import searchIcon from "../../Assets/searchicon.svg";
import dlIcon from "../../Assets/downloadicon.svg";
import profIcon from "../../Assets/user_icon.png";
import '../../Styles/sAudit.css';

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api";
const API_BASE = "https://ibayanihub-backend.onrender.com/api";

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('user');
  const [searchTerm, setSearchTerm] = useState("");
  const [dateTime, setDateTime] = useState(new Date());
  const [loggedInAdmin, setLoggedInAdmin] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem('adminEmail');
    if (email) {
      axios.get(`${WEB_API_BASE}/getAdminByEmail/${email}`)
        .then((response) => setLoggedInAdmin(response.data))
        .catch((error) => console.log("Error fetching logged-in admin:", error));
    }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem('auditLogViewed')) {
      logAuditFrontend({
        userId: localStorage.getItem('adminEmail') || 'unknown',
        userType: 'admin',
        action: 'View Audit Log',
        details: 'Visited Audit Log page',
        platform: 'web'
      });
      sessionStorage.setItem('auditLogViewed', 'true');
    }
    Promise.all([
      axios.get(`${WEB_API_BASE}/auditlog`),
      axios.get(`${API_BASE}/auditlog`)
    ]).then(([webRes, mobileRes]) => {
      const allLogsRaw = [...webRes.data, ...mobileRes.data];
      const seen = new Set();
      const allLogs = allLogsRaw.filter(log => {
        if (!log._id || seen.has(log._id)) return false;
        seen.add(log._id);
        return true;
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(allLogs);
      setLoading(false);
    }).catch(err => {
      setLoading(false);
      console.error('ERROR', err);
    });
  }, []);

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'user' && log.userType !== 'user') return false;
    if (activeTab === 'admin' && log.userType !== 'admin') return false;
    if (!searchTerm) return true;
    const hay = [
      log.userId, log.userType, log.action, log.details, log.platform
    ].map(v => (v || "").toString().toLowerCase()).join(" ");
    return hay.includes(searchTerm.toLowerCase());
  });

  const handleDownloadLogs = () => {
    if (!filteredLogs.length) return alert('No logs to download.');
    const headers = [
      'Timestamp', 'User/Admin', 'Type', 'Action', 'Details', 'Platform'
    ];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userId,
      log.userType,
      log.action,
      log.details,
      log.platform
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${String(x||'').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditlog_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="auditlog-container">
      <div className="auditlog-header">
        <div className="auditlog-header-left">
          <div className="auditlog-date-time-box">
            <div className="auditlog-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="auditlog-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
          </div>
        </div>
        <div className="auditlog-title-main">Audit Log</div>
        <div className="auditlog-header-right">
          <div className="auditlog-admin-profile">
            <img src={profIcon} alt="User" className="auditlog-admin-img" />
            <div className="auditlog-admin-details">
              <span className="auditlog-admin-name">
                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
              </span>
              <span className="auditlog-admin-email">{loggedInAdmin?.admin_email || ''}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auditlog-top-bar">
        <div className="auditlog-tabs">
          <button className={activeTab === 'user' ? 'auditlog-tab-btn auditlog-active-tab' : 'auditlog-tab-btn'} onClick={() => setActiveTab('user')}>User Logs</button>
          <button className={activeTab === 'admin' ? 'auditlog-tab-btn auditlog-active-tab' : 'auditlog-tab-btn'} onClick={() => setActiveTab('admin')}>Admin Logs</button>
        </div>
        <div className="auditlog-search-container">
          <div className="auditlog-searchbar">
            <img src={searchIcon} alt="Search" className="auditlog-search-icon" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="auditlog-search-input"
            />
          </div>
          <button className="auditlog-download-button" onClick={handleDownloadLogs}>
            <img src={dlIcon} alt="Download" />
            <span>Download</span>
          </button>
        </div>
      </div>
      <div className="auditlog-list-view">
        <div className="auditlog-table-scroll">
          {loading ? <p>Loading...</p> : (
            <table className="auditlog-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User/Admin</th>
                  <th>Type</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Platform</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', fontWeight: 500, color: '#888' }}>
                      No logs found
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, i) => (
                    <tr key={log._id || i}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.userId}</td>
                      <td>{log.userType}</td>
                      <td>{log.action}</td>
                      <td>{log.details}</td>
                      <td>{log.platform}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLog;