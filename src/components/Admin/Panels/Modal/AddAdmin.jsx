import React, { useState } from 'react';
import axios from 'axios';
import '../../../Styles/ModalStyles/sAddAdmin.css';
import { logAuditFrontend } from '../../../logAuditFrontend';

const AddAdmin = ({ onClose }) => {
  const [formData, setFormData] = useState({
    admin_email: '',
    admin_firstName: '',
    admin_middleName: '',
    admin_lastName: '',
    admin_dateOfBirth: '',
    admin_role: '',
    admin_gender: '',
    admin_city: '',
    admin_address: '',
    admin_phoneNumber: '',
    admin_password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://ibayanihubweb-backend.onrender.com/api/addAdmin', formData);
      logAuditFrontend({
        userId: localStorage.getItem('adminEmail') || 'unknown',
        userType: 'admin',
        action: 'Add Admin',
        details: `Added admin: ${formData.admin_email}`,
        platform: 'web'
      });
      alert('Admin added successfully!');
      onClose();
    } catch (error) {
      console.error('Error adding admin:', error);
      if (error.response && error.response.data && error.response.data.error) {
        alert(`Failed to add admin: ${error.response.data.error}`);
      } else {
        alert('Failed to add admin due to server error!');
      }
    }
  };

  return (
    <div className="modal-overlay-admin">
      <div className="modal-content-admin">
        <div className="add-admin-header">
          <h2>
            <span className="highlight-admin">Add</span> Admin
          </h2>
          <button className="close-btn-admin" onClick={onClose} title="Close">
            &times;
          </button>
        </div>
        <form className="add-admin-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row-admin">
            <div className="form-group-admin">
              <label>Email</label>
              <input
                type="email"
                name="admin_email"
                placeholder="sample@email.com"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group-admin">
              <label>Password</label>
              <input
                type="password"
                name="admin_password"
                placeholder="Enter Password"
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-row-admin">
            <div className="form-group-admin">
              <label>First Name</label>
              <input
                type="text"
                name="admin_firstName"
                placeholder="Enter First Name"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group-admin">
              <label>Middle Name</label>
              <input
                type="text"
                name="admin_middleName"
                placeholder="Enter Middle Name"
                onChange={handleChange}
              />
            </div>
            <div className="form-group-admin">
              <label>Last Name</label>
              <input
                type="text"
                name="admin_lastName"
                placeholder="Enter Last Name"
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-row-admin">
            <div className="form-group-admin">
              <label>Phone Number</label>
              <input
                type="tel"
                name="admin_phoneNumber"
                placeholder="09XXXXXXXXX"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group-admin">
              <label>Date of Birth</label>
              <input
                type="date"
                name="admin_dateOfBirth"
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group-admin">
              <label>Gender</label>
              <select
                name="admin_gender"
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-row-admin">
            <div className="form-group-admin">
              <label>City/Municipal</label>
              <select
                name="admin_city"
                onChange={handleChange}
                required
              >
                <option value="">Select City/Municipal</option>
                <option value="Manila">Manila</option>
              </select>
            </div>
            <div className="form-group-admin">
              <label>Home No. & Street Address</label>
              <input
                type="text"
                name="admin_address"
                placeholder="Enter Address"
                onChange={handleChange}
              />
            </div>
            <div className="form-group-admin">
              <label>Role</label>
              <select
                name="admin_role"
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="Head Admin">Head Admin</option>
                <option value="Staff Admin">Staff Admin</option>
              </select>
            </div>
          </div>
          <div className="button-group-admin">
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAdmin;