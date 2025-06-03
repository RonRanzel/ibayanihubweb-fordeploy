import React, { useEffect, useState } from 'react';
import { logAuditFrontend } from '../../logAuditFrontend';
import axios from 'axios';

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api";
const API_BASE = "https://ibayanihub-backend.onrender.com/api";

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prevent double logging: only log once per session/mount
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
    // Fetch logs from both web and mobile backends using the constants
    Promise.all([
      axios.get(`${WEB_API_BASE}/auditlog`),
      axios.get(`${API_BASE}/auditlog`)
    ]).then(([webRes, mobileRes]) => {
      // Merge logs, remove duplicates by _id, and sort by timestamp descending
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

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Audit Log</h2>
      {loading ? <p>Loading...</p> : (
        <table className="users-table">
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
            {logs.map((log, i) => (
              <tr key={log._id || i}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.userId}</td>
                <td>{log.userType}</td>
                <td>{log.action}</td>
                <td>{log.details}</td>
                <td>{log.platform}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLog;
