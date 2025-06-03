import React, { useState } from 'react';
import axios from 'axios';
import '../../../Styles/ModalStyles/sAddUser.css';
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
    <div className="add-user-container">
      <h2>Add New Admin</h2>
      <form className="add-user-form" onSubmit={handleSubmit}>
        <input type="email" name="admin_email" placeholder="Email" onChange={handleChange} required />
        <input type="tel" name="admin_phoneNumber" placeholder="Phone Number" onChange={handleChange} required />
        <input type="password" name="admin_password" placeholder="Password" onChange={handleChange} required />
        <input type="text" name="admin_firstName" placeholder="First Name" onChange={handleChange} required />
        <input type="text" name="admin_middleName" placeholder="Middle Name" onChange={handleChange} />
        <input type="text" name="admin_lastName" placeholder="Last Name" onChange={handleChange} required />
        <select name="admin_role" onChange={handleChange} required>
          <option value="">Select Role</option>
          <option value="Head Admin">Head Admin</option>
          <option value="Staff Admin">Staff Admin</option>
        </select>
        <input type="date" name="admin_dateOfBirth" onChange={handleChange} required />
        <select name="admin_gender" onChange={handleChange} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <select name="admin_city" onChange={handleChange} required>
          <option value="">Select City/Municipal</option>
          <option value="Manila">Manila</option>
        </select>
        <input type="text" name="admin_address" placeholder="Home No. & Street Address" onChange={handleChange} />
        <button type="submit">Submit</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default AddAdmin;
