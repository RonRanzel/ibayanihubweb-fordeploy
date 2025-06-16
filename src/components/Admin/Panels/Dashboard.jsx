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
import "../../Styles/sHeader.css";
import { logAuditFrontend } from '../../logAuditFrontend';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

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

const COLORS = ['#A18AFF', '#FF8A8A', '#4DD0E1', '#FFD36E', '#CB1E2A'];

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
    // In-Kind Analytics
    const [inKindDonations, setInKindDonations] = useState([]);
    const [acceptedInKindDonations, setAcceptedInKindDonations] = useState([]);

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
        fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations')
            .then(res => res.json())
            .then(data => setInKindDonations(Array.isArray(data) ? data : []));
        fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations/accepted')
            .then(res => res.json())
            .then(data => setAcceptedInKindDonations(Array.isArray(data) ? data : []));
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

    // --- Analytics Data Aggregation ---
    // Pie data by item type (particulars)
    const inKindTypeMap = {};
    let inKindTotalValue = 0;
    let pickUpCount = 0, dropOffCount = 0;
    acceptedInKindDonations.forEach(d => {
        inKindTypeMap[d.particulars] = (inKindTypeMap[d.particulars] || 0) + d.total;
        inKindTotalValue += d.total;
        if (d.via?.toLowerCase().includes('pick')) pickUpCount++;
        if (d.via?.toLowerCase().includes('drop')) dropOffCount++;
    });
    const inKindPieData = Object.keys(inKindTypeMap).map((type, i) => ({
        name: type,
        value: inKindTypeMap[type],
        color: COLORS[i % COLORS.length]
    }));
    const totalVia = pickUpCount + dropOffCount;

    // Cash Analytics
    const acceptedCashDonations = donations.filter(d => d.status === 'accepted');
    const fraudCashDonations = donations.filter(d => d.status === 'rejected');
    const cashTotal = acceptedCashDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const fraudTotal = fraudCashDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    // Line chart: group by date
    const cashByDate = {};
    acceptedCashDonations.forEach(d => {
        const date = new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        cashByDate[date] = (cashByDate[date] || 0) + (Number(d.amount) || 0);
    });
    const cashLineData = Object.keys(cashByDate).map(date => ({ date, amount: cashByDate[date] }));

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
            <div className="header">
                <div className="header-left">
                    <div className="header-cTitle">
                        <p className="header-title">Dashboard</p>
                    </div>
                    <div className="header-cDateTime">
                        <p className="header-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p className="header-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</p>
                    </div>
                </div>
                <div className="header-right">
                    <div className="header-cProf">
                        <img src={profIcon} alt="User" className="header-img" />
                        <div className="header-cName">
                            <p className="header-name">{loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}</p>
                            <p className="header-email">{loggedInAdmin?.admin_email || ''}</p>
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
                <div className="dashboard-cards-row">
                  {/* Donation Analytics Card */}
                  <div className="dashboard-card modern-card" style={{ minWidth: 340, maxWidth: 420 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <img src={donationIcon} alt="Donations" style={{ width: 32, height: 32 }} />
                      <span style={{ fontWeight: 700, fontSize: 18 }}>Donation Management</span>
                    </div>
                    {/* In-Kind Analytics */}
                    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12, marginBottom: 18 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>In-Kind Donation</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie data={inKindPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={60} label>
                              {inKindPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: '#888' }}>Total Value Donated</div>
                          <div style={{ fontWeight: 700, fontSize: 24, color: '#CB1E2A', marginBottom: 8 }}>{inKindTotalValue.toLocaleString()} ₱</div>
                          <div style={{ fontSize: 13, color: '#888' }}>Total Via Pick Up & Drop Off</div>
                          <div style={{ fontWeight: 700, fontSize: 22, color: '#CB1E2A' }}>{totalVia}</div>
                        </div>
                      </div>
                    </div>
                    {/* Cash Analytics */}
                    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Cash Donation</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie data={[
                              { name: 'Real', value: cashTotal, color: COLORS[0] },
                              { name: 'Fraud', value: fraudTotal, color: COLORS[1] }
                            ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={60} label>
                              <Cell fill={COLORS[0]} />
                              <Cell fill={COLORS[1]} />
                            </Pie>
                            <Tooltip />
                            <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: '#888' }}>Total Amount Donated</div>
                          <div style={{ fontWeight: 700, fontSize: 24, color: '#CB1E2A', marginBottom: 8 }}>{cashTotal.toLocaleString()} ₱</div>
                          <div style={{ fontSize: 13, color: '#888' }}>Fraud Receipt Transaction</div>
                          <div style={{ fontWeight: 700, fontSize: 22, color: '#CB1E2A' }}>{fraudTotal.toLocaleString()} ₱</div>
                        </div>
                      </div>
                      {/* Line Chart for Cash Donations */}
                      <div style={{ marginTop: 18 }}>
                        <ResponsiveContainer width="100%" height={80}>
                          <LineChart data={cashLineData} margin={{ left: -18, right: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" fontSize={10} />
                            <YAxis fontSize={10} />
                            <Tooltip />
                            <Line type="monotone" dataKey="amount" stroke="#CB1E2A" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;