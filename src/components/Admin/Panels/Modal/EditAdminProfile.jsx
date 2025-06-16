import React, { useState } from "react";
import "../../../Styles/ModalStyles/sEditAdmin.css";
import axios from "axios";
import Hide from "../../../Assets/hide.svg";

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

const cityOptions = [
  'Caloocan', 'Quezon City', 'Marikina', 'Manila', 'Makati', 'Pasig', 'Mandaluyong',
  'San Juan', 'Pasay', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Malabon', 'Navotas', 'Valenzuela'
];
const roleOptions = ['Head Admin', 'Staff Admin'];

const EditAdminProfile = ({ admin, onClose, onSave }) => {
  const [form, setForm] = useState({
    admin_firstName: admin.admin_firstName || "",
    admin_middleName: admin.admin_middleName || "",
    admin_lastName: admin.admin_lastName || "",
    admin_dateOfBirth: admin.admin_dateOfBirth ? admin.admin_dateOfBirth.slice(0, 10) : "",
    admin_role: admin.admin_role || "",
    admin_gender: admin.admin_gender || "",
    admin_city: admin.admin_city || "",
    admin_address: admin.admin_address || "",
    admin_phoneNumber: admin.admin_phoneNumber || "",
    admin_email: admin.admin_email || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/editAdminProfile`, {
        adminId: admin._id,
        updates: form
      });
      setLoading(false);
      if (onSave) onSave(res.data.admin);
      if (onClose) onClose();
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.message || err.message || "Failed to update profile"
      );
    }
  };

  return (
    <div className="modal-overlay-editadmin">
      <div className="modal-content-editadmin">
        <div className="editadmin-header">
          <h2>
            <span className="editadmin-highlight">Edit</span> Admin Account
          </h2>
          <button className="editadmin-close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="editadmin-form" autoComplete="off">
          <div className="editadmin-row">
            <div className="editadmin-group">
              <label>Email</label>
              <input
                name="admin_email"
                value={form.admin_email}
                onChange={handleChange}
                required
                type="email"
                disabled
                style={{ background: "#f2f2f2", color: "#888" }}
              />
            </div>
            <div className="editadmin-group">
              <label>Password</label>
              <div className="editadmin-password-wrapper input-with-icon">
                <input
                  type="password"
                  placeholder="Disabled"
                  value="Disabled"
                  disabled
                  style={{ background: "#f2f2f2", color: "#888" }}
                />
                <span className="editadmin-show-hide-icon">
                  <img
                    src={Hide}
                    alt="Hide password"
                    style={{width: 22, height: 22, opacity: 0.7, cursor: 'not-allowed'}}
                  />
                </span>
              </div>
            </div>
          </div>
          <div className="editadmin-row">
            <div className="editadmin-group">
              <label>First Name</label>
              <input
                name="admin_firstName"
                value={form.admin_firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="editadmin-group">
              <label>Middle Name</label>
              <input
                name="admin_middleName"
                value={form.admin_middleName}
                onChange={handleChange}
              />
            </div>
            <div className="editadmin-group">
              <label>Last Name</label>
              <input
                name="admin_lastName"
                value={form.admin_lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="editadmin-row">
            <div className="editadmin-group">
              <label>Phone Number</label>
              <input
                name="admin_phoneNumber"
                value={form.admin_phoneNumber}
                onChange={handleChange}
                required
                type="tel"
              />
            </div>
            <div className="editadmin-group">
              <label>Date of Birth</label>
              <input
                name="admin_dateOfBirth"
                type="date"
                value={form.admin_dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="editadmin-group">
              <label>Gender</label>
              <select
                name="admin_gender"
                value={form.admin_gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>
          <div className="editadmin-row">
            <div className="editadmin-group">
              <label>Role</label>
              <select
                name="admin_role"
                value={form.admin_role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                {roleOptions.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="editadmin-group">
              <label>Address</label>
              <input
                name="admin_address"
                value={form.admin_address}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="editadmin-row">
            <div className="editadmin-group" style={{flex: 1}}>
              <label>City</label>
              <select
                name="admin_city"
                value={form.admin_city}
                onChange={handleChange}
                required
              >
                <option value="">Select City/Municipal</option>
                {cityOptions.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="editadmin-error">{error}</div>}
          <div className="editadmin-footer">
            <button type="submit" className="editadmin-save-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminProfile;