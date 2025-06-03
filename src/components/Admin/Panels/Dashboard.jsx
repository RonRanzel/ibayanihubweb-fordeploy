import React, { useState, useEffect } from "react";
import axios from 'axios';
import profIcon from "../../Assets/user_icon.png";
import accountsIcon from "../../Assets/usericon.svg";
import eventIcon from "../../Assets/eventicon.svg";
import communityIcon from "../../Assets/communityicon.svg";
import volunteerIcon from "../../Assets/volunteericon.svg";
import donationIcon from "../../Assets/donationicon.svg";
import announcementIcon from "../../Assets/communityicon.svg";
import "../../Styles/sDashboard.css";
import { logAuditFrontend } from '../../logAuditFrontend';

// Utility for calendar
function getMonthMatrix(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const matrix = [];
    let current = new Date(year, month, 1);
    let row = [];
    for (let i = 0; i < firstDay.getDay(); i++) row.push(null);
    while (current <= lastDay) {
        row.push(new Date(current));
        if (row.length === 7) {
            matrix.push(row);
            row = [];
        }
        current.setDate(current.getDate() + 1);
    }
    if (row.length) {
        while (row.length < 7) row.push(null);
        matrix.push(row);
    }
    return matrix;
}

const API_BASE = "https://ibayanihubweb-backend.onrender.com";
const MOBILE_API_BASE = "https://ibayanihub-backend.onrender.com";
const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api";

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
    const [donations, setDonations] = useState([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
    const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

    useEffect(() => {
        axios.get(`${API_BASE}/api/getUsers`).then(res => setUsers(res.data));
        axios.get(`${API_BASE}/api/getAdmin`).then(res => setAdmins(res.data));
        axios.get(`${API_BASE}/api/volunteer-requests`).then(res => setVolunteerRequests(res.data));
        axios.get(`${WEB_API_BASE}/accepted-volunteers`).then(res => setAcceptedVolunteers(res.data));
        axios.get(`${MOBILE_API_BASE}/api/posts`).then(res => setCommunityPosts(res.data));
        axios.get(`${API_BASE}/api/events`).then(res => setEvents(res.data));
        axios.get(`${MOBILE_API_BASE}/api/announcements`).then(res => setAnnouncements(res.data));
        fetch('https://ibayanihub-backend.onrender.com/api/donations')
            .then(res => res.json())
            .then(data => setDonations(data))
            .catch(() => {});
    }, []);
    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            axios.get(`${API_BASE}/api/getAdminByEmail/${email}`).then(res => setLoggedInAdmin(res.data));
        }
    }, []);
    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Dashboard',
            details: 'Admin viewed the Dashboard panel',
            platform: 'web'
        });
    }, []);

    // Stats
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const usersThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) >= startOfWeek).length;
    const communityPostsThisWeek = communityPosts.filter(p => p.createdAt && new Date(p.createdAt) >= startOfWeek).length;
    const volunteerEventsThisWeek = events.filter(ev => ev.eventType === 'Volunteer' && ev.createdAt && new Date(ev.createdAt) >= startOfWeek).length;
    const donationEventsThisWeek = events.filter(ev => ev.eventType === 'Donation' && ev.createdAt && new Date(ev.createdAt) >= startOfWeek).length;
    const volunteerEventsCount = events.filter(ev => ev.eventType === 'Volunteer').length;
    const donationEventsCount = events.filter(ev => ev.eventType === 'Donation').length;
    const pendingRequestsCount = volunteerRequests.length;
    const acceptedVolunteersCount = acceptedVolunteers.length;
    const pendingDonationsCount = donations.filter(d => d.status === 'pending').length;
    const approvedDonationsCount = donations.filter(d => d.status === 'accepted').length;

    const latestAnnouncement = announcements.length > 0
        ? announcements.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
        : null;

    const eventsByDate = {};
    events.forEach(ev => {
        if (ev.eventDate) {
            const day = new Date(ev.eventDate);
            const key = day.toISOString().slice(0, 10);
            if (!eventsByDate[key]) eventsByDate[key] = [];
            eventsByDate[key].push(ev);
        }
    });

    const monthMatrix = getMonthMatrix(calendarYear, calendarMonth);
    const monthName = new Date(calendarYear, calendarMonth, 1).toLocaleString('default', { month: 'long' });

    function changeMonth(offset) {
        let m = calendarMonth + offset;
        let y = calendarYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setCalendarMonth(m);
        setCalendarYear(y);
    }

    // Card click handlers
    const handleCardClick = (section) => {
        if (setActiveSection) setActiveSection(section);
    };

    // Card grid for a modern dashboard
    return (
        <div className="dashboard-main">
            {/* Header - do not change! */}
            <div className="dashb-header">
                <div className="dashb-header-left">
                    <div className="dashb-date-time-box">
                        <div className="dashb-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="dashb-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
                    </div>
                </div>
                <div className="dashb-title-main">Dashboard</div>
                <div className="dashb-header-right">
                    <div className="dashb-admin-profile">
                        <img src={profIcon} alt="User" className="dashb-admin-img" />
                        <div className="dashb-admin-details">
                            <span className="dashb-admin-name">
                                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
                            </span>
                            <span className="dashb-admin-email">{loggedInAdmin?.admin_email || ''}</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Welcome - do not change! */}
            <div className="dashb-content-header">
                <div className="dashb-welcome">
                    Welcome,<br />
                    <span className="dashb-welcome-highlight">
                        HEAD ADMIN {loggedInAdmin ? `${loggedInAdmin.admin_firstName} ${loggedInAdmin.admin_lastName}` : ''}
                    </span>
                </div>
            </div>

            {/* Cards grid */}
            <div className="dashboard-cardgrid">
                <div className="dashboard-cards-row">
                    {/* User/Account Card */}
                    <div
                        className="dashboard-card modern-card accounts-card clickable"
                        onClick={() => handleCardClick("userM")}
                        style={{ cursor: "pointer" }}
                        title="Go to User Accounts"
                    >
                        <div className="modern-card-icon-box">
                            <img src={accountsIcon} alt="Accounts" />
                        </div>
                        <div className="modern-card-title">User Accounts</div>
                        <div className="modern-card-stat">{users.length}</div>
                        <div className="modern-card-substat">Admins: <span>{admins.length}</span></div>
                        <div className="modern-card-footer">
                            <span>New this week: {usersThisWeek}</span>
                        </div>
                    </div>
                    {/* Admin Accounts Card */}
                    <div
                        className="dashboard-card modern-card admins-card clickable"
                        onClick={() => handleCardClick("adminM")}
                        style={{ cursor: "pointer" }}
                        title="Go to Admin Accounts"
                    >
                        <div className="modern-card-icon-box">
                            <img src={profIcon} alt="Admins" />
                        </div>
                        <div className="modern-card-title">Admin Accounts</div>
                        <div className="modern-card-stat">{admins.length}</div>
                        <div className="modern-card-footer">
                            <span>Manage admins</span>
                        </div>
                    </div>
                    {/* Community Card */}
                    <div
                        className="dashboard-card modern-card community-card clickable"
                        onClick={() => handleCardClick("community")}
                        style={{ cursor: "pointer" }}
                        title="Go to Community"
                    >
                        <div className="modern-card-icon-box community">
                            <img src={communityIcon} alt="Community" />
                        </div>
                        <div className="modern-card-title">Community</div>
                        <div className="modern-card-stat">{communityPosts.length}</div>
                        <div className="modern-card-substat">Posts this week: <span>{communityPostsThisWeek}</span></div>
                        <div className="modern-card-footer">
                            <span>Announcements: {announcements.length}</span>
                        </div>
                    </div>
                </div>
                <div className="dashboard-cards-row">
                    {/* Volunteer Card */}
                    <div
                        className="dashboard-card modern-card volunteer-card clickable"
                        onClick={() => handleCardClick("volunteers")}
                        style={{ cursor: "pointer" }}
                        title="Go to Volunteers"
                    >
                        <div className="modern-card-icon-box volunteer">
                            <img src={volunteerIcon} alt="Volunteer" />
                        </div>
                        <div className="modern-card-title">Volunteers</div>
                        <div className="modern-card-stat">{acceptedVolunteersCount}</div>
                        <div className="modern-card-substat">Pending: <span>{pendingRequestsCount}</span></div>
                        <div className="modern-card-footer">
                            <span>Events: {volunteerEventsCount}</span>
                        </div>
                    </div>
                    {/* Donations Card */}
                    <div
                        className="dashboard-card modern-card donation-card clickable"
                        onClick={() => handleCardClick("donations")}
                        style={{ cursor: "pointer" }}
                        title="Go to Donations"
                    >
                        <div className="modern-card-icon-box donation">
                            <img src={donationIcon} alt="Donations" />
                        </div>
                        <div className="modern-card-title">Donations</div>
                        <div className="modern-card-stat">{approvedDonationsCount}</div>
                        <div className="modern-card-substat">Pending: <span>{pendingDonationsCount}</span></div>
                        <div className="modern-card-footer">
                            <span>Donation Events: {donationEventsCount}</span>
                        </div>
                    </div>
                </div>
                {/* Event & Calendar Card */}
                <div className="dashboard-cards-row">
                    <div
                        className="dashboard-card modern-card wide event-card clickable"
                        onClick={() => handleCardClick("Mposting")}
                        style={{ cursor: "pointer" }}
                        title="Go to Events"
                    >
                        <div className="modern-card-header-flex">
                            <div className="modern-card-icon-box event">
                                <img src={eventIcon} alt="Event" />
                            </div>
                            <span className="modern-card-title event">Event Management</span>
                        </div>
                        <div className="modern-card-flex-content">
                            <div className="event-stat-stack">
                                <div>
                                    <div className="modern-card-stat">{events.length}</div>
                                    <div className="modern-card-substat">Events this week: <span>{volunteerEventsThisWeek + donationEventsThisWeek}</span></div>
                                </div>
                                <div className="event-stat-row">
                                    <span className="event-badge volunteer">Volunteer: {volunteerEventsCount}</span>
                                    <span className="event-badge donation">Donation: {donationEventsCount}</span>
                                </div>
                            </div>
                            <div className="modern-calendar-wrap">
                                <div className="modern-calendar-header">
                                    <button onClick={e => { e.stopPropagation(); changeMonth(-1) }}>&lt;</button>
                                    <span>{monthName} {calendarYear}</span>
                                    <button onClick={e => { e.stopPropagation(); changeMonth(1) }}>&gt;</button>
                                </div>
                                <table className="modern-calendar-table">
                                    <thead>
                                        <tr>
                                            <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th>
                                            <th>Thu</th><th>Fri</th><th>Sat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {monthMatrix.map((week, i) => (
                                            <tr key={i}>
                                                {week.map((date, j) => {
                                                    const key = date ? date.toISOString().slice(0, 10) : '';
                                                    return (
                                                        <td key={j} className={date ? "" : "modern-calendar-empty"}>
                                                            {date && (
                                                                <div className="modern-calendar-day-cell">
                                                                    <span className="modern-calendar-date">{date.getDate()}</span>
                                                                    {eventsByDate[key] && eventsByDate[key].map(ev => (
                                                                        <div key={ev._id || ev.eventTitleName}
                                                                            className="modern-calendar-event"
                                                                            title={ev.eventTitleName}
                                                                        >
                                                                            {ev.eventPicture &&
                                                                                <img
                                                                                    src={ev.eventPicture}
                                                                                    alt={ev.eventTitleName}
                                                                                    className="modern-calendar-event-img"
                                                                                />
                                                                            }
                                                                            <span className="modern-calendar-event-title">{ev.eventTitleName}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div
                        className="dashboard-card modern-card announcement-card clickable"
                        onClick={() => handleCardClick("announcements")}
                        style={{ cursor: "pointer" }}
                        title="Go to Announcements"
                    >
                        <div className="modern-card-header-flex">
                            <div className="modern-card-icon-box announcement">
                                <img src={announcementIcon} alt="Announcement" />
                            </div>
                            <span className="modern-card-title announcement">Latest Announcement</span>
                        </div>
                        <div className="modern-announcement-content">
                            {latestAnnouncement ? (
                                <>
                                    <div className="modern-announcement-title">{latestAnnouncement.title}</div>
                                    <div className="modern-announcement-desc">{latestAnnouncement.content}</div>
                                    {latestAnnouncement.media && (
                                        <img src={latestAnnouncement.media} alt="Announcement" className="modern-announcement-img" />
                                    )}
                                    <div className="modern-announcement-meta">
                                        <span className="modern-announcement-likes">&#10084; {latestAnnouncement.likes?.length || 0} Comments</span>
                                        <span>Posted {Math.floor((Date.now() - new Date(latestAnnouncement.createdAt)) / (1000 * 60 * 60))} hours ago</span>
                                    </div>
                                </>
                            ) : (
                                <span className="modern-announcement-none">No Announcements</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;