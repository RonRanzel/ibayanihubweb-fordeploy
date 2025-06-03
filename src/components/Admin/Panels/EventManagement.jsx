import React, { useState, useEffect } from "react";
import axios from 'axios';
import profIcon from "../../Assets/user_icon.png";
import { logAuditFrontend } from '../../logAuditFrontend';
import "../../Styles/sManagePosting.css"

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api"; 

const EventManagement = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
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

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            axios.get(`${WEB_API_BASE}/getAdminByEmail/${email}`)
                .then((response) => setLoggedInAdmin(response.data))
                .catch((error) => console.log("Error fetching logged-in admin:", error));
        }
    }, []);

    useEffect(() => {
        axios.get(`${WEB_API_BASE}/events`)
            .then(res => setEvents(res.data))
            .catch(err => console.log("Error fetching events:", err));
    }, []);

    const formatDate = (date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEventData({ ...eventData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...eventData,
            eventVolunteerNo: eventData.eventType === 'Donation' ? 0 : eventData.eventVolunteerNo
        };
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
                setTimeout(() => setMessage(''), 2200);
                setShowPostModal(false);
                return axios.get(`${WEB_API_BASE}/events`);
            })
            .then(res => setEvents(res.data))
            .catch(err => {
                console.error(err);
                setMessage("❌ Failed to post event.");
                setTimeout(() => setMessage(''), 2200);
            });
    };

    const handleViewPost = (post) => {
        setSelectedPost(post);
        // Optionally show a modal for viewing
    };

    const handleDeleteEvent = (eventId) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            axios.delete(`${WEB_API_BASE}/events/${eventId}`)
                .then(() => {
                    setMessage("✅ Event deleted successfully!");
                    setTimeout(() => setMessage(''), 2200);
                    return axios.get(`${WEB_API_BASE}/events`);
                })
                .then(res => setEvents(res.data))
                .catch(err => {
                    console.error("Error deleting event:", err);
                    setMessage("❌ Failed to delete event.");
                    setTimeout(() => setMessage(''), 2200);
                });
        }
    };

    return (
        <div id="events-container">
            {/* Header */}
            <div className="events-header">
                <div className="events-header-left">
                    <div className="events-date-time-box">
                        <div className="events-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="events-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
                    </div>
                </div>
                <div className="events-title-main">Event Management</div>
                <div className="events-header-right">
                    <div className="events-admin-profile">
                        <img src={profIcon} alt="User" className="events-admin-img" />
                        <div className="events-admin-details">
                            <span className="events-admin-name">
                                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
                            </span>
                            <span className="events-admin-email">{loggedInAdmin?.admin_email || ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <button
                    className="events-add-button"
                    onClick={() => setShowPostModal(true)}
                    style={{ marginBottom: 0 }}
                >
                    + Post an Event
                </button>
            </div>

            {/* Post Event Modal */}
            {showPostModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Post a New Event</h2>
                            <button className="modal-close-btn" onClick={() => setShowPostModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="events-type-tabs">
                                <button
                                    type="button"
                                    className={eventData.eventType === 'Volunteer' ? 'events-active-type-tab' : 'events-type-tab'}
                                    onClick={() => setEventData({ ...eventData, eventType: 'Volunteer' })}
                                >
                                    Volunteer
                                </button>
                                <button
                                    type="button"
                                    className={eventData.eventType === 'Donation' ? 'events-active-type-tab' : 'events-type-tab'}
                                    onClick={() => setEventData({ ...eventData, eventType: 'Donation', eventVolunteerNo: 0 })}
                                >
                                    Donation
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="events-form">
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
                                <button type="submit" className="events-submit-btn">Post Event</button>
                                <div className="modal-message">{message}</div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Posted Events */}
            <div className="events-list-view">
                <table className="events-table">
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
                                    <button className="events-view-btn" onClick={() => handleViewPost(event)}>View</button>
                                    <button className="events-delete-btn" onClick={() => handleDeleteEvent(event._id)} style={{ marginLeft: 8 }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EventManagement;