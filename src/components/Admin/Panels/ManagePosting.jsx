import React, { useState, useEffect } from "react";
import axios from 'axios';
import searchIcon from "../../Assets/search_icon.png";
import profIcon from "../../Assets/user_icon.png";
import { logAuditFrontend } from '../../logAuditFrontend';
import "../../Styles/sManagePosting.css"

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api"; 
const API_BASE = "https://ibayanihub-backend.onrender.com/api"; 
const ManagePosting = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [activeTab, setActiveTab] = useState('events');
    const [eventSubTab, setEventSubTab] = useState('posted');
    const [message, setMessage] = useState('');
    const [eventData, setEventData] = useState({
        eventPicture: '',
        eventTitleName: '',
        eventDate: '',
        eventDescription: '',
        eventPlace: '',
        eventVolunteerNo: '',
        eventType: 'Volunteer'
    });
    const [events, setEvents] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [announcementData, setAnnouncementData] = useState({ title: '', content: '', media: null });
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementImagePreview, setAnnouncementImagePreview] = useState(null);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            // Fetch logged-in admin details using the web API
            axios.get(`${WEB_API_BASE}/getAdminByEmail/${email}`)
                .then((response) => setLoggedInAdmin(response.data))
                .catch((error) => console.log("Error fetching logged-in admin:", error));
        }
    }, []);

    // Use API_BASE for community post/hub
    useEffect(() => {
        if (activeTab === 'events') {
            // Fetch events using the mobile backend
            axios.get(`${WEB_API_BASE}/events`)
                .then(res => setEvents(res.data))
                .catch(err => console.log("Error fetching events:", err));
        } 
    }, [activeTab]);

    const formatDate = (date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formatTime = (date) => date.toLocaleTimeString("en-US");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData({ ...eventData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // If Donation, set volunteers to 0
        const submitData = {
            ...eventData,
            eventVolunteerNo: eventData.eventType === 'Donation' ? 0 : eventData.eventVolunteerNo
        };

        // Post event data to the mobile backend
        axios.post(`${WEB_API_BASE}/events`, submitData)
            .then(res => {
                logAuditFrontend({
                    userId: localStorage.getItem('adminEmail') || 'unknown',
                    userType: 'admin',
                    action: 'Add Event',
                    details: `Added event: ${submitData.eventTitleName}`,
                    platform: 'web'
                });
                setMessage("✅ Event posted successfully!");
                setEventData({
                    eventPicture: '',
                    eventTitleName: '',
                    eventDate: '',
                    eventDescription: '',
                    eventPlace: '',
                    eventVolunteerNo: '',
                    eventType: 'Volunteer'
                });
                return axios.get(`${WEB_API_BASE}/events`); // Fetch updated events
            })
            .then(res => setEvents(res.data))
            .catch(err => {
                console.error(err);
                setMessage("❌ Failed to post event.");
            });
    };

    const handleViewPost = (post) => {
        setSelectedPost(post);
        setShowPostModal(true);
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Event',
            details: `Viewed event: ${post.eventTitleName}`,
            platform: 'web'
        });
    };

    // Delete event function
    const handleDeleteEvent = (eventId) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            axios.delete(`${WEB_API_BASE}/events/${eventId}`)
                .then(() => {
                    setMessage("✅ Event deleted successfully!");
                    // Refresh events list
                    return axios.get(`${WEB_API_BASE}/events`);
                })
                .then(res => setEvents(res.data))
                .catch(err => {
                    console.error("Error deleting event:", err);
                    setMessage("❌ Failed to delete event.");
                });
        }
    };

    // Post announcement (for announcement tab, if implemented)
    const handleAnnouncementSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', announcementData.title);
        formData.append('content', announcementData.content);
        formData.append('user', loggedInAdmin ? `${loggedInAdmin.admin_firstName} ${loggedInAdmin.admin_lastName}` : 'Caritas Manila');
        formData.append('username', 'caritasmanila');
        if (announcementData.media) {
            formData.append('media', announcementData.media);
        }
        axios.post(`${API_BASE}/announcements`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(() => {
                logAuditFrontend({
                    userId: localStorage.getItem('adminEmail') || 'unknown',
                    userType: 'admin',
                    action: 'Post Announcement',
                    details: `Posted announcement: ${announcementData.title}`,
                    platform: 'web'
                });
                setAnnouncementMessage('✅ Announcement posted successfully!');
                setAnnouncementData({ title: '', content: '', media: null });
                setAnnouncementImagePreview(null);
                setShowAnnouncementModal(false);
                axios.get(`${API_BASE}/announcements`)
                    .then(res => setAnnouncements(res.data))
                    .catch(err => console.log("Error fetching announcements:", err));
            })
            .catch(err => {
                setAnnouncementMessage('❌ Failed to post announcement.');
                console.log("Error posting announcement:", err);
            });
    };

    return (
        <div id="users-container">
            {/* Header */}
            <div id="users-header-container">
                <div className="header-box date-box">
                    <p className="date">{formatDate(dateTime)}</p>
                    <p className="time">{formatTime(dateTime)}</p>
                </div>

                <div className="header-box search-box">
                    <input
                        type="text"
                        placeholder="Search"
                    />
                    <img src={searchIcon} alt="Search" />
                </div>

                <div className="header-box profile-box">
                    <img src={profIcon} alt="User" className="profile-icon" />
                    <div className="profile-info">
                        {loggedInAdmin ? (
                            <>
                                <p className="profile-name">
                                    {`${loggedInAdmin.admin_firstName} ${loggedInAdmin.admin_middleName || ''} ${loggedInAdmin.admin_lastName}`}
                                </p>
                                <p className="profile-email">{loggedInAdmin.admin_email}</p>
                            </>
                        ) : (
                            <>
                                <p className="profile-name">Loading...</p>
                                <p className="profile-email">Fetching admin data</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div>
                <div className="posting-header">
                    <h1>Manage <span>Posting</span></h1>
                </div>
                <div className="tab-content">
                    {/* Only Events tab remains */}
                    <div>
                        {/* Sub-tabs */}
                        <div className="sub-tabs">
                            <button
                                className={eventSubTab === 'posted' ? 'active-sub-tab' : ''}
                                onClick={() => setEventSubTab('posted')}
                            >
                                Posted Events
                            </button>
                            <button
                                className={eventSubTab === 'post' ? 'active-sub-tab' : ''}
                                onClick={() => setEventSubTab('post')}
                            >
                                Post a New Event
                            </button>
                        </div>

                        {/* Post a New Event */}
                        {eventSubTab === 'post' && (
                            <>
                                <div className="event-type-tabs">
                                    <button
                                        type="button"
                                        className={eventData.eventType === 'Volunteer' ? 'active-event-type' : ''}
                                        onClick={() => setEventData({ ...eventData, eventType: 'Volunteer' })}
                                    >
                                        Volunteer
                                    </button>
                                    <button
                                        type="button"
                                        className={eventData.eventType === 'Donation' ? 'active-event-type' : ''}
                                        onClick={() => setEventData({ ...eventData, eventType: 'Donation', eventVolunteerNo: 0 })}
                                    >
                                        Donation
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="event-form">
                                    <input type="text" name="eventPicture" placeholder="Event Picture URL" value={eventData.eventPicture} onChange={handleChange} required />
                                    <input type="text" name="eventTitleName" placeholder="Event Title" value={eventData.eventTitleName} onChange={handleChange} required />
                                    <input type="date" name="eventDate" value={eventData.eventDate} onChange={handleChange} required />
                                    <textarea name="eventDescription" placeholder="Event Description" value={eventData.eventDescription} onChange={handleChange} required />
                                    <input type="text" name="eventPlace" placeholder="Event Place" value={eventData.eventPlace} onChange={handleChange} required />

                                    {eventData.eventType === 'Volunteer' && (
                                        <input
                                            type="number"
                                            name="eventVolunteerNo"
                                            placeholder="Volunteers Needed"
                                            value={eventData.eventVolunteerNo}
                                            onChange={handleChange}
                                            required
                                        />
                                    )}
                                    {/* You can add more donation-specific fields here if needed */}
                                    <button type="submit">Post Event</button>
                                    {message && <p>{message}</p>}
                                </form>
                            </>
                        )}

                        {/* Posted Events */}
                        {eventSubTab === 'posted' && (
                            <div className="list-view">
                                <table className="users-table">
                                    <thead>
                                        <tr>
                                            <th>No.</th>
                                            <th>Title</th>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Place</th>
                                            <th>Volunteers</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map((event, index) => (
                                            <tr key={event._id}>
                                                <td>{String(index + 1).padStart(2, '0')}</td>
                                                <td>{event.eventTitleName}</td>
                                                <td>{formatDate(new Date(event.eventDate))}</td>
                                                <td>{event.eventType}</td>
                                                <td>{event.eventPlace}</td>
                                                <td>{event.eventVolunteerNo}</td>
                                                <td>
                                                    <button className="view-button" onClick={() => handleViewPost(event)}>View</button>
                                                    <button className="delete-button" onClick={() => handleDeleteEvent(event._id)} style={{ marginLeft: 8, background: '#e53935', color: '#fff' }}>Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagePosting;
