import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from "../Assets/logo.svg";
import "../Styles/sMain.css";
import Dashboard from "./Panels/Dashboard";
import UserManagement from "./Panels/UserManagement";
import AdminManagement from "./Panels/AdminManagement";
import Conversation from "./Panels/Conversation";
import EventManagement from "./Panels/EventManagement";
import Volunteers from "./Panels/Volunteers";
import Donations from "./Panels/Donations";
import CommunityManagement from "./Panels/CommunityManagement";
import AuditLog from "./Panels/AuditLog";
import dashboardIcon from "../Assets/dashboardicon.svg";
import chatIcon from "../Assets/chaticon.svg";
import communityIcon from "../Assets/communityicon.svg";
import eventIcon from "../Assets/eventicon.svg";
import volunteerIcon from "../Assets/volunteericon.svg";
import auditIcon from "../Assets/auditicon.svg";
import donationIcon from "../Assets/donationicon.svg";
import adminIcon from "../Assets/adminicon.svg";
import userIcon from "../Assets/usericon.svg";
import { logAuditFrontend } from '../logAuditFrontend';

// Add:
import ConfirmAlert from "./Panels/Modal/ConfirmAlert";
import Alert from "./Panels/Modal/Alert"; // for logout success

const Main = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [logoutSuccess, setLogoutSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSectionChange = (section) => {
        setActiveSection(section);
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: `Navigate to ${section}`,
            details: `Admin navigated to ${section} section`,
            platform: 'web'
        });
    };

    const handleLogout = () => setShowLogoutModal(true);

    const confirmLogout = () => {
        setShowLogoutModal(false);
        const email = localStorage.getItem('adminEmail');
        logAuditFrontend({
            userId: email || 'unknown',
            userType: 'admin',
            action: 'Logout',
            details: 'Admin logged out',
            platform: 'web'
        });
        axios.post("https://ibayanihubweb-backend.onrender.com/api/setAdminStatus", {
            email: email,
            status: false
        }).then(() => {
            localStorage.removeItem('adminEmail');
            setLogoutSuccess(true);
            setTimeout(() => {
                setLogoutSuccess(false);
                navigate('/');
            }, 1800);
        }).catch(err => {
            setLogoutSuccess(false);
            alert("Logout error!");
        });
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard': return <Dashboard setActiveSection={setActiveSection} />;
            case 'userM': return <UserManagement />;
            case 'adminM': return <AdminManagement />;
            case 'conversation': return <Conversation />;
            case 'Mposting': return <EventManagement />;
            case 'community': return <CommunityManagement />;
            case 'volunteers': return <Volunteers />;
            case 'donations': return <Donations />;
            case 'auditlog': return <AuditLog />;
            default: return <div>Not Available</div>;
        }
    };

    return (
        <div id="main-container">
            <ConfirmAlert
                open={showLogoutModal}
                type="warning"
                title="Confirm Logout"
                message="Are you sure you want to logout? Your session will be closed."
                confirmText="Logout"
                cancelText="Cancel"
                onConfirm={confirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
            <Alert
                message={logoutSuccess ? "You have been logged out." : ""}
                type="success"
                title="Logged out"
                duration={1200}
            />
            <div id="main-sidebar-container">
                <div 
                    id="main-header-container"
                    onClick={() => handleSectionChange('dashboard')}
                    style={{ cursor: 'pointer' }}
                >
                    <div id="main-logo-container">
                        <img src={Logo} alt="Logo Error" id="main-logo" />
                        <h2 id="main-title-text">i<span>Bayani</span>Hub</h2>
                    </div>
                    <div id="main-slogan-container">
                        <p id="main-slogan-text">Giving Together, <span>Growing Together.</span></p>
                    </div>
                </div>
                <div id="main-body-container">
                    {[
                        { section: 'dashboard', icon: dashboardIcon, label: 'Dashboard' },
                        { section: 'userM', icon: userIcon, label: 'User Management' },
                        { section: 'adminM', icon: adminIcon, label: 'Admin Management' },
                        { section: 'conversation', icon: chatIcon, label: 'Chats' },
                        { section: 'Mposting', icon: eventIcon, label: 'Event Management' },
                        { section: 'community', icon: communityIcon, label: 'Community Management' },
                        { section: 'volunteers', icon: volunteerIcon, label: 'Volunteer Management' },
                        { section: 'donations', icon: donationIcon, label: 'Donation Management' },
                        { section: 'auditlog', icon: auditIcon, label: 'Audit Log' },
                    ].map(({ section, icon, label }) => (
                        <button 
                            key={section} 
                            className={activeSection === section ? 'active' : ''} 
                            onClick={() => handleSectionChange(section)}
                        >
                            <img src={icon} alt={label} id="main-icon" /> {label}
                        </button>
                    ))}
                </div>
                <div id="main-footer-container">
                    <button id="logout-button" onClick={handleLogout}>Logout</button>
                </div>
            </div>
            <div id="main-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default Main;