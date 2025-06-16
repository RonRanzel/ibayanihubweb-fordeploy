import React, { useState } from 'react';
import axios from 'axios';
import '../../../Styles/ModalStyles/sAddAdmin.css';
import Alert from './Alert';
import Show from '../../../Assets/show.svg';
import Hide from '../../../Assets/hide.svg';
import { logAuditFrontend } from '../../../logAuditFrontend';

const cityOptions = [
  'Caloocan', 'Quezon City', 'Marikina', 'Manila', 'Makati', 'Pasig', 'Mandaluyong',
  'San Juan', 'Pasay', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Malabon', 'Navotas', 'Valenzuela'
];

const validatePhone = (phone) => /^09\d{9}$/.test(phone);
const validateEmail = (email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) =>
  password.length >= 6 && /[A-Z]/.test(password) && /[!@#$%^&*]/.test(password);
const validateName = (name, required = false) =>
  !required && !name ? true : (name && name.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(name));
const validateAddress = (address) =>
  !address || (address.length >= 10 && !/[^a-zA-Z0-9\s,.'-]/.test(address));
const validateDOB = (dob) => {
  if (!dob) return false;
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
};

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
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [alertOkAction, setAlertOkAction] = useState(() => () => {});
  const [alertOkOnly, setAlertOkOnly] = useState(false);

  const handleShowAlert = (msg, type = "error", okCb, okOnly = false) => {
    setAlertMsg(msg);
    setAlertType(type);
    setAlertOpen(true);
    setAlertOkAction(() => okCb || (() => {}));
    setAlertOkOnly(okOnly);
  };

  const validateAll = () => {
    const errs = {};
    if (!validateEmail(formData.admin_email)) errs.admin_email = !formData.admin_email ? "Email is required" : "Invalid email";
    if (!validatePassword(formData.admin_password)) errs.admin_password = !formData.admin_password ? "Password is required" : "Min 6 chars, 1 uppercase, 1 special (!@#$%^&*)";
    if (!validateName(formData.admin_firstName, true)) errs.admin_firstName = !formData.admin_firstName ? "First name is required" : "At least 3 chars, letters only";
    if (formData.admin_middleName && !validateName(formData.admin_middleName, false)) errs.admin_middleName = "At least 3 chars, letters only";
    if (!validateName(formData.admin_lastName, true)) errs.admin_lastName = !formData.admin_lastName ? "Last name is required" : "At least 3 chars, letters only";
    if (!validatePhone(formData.admin_phoneNumber)) errs.admin_phoneNumber = !formData.admin_phoneNumber ? "Phone number is required" : "11 digits, starts with 09";
    if (!validateDOB(formData.admin_dateOfBirth)) errs.admin_dateOfBirth = !formData.admin_dateOfBirth ? "Date of Birth is required" : "Admin must be at least 18 years old";
    if (!formData.admin_gender) errs.admin_gender = "Gender is required";
    if (!formData.admin_city) errs.admin_city = "City is required";
    if (!validateAddress(formData.admin_address)) errs.admin_address = !formData.admin_address ? "Address is required" : "Min 10 chars, no special symbols";
    if (!formData.admin_role) errs.admin_role = "Role is required";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateAll();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      handleShowAlert("Please fix the errors in the form.", "error");
      return;
    }
    try {
      await axios.post('https://ibayanihubweb-backend.onrender.com/api/addAdmin', formData);
      logAuditFrontend({
        userId: localStorage.getItem('adminEmail') || 'unknown',
        userType: 'admin',
        action: 'Add Admin',
        details: `Added admin: ${formData.admin_email}`,
        platform: 'web'
      });
      handleShowAlert(
        "Admin added successfully!",
        "success",
        () => {
          setAlertOpen(false);
          onClose();
        },
        true
      );
    } catch (error) {
      let msg = "Failed to add admin due to server error!";
      if (error.response && error.response.data && error.response.data.error) {
        msg = `Failed to add admin: ${error.response.data.error}`;
      }
      handleShowAlert(msg, "error");
    }
  };

  return (
    <>
      <Alert
        open={alertOpen}
        message={alertMsg}
        type={alertType}
        onClose={() => {
          setAlertOpen(false);
          alertOkAction();
        }}
        okOnly={alertOkOnly}
      />
      <div className="modal-overlay-admin">
        <div className="modal-content-admin">
          <div className="add-admin-header">
            <h2>
              <span className="highlight-admin">Add</span> Admin Account
            </h2>
            <button className="close-btn-admin" onClick={onClose} title="Close">&times;</button>
          </div>
          <form className="add-admin-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="form-row-admin">
              <div className="form-group-admin">
                <label>Email</label>
                <input
                  type="email"
                  name="admin_email"
                  placeholder="sample@email.com"
                  value={formData.admin_email}
                  onChange={handleChange}
                  className={errors.admin_email ? 'input-error' : ''}
                  required
                />
                {errors.admin_email && <span className="error-message">{errors.admin_email}</span>}
              </div>
              <div className="form-group-admin">
                <label>Password</label>
                <div className="password-wrapper input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="admin_password"
                    placeholder="Enter Password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    className={errors.admin_password ? 'input-error' : ''}
                    required
                  />
                  <span className="show-hide-icon" onClick={() => setShowPassword(s => !s)}>
                    <img
                      src={showPassword ? Hide : Show}
                      alt={showPassword ? "Hide password" : "Show password"}
                      style={{width: 22, height: 22, opacity: 0.8, cursor: 'pointer'}}
                    />
                  </span>
                </div>
                {errors.admin_password && <span className="error-message">{errors.admin_password}</span>}
              </div>
            </div>
            <div className="form-row-admin">
              <div className="form-group-admin">
                <label>First Name</label>
                <input
                  type="text"
                  name="admin_firstName"
                  placeholder="Enter First Name"
                  value={formData.admin_firstName}
                  onChange={handleChange}
                  className={errors.admin_firstName ? 'input-error' : ''}
                  required
                />
                {errors.admin_firstName && <span className="error-message">{errors.admin_firstName}</span>}
              </div>
              <div className="form-group-admin">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="admin_middleName"
                  placeholder="Enter Middle Name"
                  value={formData.admin_middleName}
                  onChange={handleChange}
                  className={errors.admin_middleName ? 'input-error' : ''}
                />
                {errors.admin_middleName && <span className="error-message">{errors.admin_middleName}</span>}
              </div>
              <div className="form-group-admin">
                <label>Last Name</label>
                <input
                  type="text"
                  name="admin_lastName"
                  placeholder="Enter Last Name"
                  value={formData.admin_lastName}
                  onChange={handleChange}
                  className={errors.admin_lastName ? 'input-error' : ''}
                  required
                />
                {errors.admin_lastName && <span className="error-message">{errors.admin_lastName}</span>}
              </div>
            </div>
            <div className="form-row-admin">
              <div className="form-group-admin">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="admin_phoneNumber"
                  placeholder="09XXXXXXXXX"
                  value={formData.admin_phoneNumber}
                  onChange={handleChange}
                  className={errors.admin_phoneNumber ? 'input-error' : ''}
                  required
                />
                {errors.admin_phoneNumber && <span className="error-message">{errors.admin_phoneNumber}</span>}
              </div>
              <div className="form-group-admin">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="admin_dateOfBirth"
                  value={formData.admin_dateOfBirth}
                  onChange={handleChange}
                  className={errors.admin_dateOfBirth ? 'input-error' : ''}
                  required
                />
                {errors.admin_dateOfBirth && <span className="error-message">{errors.admin_dateOfBirth}</span>}
              </div>
              <div className="form-group-admin">
                <label>Gender</label>
                <select
                  name="admin_gender"
                  value={formData.admin_gender}
                  onChange={handleChange}
                  className={errors.admin_gender ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
                {errors.admin_gender && <span className="error-message">{errors.admin_gender}</span>}
              </div>
            </div>
            <div className="form-row-admin">
              <div className="form-group-admin">
                <label>Role</label>
                <select
                  name="admin_role"
                  value={formData.admin_role}
                  onChange={handleChange}
                  className={errors.admin_role ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Head Admin">Head Admin</option>
                  <option value="Staff Admin">Staff Admin</option>
                </select>
                {errors.admin_role && <span className="error-message">{errors.admin_role}</span>}
              </div>
              <div className="form-group-admin">
                <label>Address</label>
                <input
                  type="text"
                  name="admin_address"
                  placeholder="Enter Address"
                  value={formData.admin_address}
                  onChange={handleChange}
                  className={errors.admin_address ? 'input-error' : ''}
                  required
                />
                {errors.admin_address && <span className="error-message">{errors.admin_address}</span>}
              </div>
              <div className="form-group-admin">
                <label>City/Municipal</label>
                <select
                  name="admin_city"
                  value={formData.admin_city}
                  onChange={handleChange}
                  className={errors.admin_city ? 'input-error' : ''}
                  required
                >
                  <option value="">Select City/Municipal</option>
                  {cityOptions.map((city) => (
                    <option value={city} key={city}>{city}</option>
                  ))}
                </select>
                {errors.admin_city && <span className="error-message">{errors.admin_city}</span>}
              </div>
            </div>
            <div className="button-group-admin">
              <button type="submit">Create Admin Account</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddAdmin;