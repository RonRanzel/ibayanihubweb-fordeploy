import React, { useState, useEffect } from "react";
import axios from 'axios';
import { io } from "socket.io-client";
import searchIcon from "../../Assets/search_icon.png";
import profIcon from "../../Assets/user_icon.png";
import usersIcon from "../../Assets/dashboard/dbusers-icon.svg";
import adminsIcon from "../../Assets/dashboard/dbadmins-icon.svg";
import badgeIcon from "../../Assets/badge_icon.png";
import handIcon from "../../Assets/f7_hand-raised.png";
import gridIcon from "../../Assets/grid1_icon.png";
import "../../Styles/sDashboard.css";
import { logAuditFrontend } from '../../logAuditFrontend';

// Use the correct backend API base (no dash)
const API_BASE = "https://ibayanihubweb-backend.onrender.com";
const MOBILE_API_BASE = "https://ibayanihub-backend.onrender.com";

const Dashboard = ({ setActiveSection }) => {
    const [dateTime, setDateTime] = useState(new Date());
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [volunteerRequests, setVolunteerRequests] = useState([]);
    const [acceptedVolunteers, setAcceptedVolunteers] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [events, setEvents] = useState([]);
    // Socket reference
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE}/api/getUsers`)
            .then((response) => {
                console.log('Fetched users:', response.data);
                setUsers(response.data);
            })
            .catch((error) => console.log("Error fetching users:", error));
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE}/api/getAdmin`)
            .then((response) => {
                console.log('Fetched admins:', response.data);
                setAdmins(response.data);
            })
            .catch((error) => console.log("Error fetching admins:", error));
    }, []);

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            axios.get(`${API_BASE}/api/getAdminByEmail/${email}`)
                .then((response) => {
                    console.log('Fetched logged-in admin:', response.data);
                    setLoggedInAdmin(response.data);
                })
                .catch((error) => console.log("Error fetching logged-in admin:", error));
        }
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE}/api/volunteer-requests`)
            .then((response) => setVolunteerRequests(response.data))
            .catch((error) => console.log("Error fetching volunteer requests:", error));

        axios.get(`${API_BASE}/api/accepted-volunteers`)
            .then((response) => setAcceptedVolunteers(response.data))
            .catch((error) => console.log("Error fetching accepted volunteers:", error));
    }, []);

    useEffect(() => {
        // Fetch community posts from mobile backend
        axios.get(`${MOBILE_API_BASE}/api/posts`)
            .then((response) => setCommunityPosts(response.data))
            .catch((error) => console.log("Error fetching community posts:", error));
        axios.get(`${API_BASE}/api/events`)
            .then((response) => setEvents(response.data))
            .catch((error) => console.log("Error fetching events:", error));
        // Fetch announcements from mobile backend
        axios.get(`${MOBILE_API_BASE}/api/announcements`)
            .then((response) => setAnnouncements(response.data))
            .catch((error) => console.log("Error fetching announcements:", error));
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formatTime = (date) => date.toLocaleTimeString("en-US");

    // Helper for correct singular/plural (plural if 2 or more) without number
    const pluralizeTitle = (count, singular, plural) => {
        return count >= 2 ? plural : singular;
    };

    // Filter event types
    const volunteerEventsCount = events.filter(ev => ev.eventType === 'Volunteer').length;
    const donationEventsCount = events.filter(ev => ev.eventType === 'Donation').length;

    // Find latest announcement (by createdAt)
    const latestAnnouncement = announcements.length > 0 ? announcements.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b) : null;
    // Find latest community post (by createdAt)
    const latestCommunityPost = communityPosts.length > 0 ? communityPosts.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b) : null;

    // Example: hardcoded for now, replace with real data if available
    const pendingRequests = [
        { event: 'Damayan Volunteerism Act', date: '01/01/2025', pending: 'DONE' },
        { event: 'Segunda Mana Packers', date: '01/07/2025', pending: '3 Requests' },
        { event: 'Segunda Mana Packers', date: '02/26/2025', pending: '4 Requests' },
    ];
    const monitoringVolunteers = [
        { event: 'Damayan Volunteerism Act', attended: '10 Attended', absent: '2 Absents' },
        { event: 'Segunda Mana Packers', attended: 'PENDING', absent: 'PENDING' },
        { event: 'Segunda Mana Packers', attended: 'PENDING', absent: 'PENDING' },
    ];

    // --- SOCKET.IO REAL-TIME UPDATES ---
    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(API_BASE);
        setSocket(newSocket);

        // Listen for real-time updates
        newSocket.on('users_updated', (data) => setUsers(data));
        newSocket.on('admins_updated', (data) => setAdmins(data));
        newSocket.on('community_posts_updated', (data) => setCommunityPosts(data));
        newSocket.on('announcements_updated', (data) => setAnnouncements(data));
        newSocket.on('events_updated', (data) => setEvents(data));

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // --- USERS THIS WEEK LOGIC ---
    // Get start of current week (Monday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday as start
    startOfWeek.setHours(0, 0, 0, 0);
    // Count users created this week
    const usersThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) >= startOfWeek).length;

    // --- COMMUNITY POSTS THIS WEEK LOGIC ---
    const communityPostsThisWeek = communityPosts.filter(p => p.createdAt && new Date(p.createdAt) >= startOfWeek).length;

    // --- EVENTS THIS WEEK LOGIC ---
    const volunteerEventsThisWeek = events.filter(ev => ev.eventType === 'Volunteer' && ev.createdAt && new Date(ev.createdAt) >= startOfWeek).length;
    const donationEventsThisWeek = events.filter(ev => ev.eventType === 'Donation' && ev.createdAt && new Date(ev.createdAt) >= startOfWeek).length;

    // --- VOLUNTEER REQUESTS TABLE LOGIC ---
    // Group pending volunteer requests by event, and get event type from events list
    const pendingRequestsByEvent = volunteerRequests.reduce((acc, req) => {
        if (!req.eventId || !req.eventTitleName) return acc;
        const key = req.eventId;
        // Find event in events array to get eventType and eventDate
        const eventObj = events.find(ev => (ev._id === req.eventId || ev.id === req.eventId));
        if (!acc[key]) {
            acc[key] = {
                eventId: req.eventId,
                eventTitle: req.eventTitleName,
                eventType: eventObj ? eventObj.eventType : '',
                eventDate: eventObj ? eventObj.eventDate : '',
                pendingCount: 0
            };
        }
        acc[key].pendingCount += 1;
        return acc;
    }, {});
    const pendingRequestsRows = Object.values(pendingRequestsByEvent);

    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Dashboard',
            details: 'Admin viewed the Dashboard panel',
            platform: 'web'
        });
    }, []);

    return (
        <div style={{ padding: 24 }}>
            {/* Dashboard Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: '8px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
                        <div style={{ color: '#F44336', fontWeight: 700, fontSize: 16 }}>
                            {dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <div style={{ color: '#222', fontWeight: 500, fontSize: 15 }}>
                            {dateTime.toLocaleTimeString('en-US', { hour12: true })}
                        </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 28, background: '#fff', borderRadius: 8, padding: '8px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        Dashboard
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        <img src={profIcon} alt="User" style={{ width: 36, height: 36, borderRadius: '50%', background: '#eee', marginRight: 8 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 700, color: '#F44336', fontSize: 16 }}>
                                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
                            </span>
                            <span style={{ fontSize: 13, color: '#222' }}>{loggedInAdmin?.admin_email || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Welcome Head Admin */}
            <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 500 }}>
                Welcome,<br />
                <span style={{ color: '#F44336', fontWeight: 700, fontSize: 20 }}>
                    HEAD ADMIN {loggedInAdmin ? `${loggedInAdmin.admin_firstName} ${loggedInAdmin.admin_lastName}` : ''}
                </span>
            </div>
            {/* Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <input
                    type="text"
                    placeholder="Search"
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', width: 220, marginRight: 8 }}
                />
                <button style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 8 }}>
                    <img src={searchIcon} alt="Search" style={{ width: 18, height: 18 }} />
                </button>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
                {/* Accounts */}
                <div style={{ flex: 1 }}>
                    <div className="db-card">
                        <h3>Accounts</h3>
                        <div className="db-row">
                            <div>
                                <div className="db-label">Total of Users</div>
                                <div className="db-value">{users.length}</div>
                                <div className="db-trend up">+{usersThisWeek} User{usersThisWeek === 1 ? '' : 's'} this week</div>
                            </div>
                            <div>
                                <div className="db-label">Total of Admins</div>
                                <div className="db-value">{admins.length}</div>
                                {/* Removed admin trend line */}
                            </div>
                        </div>
                    </div>
                    <div className="db-card" style={{ marginTop: 24 }}>
                        <h3>Community Management</h3>
                        <div className="db-row">
                            <div>
                                <div className="db-label">Total of Community Posting</div>
                                <div className="db-value">{communityPosts.length}</div>
                                <div className="db-trend up">+{communityPostsThisWeek} Posting{communityPostsThisWeek === 1 ? '' : 's'} this week</div>
                            </div>
                        </div>
                        <div className="db-latest-announcement">
                            <div className="db-label">Latest Announcement</div>
                            {latestAnnouncement ? (
                                <div className="db-announcement-content" style={{ flexDirection: 'column', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 16, marginTop: 8 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{latestAnnouncement.title}</div>
                                    <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{latestAnnouncement.content}</div>
                                    {latestAnnouncement.media && (
                                        <img src={latestAnnouncement.media} alt="Announcement" style={{ width: '100%', maxWidth: 300, maxHeight: 120, objectFit: 'cover', borderRadius: 8, margin: '0 auto 8px auto', display: 'block' }} />
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#888', marginTop: 4 }}>
                                        <div>
                                            <span style={{ color: '#F44336', marginRight: 4 }}>&#10084;</span>
                                            {latestAnnouncement.likes?.length || 0} Comments
                                        </div>
                                        <div>Posted {Math.floor((Date.now() - new Date(latestAnnouncement.createdAt)) / (1000 * 60 * 60))} hours ago</div>
                                    </div>
                                </div>
                            ) : (
                                <span>No Announcements</span>
                            )}
                        </div>
                    </div>
                </div>
                {/* Volunteer Management */}
                <div style={{ flex: 2 }}>
                    <div className="db-card">
                        <h3>Volunteer Management</h3>
                        <div className="db-row">
                            <div style={{ flex: 1 }}>
                                <div className="db-label">Pending Requests for Event</div>
                                <div className="db-value">{pendingRequestsRows.reduce((sum, r) => sum + r.pendingCount, 0)}</div>
                                <table className="db-table">
                                    <thead>
                                        <tr><th>Event Title</th><th>Event Type</th><th>Event Date</th><th>Pending No. of Request</th></tr>
                                    </thead>
                                    <tbody>
                                        {pendingRequestsRows.length === 0 ? (
                                            <tr><td colSpan="4">No pending requests</td></tr>
                                        ) : (
                                            pendingRequestsRows.map((r, i) => (
                                                <tr key={i}>
                                                    <td>{r.eventTitle}</td>
                                                    <td>{r.eventType}</td>
                                                    <td>{r.eventDate ? new Date(r.eventDate).toLocaleDateString() : ''}</td>
                                                    <td>{r.pendingCount}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                                <div className="db-pagination"><span>Page 1</span> <button>Back</button> <button>Next</button></div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="db-label">Monitoring Volunteers for Event</div>
                                <div className="db-value">12</div>
                                <table className="db-table">
                                    <thead>
                                        <tr><th>Event Title</th><th>Attended</th><th>Absent</th></tr>
                                    </thead>
                                    <tbody>
                                        {monitoringVolunteers.map((r, i) => (
                                            <tr key={i}><td>{r.event}</td><td>{r.attended}</td><td>{r.absent}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="db-pagination"><span>Page 1</span> <button>Back</button> <button>Next</button></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Events & Donation Management */}
            <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
                <div className="db-card" style={{ flex: 1 }}>
                    <h3>Events Management</h3>
                    <div className="db-label">Total of Volunteer Events</div>
                    <div className="db-value">{volunteerEventsCount}</div>
                    <div className="db-trend up">+{volunteerEventsThisWeek} Posting{volunteerEventsThisWeek === 1 ? '' : 's'} this week</div>
                    <div className="db-label" style={{ marginTop: 16 }}>Total of Donation Events</div>
                    <div className="db-value">{donationEventsCount}</div>
                    <div className="db-trend up">+{donationEventsThisWeek} Posting{donationEventsThisWeek === 1 ? '' : 's'} this week</div>
                </div>
                <div className="db-card" style={{ flex: 1 }}>
                    <h3>Donation Management</h3>
                    <div className="db-label">Total of Pending Transactions</div>
                    <div className="db-value">12</div>
                    <div className="db-trend up">+4 Pending this week</div>
                    <div className="db-label" style={{ marginTop: 16 }}>Total of Approved Transactions</div>
                    <div className="db-value">7</div>
                    <div className="db-trend up">+4 Approved this week</div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
