import axios from 'axios';

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

export function logAuditFrontend(logData) {
  axios.post(`${API_BASE}/api/auditlog`, logData).catch(() => {});
}
