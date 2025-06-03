// Deprecated: Use logAuditFrontend.js instead.

import axios from 'axios';

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

/**
 * Sends an audit log entry to the backend API.
 * @param {Object} logData - The log data to send (action, user, details, etc.)
 * @returns {Promise}
 */
export function logAuditFrontend(logData) {
  axios.post(`${API_BASE}/api/auditlog`, logData).catch(() => {});
}
