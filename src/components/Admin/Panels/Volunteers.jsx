import React, { useState, useEffect } from "react";
import axios from 'axios';
import { io } from "socket.io-client";
import searchIcon from "../../Assets/searchicon.svg"; 
import profIcon from "../../Assets/user_icon.png";
import addUserIcon from "../../Assets/addicon.svg";
import dlIcon from "../../Assets/downloadicon.svg";
import '../../Styles/sVolunteers.css';
import { logAuditFrontend } from '../../logAuditFrontend';

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api";

const Volunteers = () => {
    const [activeTab, setActiveTab] = useState('requests');
    const [volunteerRequests, setVolunteerRequests] = useState([]);
    const [acceptedVolunteers, setAcceptedVolunteers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateTime, setDateTime] = useState(new Date());
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            axios.get(`${WEB_API_BASE}/getAdminByEmail/${email}`)
                .then((response) => setLoggedInAdmin(response.data))
                .catch((error) => console.log("Error fetching logged-in admin:", error));
        }

        fetchVolunteerRequests();
        fetchAcceptedVolunteers();

        const newSocket = io("https://ibayanihubweb-backend.onrender.com");
        setSocket(newSocket);
        newSocket.on('volunteer_requests_updated', (data) => {
            setVolunteerRequests(data.volunteerRequests || []);
            setAcceptedVolunteers(data.acceptedVolunteers || []);
        });
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => {
            newSocket.disconnect();
            clearInterval(timer);
        };
    }, []);

    const fetchVolunteerRequests = () => {
        axios.get(`${WEB_API_BASE}/volunteer-requests`)
            .then(res => setVolunteerRequests(res.data))
            .catch(err => console.log("Error fetching volunteer requests:", err));
    };

    const fetchAcceptedVolunteers = () => {
        axios.get(`${WEB_API_BASE}/accepted-volunteers`)
            .then(res => setAcceptedVolunteers(res.data))
            .catch(err => console.log("Error fetching accepted volunteers:", err));
    };

    const handleAccept = (id) => {
        axios.put(`${WEB_API_BASE}/volunteer-requests/${id}/accept`)
            .then(() => {
                logAuditFrontend({
                    userId: localStorage.getItem('adminEmail') || 'unknown',
                    userType: 'admin',
                    action: 'Accept Volunteer Request',
                    details: `Accepted volunteer request with ID: ${id}`,
                    platform: 'web'
                });
                fetchVolunteerRequests();
                fetchAcceptedVolunteers();
            })
            .catch(err => console.log("Error accepting request:", err));
    };

    const handleDeny = (id) => {
        axios.delete(`${WEB_API_BASE}/volunteer-requests/${id}/deny`)
            .then(() => {
                logAuditFrontend({
                    userId: localStorage.getItem('adminEmail') || 'unknown',
                    userType: 'admin',
                    action: 'Deny Volunteer Request',
                    details: `Denied volunteer request with ID: ${id}`,
                    platform: 'web'
                });
                fetchVolunteerRequests();
            })
            .catch(err => console.log("Error denying request:", err));
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatTime = (date) => date.toLocaleTimeString("en-US");

    const filteredRequests = volunteerRequests.filter(request =>
        (request.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.eventTitleName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAccepted = acceptedVolunteers.filter(volunteer =>
        (volunteer.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (volunteer.eventTitleName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Download volunteers as CSV
    const handleDownloadVolunteers = () => {
        let data, headers, rows;
        if (activeTab === 'requests') {
            data = filteredRequests;
            headers = ['Full Name', 'Username', 'Event Title', 'Event Type', 'Date of Birth', 'Requested At'];
            rows = data.map(v => [
                v.fullName,
                v.username,
                v.eventTitleName,
                v.eventType,
                v.dateOfBirth,
                v.requestedAt
            ]);
        } else {
            data = filteredAccepted;
            headers = ['Full Name', 'Username', 'Event Title', 'Event Type', 'Date of Birth', 'Accepted At'];
            rows = data.map(v => [
                v.fullName,
                v.username,
                v.eventTitleName,
                v.eventType,
                v.dateOfBirth,
                v.acceptedAt
            ]);
        }
        if (!data.length) return alert('No volunteers to download.');
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'Download Volunteers',
            details: `Downloaded ${activeTab} volunteers as CSV`,
            platform: 'web'
        });
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x||'').replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `volunteers_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div id="volunteers-container">
            <div className="volunteers-header">
                <div className="volunteers-header-left">
                    <div className="volunteers-date-time-box">
                        <div className="volunteers-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="volunteers-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
                    </div>
                </div>
                <div className="volunteers-title-main">Volunteer Management</div>
                <div className="volunteers-header-right">
                    <div className="volunteers-admin-profile">
                        <img src={profIcon} alt="User" className="volunteers-admin-img" />
                        <div className="volunteers-admin-details">
                            <span className="volunteers-admin-name">
                                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
                            </span>
                            <span className="volunteers-admin-email">{loggedInAdmin?.admin_email || ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP BAR */}
            <div className="volunteers-top-bar">
                <div className="volunteers-tabs">
                    <button className={activeTab === 'requests' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('requests')}> Volunteer Requests</button>
                    <button className={activeTab === 'accepted' ? 'tab-btn active-tab' : 'tab-btn'} onClick={() => setActiveTab('accepted')}>Accepted Volunteers</button>
                </div>
                <div className="volunteers-search-container">
                    <div className="volunteers-searchbar">
                        <img src={searchIcon} alt="Search" className="volunteers-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or event..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="volunteers-search-input"
                        />
                    </div>
                    <button className="volunteers-download-button" onClick={handleDownloadVolunteers}>
                        <img src={dlIcon} alt="Download" />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            <div className="volunteers-list-view">
                <div className="volunteers-table-scroll">
                {activeTab === 'requests' && (
                    <table className="volunteers-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Full Name</th>
                                <th>Username</th>
                                <th>Event Title</th>
                                <th>Event Type</th>
                                <th>Date of Birth</th>
                                <th>Requested At</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((request, index) => (
                                <tr key={request._id}>
                                    <td>{String(index + 1).padStart(2, '0')}</td>
                                    <td>{request.fullName}</td>
                                    <td>{request.username}</td>
                                    <td>{request.eventTitleName}</td>
                                    <td>{request.eventType}</td>
                                    <td>{formatDate(request.dateOfBirth)}</td>
                                    <td>{formatDate(request.requestedAt)}</td>
                                    <td>
                                        <button className="accept-button" onClick={() => handleAccept(request._id)}>Accept</button>
                                        <button className="deny-button" onClick={() => handleDeny(request._id)}>Deny</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {activeTab === 'accepted' && (
                    <table className="volunteers-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Full Name</th>
                                <th>Username</th>
                                <th>Event Title</th>
                                <th>Event Type</th>
                                <th>Date of Birth</th>
                                <th>Accepted At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAccepted.map((volunteer, index) => (
                                <tr key={volunteer._id}>
                                    <td>{String(index + 1).padStart(2, '0')}</td>
                                    <td>{volunteer.fullName}</td>
                                    <td>{volunteer.username}</td>
                                    <td>{volunteer.eventTitleName}</td>
                                    <td>{volunteer.eventType || 'N/A'}</td>
                                    <td>{formatDate(volunteer.dateOfBirth)}</td>
                                    <td>{formatDate(volunteer.acceptedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                </div>
            </div>
        </div>
    );
};

export default Volunteers;