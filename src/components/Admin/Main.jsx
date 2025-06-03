import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Logo from "../Assets/logo.png";
import "../Styles/sMain.css";

import Dashboard from "./Panels/Dashboard";
import UserManagement from "./Panels/UserManagement";
import AdminManagement from "./Panels/AdminManagement";
import Conversation from "./Panels/Conversation";
import ManagePosting from "./Panels/ManagePosting";
import Volunteers from "./Panels/Volunteers";
import Donations from "./Panels/Donations";
import ManageBadge from "./Panels/ManageBadge";
import Chatbot from "./Panels/Chatbot";
import Analytics from "./Panels/Analytics";
import CommunityManagement from "./Panels/CommunityManagement";
import AuditLog from "./Panels/AuditLog";

import dashboardIcon from "../Assets/dashboard_icon.png";
import chatIcon from "../Assets/chat_icon.png";
import postingIcon from "../Assets/posting_icon.png";
import vdIcon from "../Assets/volunteerdonation_icon.png";
import badgeIcon from "../Assets/badge_icon.png";
import chatbotIcon from "../Assets/chatbot_icon.png";
import analyticsIcon from "../Assets/analytics_icon.png";
import donationIcon from "../Assets/iconamoon_heart.png";
import adminIcon from "../Assets/admin_icon.png";
import usersIcon from "../Assets/users_icon.png";
import grid1Icon from "../Assets/grid1_icon.png";
import { logAuditFrontend } from '../logAuditFrontend';

const Main = () => {
    const [activeSection, setActiveSection] = useState('dashboard');
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

    const handleLogout = () => {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            const email = localStorage.getItem('adminEmail');
            logAuditFrontend({
                userId: email || 'unknown',
                userType: 'admin',
                action: 'Logout',
                details: 'Admin logged out',
                platform: 'web'
            });
            axios.post("https://ibayanihubweb-backend.onrender.com/api/setAdminStatus", {  // 👈 updated here
                email: email,
                status: false
            }).then(() => {
                localStorage.removeItem('adminEmail');
                alert("You have been logged out.");
                navigate('/');
            }).catch(err => {
                console.error("Error setting offline:", err);
                alert("Logout error!");
            });
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard': return <Dashboard setActiveSection={setActiveSection} />;
            case 'userM': return <UserManagement />;
            case 'adminM': return <AdminManagement />;
            case 'conversation': return <Conversation />;
            case 'Mposting': return <ManagePosting />;
            case 'community': return <CommunityManagement />;
            case 'volunteers': return <Volunteers />;
            case 'donations': return <Donations />;
            case 'Mbadge': return <ManageBadge />;
            case 'chatbot': return <Chatbot />;
            case 'analytics': return <Analytics />;
            case 'auditlog': return <AuditLog />;
            default: return <div>Not Available</div>;
        }
    };

    return (
        <div id="main-container">
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
                        { section: 'userM', icon: usersIcon, label: 'User Management' },
                        { section: 'adminM', icon: adminIcon, label: 'Admin Management' },
                        { section: 'conversation', icon: chatIcon, label: 'Chats' },
                        { section: 'Mposting', icon: postingIcon, label: 'Event Management' },
                        { section: 'community', icon: postingIcon, label: 'Community Management' },
                        { section: 'volunteers', icon: vdIcon, label: 'Volunteer Management' },
                        { section: 'donations', icon: donationIcon, label: 'Donation Management' },
                        { section: 'auditlog', icon: analyticsIcon, label: 'Audit Log' },
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
}

export default Main;
