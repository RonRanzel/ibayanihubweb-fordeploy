import React, { useState } from "react";
import "../../../Styles/ModalStyles/sViewAdmin.css";
import axios from "axios";

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

const EditAdminProfile = ({ admin, onClose, onSave }) => {
  const [form, setForm] = useState({
    admin_firstName: admin.admin_firstName || "",
    admin_middleName: admin.admin_middleName || "",
    admin_lastName: admin.admin_lastName || "",
    admin_dateOfBirth: admin.admin_dateOfBirth || "",
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
    <div className="modal-overlay-adminprofile">
      <div className="modal-content-adminprofile">
        <div className="profile-header-adminprofile">
          <h2>Edit <span className="profile-highlight-adminprofile">Admin Profile</span></h2>
          <button className="close-btn-adminprofile" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="profile-details-grid-adminprofile">
          <div>
            <span className="profile-label-adminprofile">First Name</span>
            <input name="admin_firstName" value={form.admin_firstName} onChange={handleChange} required />
          </div>
          <div>
            <span className="profile-label-adminprofile">Middle Name</span>
            <input name="admin_middleName" value={form.admin_middleName} onChange={handleChange} />
          </div>
          <div>
            <span className="profile-label-adminprofile">Last Name</span>
            <input name="admin_lastName" value={form.admin_lastName} onChange={handleChange} required />
          </div>
          <div>
            <span className="profile-label-adminprofile">Birthdate</span>
            <input name="admin_dateOfBirth" type="date" value={form.admin_dateOfBirth} onChange={handleChange} required />
          </div>
          <div>
            <span className="profile-label-adminprofile">Gender</span>
            <select name="admin_gender" value={form.admin_gender} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <span className="profile-label-adminprofile">Role</span>
            <input name="admin_role" value={form.admin_role} onChange={handleChange} required />
          </div>
          <div>
            <span className="profile-label-adminprofile">Email</span>
            <input name="admin_email" value={form.admin_email} onChange={handleChange} required />
          </div>
          <div>
            <span className="profile-label-adminprofile">Phone Number</span>
            <input name="admin_phoneNumber" value={form.admin_phoneNumber} onChange={handleChange} required />
          </div>
          <div style={{gridColumn: "1 / span 3"}}>
            <span className="profile-label-adminprofile">Address</span>
            <input name="admin_address" value={form.admin_address} onChange={handleChange} required />
          </div>
          <div style={{gridColumn: "1 / span 3"}}>
            <span className="profile-label-adminprofile">City</span>
            <input name="admin_city" value={form.admin_city} onChange={handleChange} required />
          </div>
          {error && <div style={{color: 'red', gridColumn: '1 / span 3'}}>{error}</div>}
          <div style={{gridColumn: "1 / span 3", textAlign: 'right'}}>
            <button type="submit" className="edit-btn-adminprofile" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminProfile;
