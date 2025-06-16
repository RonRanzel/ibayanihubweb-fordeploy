import React, { useState } from 'react';
import axios from 'axios';
import '../../../Styles/ModalStyles/sAddUser.css';
import Alert from './Alert';
import Show from '../../../Assets/show.svg';
import Hide from '../../../Assets/hide.svg';
import { logAuditFrontend } from '../../../logAuditFrontend';

// Reuse the same parishOptions and cityOptions as AddUser
const parishOptions = [/* ...same as your AddUser... */];
const cityOptions = [
  'Caloocan', 'Quezon City', 'Marikina', 'Manila', 'Makati', 'Pasig', 'Mandaluyong',
  'San Juan', 'Pasay', 'Parañaque', 'Las Piñas', 'Muntinlupa', 'Malabon', 'Navotas', 'Valenzuela'
];

const validateUsername = (username) =>
  username.length >= 5 && /^[a-zA-Z0-9_]+$/.test(username);
const validatePhone = (mobileNumber) =>
  /^09\d{9}$/.test(mobileNumber);
const validateEmail = (email) =>
  email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) =>
  !password || (password.length >= 6 && /[A-Z]/.test(password) && /[!@#$%^&*]/.test(password));
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
  return age >= 13;
};

const EditUser = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    firstName: user.firstName || '',
    middleName: user.middleName || '',
    lastName: user.lastName || '',
    dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
    email: user.email || '',
    parish: user.parish || '',
    gender: user.gender || '',
    civilStatus: user.civilStatus || '',
    city: user.city || '',
    address: user.address || '',
    mobileNumber: user.mobileNumber || user.phoneNumber || '',
    password: '', // blank means don't update
  });

  const parishOptions = [
    { group: 'VICARIATE OF SANTA CLARA DE MONTEFALCO', values: [
      'MARY, COMFORTER OF THE AFFLICTED',
      'OUR LADY OF FATIMA',
      'OUR LADY OF SORROWS',
      'OUR LADY OF THE MOST BLESSED SACRAMENT',
      'SAN ISIDRO LABRADOR',
      'SAN JUAN NEPOMUCENO',
      'SAN RAFAEL',
      'SAN ROQUE ( PASAY )',
      'STA. CLARA DE MONTEFALCO',
      'OUR LADY OF THE AIRWAYS'
    ]},
    { group: 'VICARIATE OF OUR LADY OF GUADALUPE', values: [
      'NATIONAL SHRINE OF OUR LADY OF GUADALUPE',
      'MATER DOLOROSA',
      'MARY, MIROR OF JUSTICE',
      'ST. JOHN MARY VIANNEY',
      'ST. JOHN OF THE CROSS',
      'STA. TERESITA'
    ]},
    { group: 'VICARIATE OF SAINTS PETER AND PAUL', values: [
      'HOLY CROSS',
      'NUESTRA SRA. DE GRACIA',
      'ST. JOHN BOSCO, (MAKATI)',
      'STS. PETER & PAUL',
      'NATIONAL SHRINE OF THE SACRED HEART OF JESUS',
      'OUR LADY OF LA PAZ'
    ]},
    { group: 'VICARIATE OF SAINT JOSEPH THE WORKER', values: [
      'HOLY FAMILY',
      'OUR LADY OF FATIMA',
      'ST. JOSEPH THE WORKER',
      'SAN ILDEFONSO'
    ]},
    { group: 'VICARIATE OF SAN FELIPE NERI', values: [
      'SAN FELIPE NERI',
      'SAN ROQUE ( MANDALUYONG )',
      'ST. DOMINIC SAVIO',
      'SACRED HEART OF JESUS',
      'PARISH OF OUR LADY OF ABANDONED',
      'OUR LADY OF FATIMA'
    ]},
    { group: 'VICARIATE OF SAINT JOHN THE BAPTIST', values: [
      'MARY THE QUEEN',
      'ST. JOHN THE BAPTIST',
      'SANTUARIO DE SAN JOSE',
      'SANTUARIO DE STO. CRISTO'
    ]},
    { group: 'VICARIATE OF HOLY FAMILY', values: [
      'SAGRADA FAMILIA',
      'PAROKYA NG INA NG LAGING SAKLOLO',
      'PARISH OF OUR LADY OF THE ABANDONED',
      'ST. ANTHONY DE PADUA ( SINGALONG )',
      'ST. PIUS X',
      'SANTISIMA TRINIDAD'
    ]},
    { group: 'VICARIATE OF NUESTRA SEÑORA DE GUIA', values: [
      'OUR LADY OF THE ASSUMPTION',
      'OUR LADY OF REMEDIES',
      'ARCHDIOCESAN SHRINE OF NESTRA SRA. DE GUIA',
      'SAN VICENTE DE PAUL',
      'SAN AGUSTIN',
      'STO. NIÑO DE BASECO'
    ]},
    { group: 'VICARIATE OF SANTO NIÑO', values: [
      'OUR LADY OF MOST HOLY ROSARY',
      'OUR LADY OF PEACE & GOOD VOYAGE',
      'ST. JOHN BOSCO, TONDO',
      'SAN PABLO APOSTOL',
      'STO. NIÑO ( TONDO )',
      'NUESTRA SRA. DE LA SOLEDAD'
    ]},
    { group: 'VICARIATE OF ESPIRITU SANTO', values: [
      'IMMACULATE CONCEPTION',
      'ARCHDIOCESA SHRINE OF ESPIRITU SANTO',
      'RISEN CHRIST',
      'STA. MONICA',
      'ST. JOSEPH',
      'SAN RAFAEL',
      'SAN ROQUE DE MANILA',
      'SAN JOSE MANGGAGAWA'
    ]},
    { group: 'VICARIATE OF SAN JOSE DE TROZO', values: [
      'STA. CRUZ',
      'NATIONAL SHRINE OF ST. JUDE',
      'SAN JOSE DE TROZO',
      'SAN SEBASTIAN',
      'ST. JOHN THE BAPTIST ( QUIAPO )',
      'NATIONAL SHRINE OF ST. MICHAEL & THE ARCHANGELS'
    ]},
    { group: 'VICARIATE OF OUR LADY OF LORETO', values: [
      'MOST HOLY TRINITY',
      'SACRED HEART OF JESUS, (STA. MESA)',
      'OUR LADY OF FATIMA ( BACOOD )',
      'ARCHDIOCESAN SHRINE OF OUR LADY OF LORETO',
      'SANTISIMO ROSARIO ( UST )',
      'SAN ROQUE ( SAMPALOC )',
      'NUESTRA SRA. DEL PERPETUO SOCORRO',
      'NUESTRA SRA. DE SALVACION'
    ]},
    { group: 'VICARIATE OF SAN FERNANDO DE DILAO', values: [
      'OUR LADY OF PEÑAFRANCIA',
      'ST. MARY GORETTI',
      'ST. PETER THE APOSTLE',
      'SAN FERNANDO DE DILAO',
      'STO. NIÑO ( PANDACAN )'
    ]}
  ];

  const [errors, setErrors] = useState({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [alertType, setAlertType] = useState("error");
  const [alertOkAction, setAlertOkAction] = useState(() => () => {});
  const [alertOkOnly, setAlertOkOnly] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleShowAlert = (msg, type = "error", okCb, okOnly = false) => {
    setAlertMsg(msg);
    setAlertType(type);
    setAlertOpen(true);
    setAlertOkAction(() => okCb || (() => {}));
    setAlertOkOnly(okOnly);
  };

  const validateAll = () => {
    const errs = {};
    if (!validateUsername(formData.username)) errs.username = !formData.username ? "Username is required" : "Username must be at least 5 characters (alphanumeric/underscore)";
    if (formData.password && !validatePassword(formData.password)) errs.password = "Min 6 chars, 1 uppercase, 1 special (!@#$%^&*)";
    if (!validateName(formData.firstName, true)) errs.firstName = !formData.firstName ? "First name is required" : "At least 3 chars, letters only";
    if (formData.middleName && !validateName(formData.middleName, false)) errs.middleName = "At least 3 chars, letters only";
    if (!validateName(formData.lastName, true)) errs.lastName = !formData.lastName ? "Last name is required" : "At least 3 chars, letters only";
    if (!validatePhone(formData.mobileNumber)) errs.mobileNumber = !formData.mobileNumber ? "Phone number is required" : "11 digits, starts with 09";
    if (!validateDOB(formData.dateOfBirth)) errs.dateOfBirth = !formData.dateOfBirth ? "Date of Birth is required" : "User must be at least 13 years old";
    if (formData.email && !validateEmail(formData.email)) errs.email = "Invalid email";
    if (!formData.city) errs.city = "City is required";
    if (!validateAddress(formData.address)) errs.address = !formData.address ? "Address is required" : "Min 10 chars, no special symbols";
    if (!formData.gender) errs.gender = "Gender is required";
    if (!formData.civilStatus) errs.civilStatus = "Civil status is required";
    if (!formData.parish) errs.parish = "Parish is required";
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
      await axios.put(`https://ibayanihubweb-backend.onrender.com/api/updateUser/${user._id}`, formData);
      logAuditFrontend({
        userId: localStorage.getItem('adminEmail') || 'unknown',
        userType: 'admin',
        action: 'Edit User',
        details: `Edited user: ${formData.username}`,
        platform: 'web'
      });
      handleShowAlert(
        "User updated successfully!",
        "success",
        () => {
          setAlertOpen(false);
          if (onSuccess) onSuccess();
          onClose();
          window.location.reload(); // Force refresh after closing
        },
        true
      );
    } catch (error) {
      let msg = "Failed to update user due to server error!";
      if (error.response && error.response.data && error.response.data.error) {
        msg = `Failed to update user: ${error.response.data.error}`;
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
      <div className="modal-overlay add-user-blur">
        <div className="modal-content add-user-modal-content">
          <div className="add-user-header">
            <h2>
              <span className="highlight">Edit</span> User Account
            </h2>
            <button className="close-btn" onClick={onClose} title="Close">&times;</button>
          </div>
          <form className="add-user-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter Username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'input-error' : ''}
                  required
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
              <div className="form-group">
                <label>New Password</label>
                <div className="password-wrapper input-with-icon">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter New Password (leave blank to keep old)"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? 'input-error' : ''}
                  />
                  <span className="show-hide-icon" onClick={() => setShowPassword(s => !s)}>
                    <img
                      src={showPassword ? Hide : Show}
                      alt={showPassword ? "Hide password" : "Show password"}
                      style={{width: 22, height: 22, opacity: 0.8, cursor: 'pointer'}}
                    />
                  </span>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Enter First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? 'input-error' : ''}
                  required
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="middleName"
                  placeholder="Enter Middle Name"
                  value={formData.middleName}
                  onChange={handleChange}
                  className={errors.middleName ? 'input-error' : ''}
                />
                {errors.middleName && <span className="error-message">{errors.middleName}</span>}
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Enter Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? 'input-error' : ''}
                  required
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  placeholder="09XXXXXXXXX"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className={errors.mobileNumber ? 'input-error' : ''}
                  required
                />
                {errors.mobileNumber && <span className="error-message">{errors.mobileNumber}</span>}
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  placeholder="dd/mm/yyyy"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={errors.dateOfBirth ? 'input-error' : ''}
                  required
                />
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="sample@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City/Municipal</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={errors.city ? 'input-error' : ''}
                  required
                >
                  <option value="">Select City/Municipal</option>
                  {cityOptions.map((city) => (
                    <option value={city} key={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>
              <div className="form-group">
                <label>Home No. & Street Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter Address"
                  value={formData.address}
                  onChange={handleChange}
                  className={errors.address ? 'input-error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={errors.gender ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
                {errors.gender && <span className="error-message">{errors.gender}</span>}
              </div>
              <div className="form-group">
                <label>Civil Status</label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
                  onChange={handleChange}
                  className={errors.civilStatus ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="In a Relationship">In a Relationship</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                </select>
                {errors.civilStatus && <span className="error-message">{errors.civilStatus}</span>}
              </div>
              <div className="form-group">
                <label>Vicariate/Parish</label>
                <select
                  name="parish"
                  value={formData.parish}
                  onChange={handleChange}
                  className={errors.parish ? 'input-error' : ''}
                  required
                >
                  <option value="">Select Parish</option>
                  {parishOptions.map((group) => (
                    <optgroup label={group.group} key={group.group}>
                      {group.values.map((parish) => (
                        <option value={parish} key={parish}>{parish}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.parish && <span className="error-message">{errors.parish}</span>}
              </div>
            </div>
            <div className="button-group">
              <button type="submit" style={{background:"#24C724"}}>Update User Account</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditUser;