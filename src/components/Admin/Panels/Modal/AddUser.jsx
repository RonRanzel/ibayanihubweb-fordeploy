import React, { useState } from 'react';
import axios from 'axios';
import '../../../Styles/ModalStyles/sAddUser.css';
import { logAuditFrontend } from '../../../logAuditFrontend';

const AddUser = ({ onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    parish: '',
    gender: '',
    civilStatus: '',
    city: '',
    address: '',
    mobileNumber: '',
    password: '',
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
        await axios.post('https://ibayanihubweb-backend.onrender.com/api/addUser', formData);
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'Add User',
            details: `Added user: ${formData.username}`,
            platform: 'web'
        });
        alert('User added successfully!');
        onClose();
    } catch (error) {
        console.error('Error adding user:', error);
        if (error.response && error.response.data && error.response.data.error) {
            alert(`Failed to add user: ${error.response.data.error}`);
        } else {
            alert('Failed to add user due to server error!');
        }
    }
};


  return (
    <div className="add-user-container">
      <h2>Add New User</h2>
      <form className="add-user-form" onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        <input type="tel" name="mobileNumber" placeholder="Mobile Number" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
        <input type="text" name="middleName" placeholder="Middle Name" onChange={handleChange} />
        <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
        <input type="date" name="dateOfBirth" onChange={handleChange} required />
        <select name="gender" onChange={handleChange} required>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <select name="civilStatus" onChange={handleChange} required>
          <option value="">Select Civil Status</option>
          <option value="Single">Single</option>
          <option value="In a Relationship">In a Relationship</option>
          <option value="Married">Married</option>
          <option value="Widowed">Widowed</option>
        </select>
        <select name="parish" onChange={handleChange} required>
          <option value="">Select Parish</option>
          <option value="ST. ANTHONY DE PADUA (SINGALONG)">St. Anthony De Padua Singalong</option>
        </select>
        <select name="city" onChange={handleChange} required>
          <option value="">Select City/Municipal</option>
          <option value="Manila">Manila</option>
        </select>
        <input type="text" name="address" placeholder="Home No. & Street Address" onChange={handleChange} />
        <button type="submit">Submit</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  );
};

export default AddUser;
