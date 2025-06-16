import React, { useState, useEffect } from "react";
import axios from 'axios';
import profIcon from "../../Assets/user_icon.png";
import { logAuditFrontend } from '../../logAuditFrontend';
import ConfirmAlert from "../Panels/Modal/ConfirmAlert"; // Adjust path as needed
import "../../Styles/sManagePosting.css"
import "../../Styles/sHeader.css"

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api";

const initialEventData = {
    eventPicture: '',
    eventTitleName: '',
    eventDate: '',
    eventDescription: '',
    eventPlace: '',
    eventVolunteerNo: '',
    eventType: 'Volunteer'
};

const EventManagement = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [message, setMessage] = useState('');
    const [eventData, setEventData] = useState(initialEventData);
    const [events, setEvents] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewEventData, setViewEventData] = useState(initialEventData);
    const [isEditingView, setIsEditingView] = useState(false);

    // Delete alert state
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [deleteTargetEventId, setDeleteTargetEventId] = useState(null);

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
        fetchEvents();
    }, []);

    const fetchEvents = () => {
        axios.get(`${WEB_API_BASE}/events`)
            .then(res => setEvents(res.data))
            .catch(err => console.log("Error fetching events:", err));
    };

    const formatDate = (date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formatTimeRange = (event) => {
        if (!event.eventDate || !event.eventStartTime || !event.eventEndTime) return '';
        const date = new Date(event.eventDate);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return `${date.toLocaleDateString("en-US", options)} at ${event.eventStartTime} to ${event.eventEndTime}`;
    };

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
                setEventData(initialEventData);
                setTimeout(() => setMessage(''), 2200);
                setShowPostModal(false);
                fetchEvents();
            })
            .catch(err => {
                console.error(err);
                setMessage("❌ Failed to post event.");
                setTimeout(() => setMessage(''), 2200);
            });
    };

    const handleViewPost = (post) => {
        setSelectedPost(post);
        setViewEventData({
            eventPicture: post.eventPicture || '',
            eventTitleName: post.eventTitleName || '',
            eventDate: post.eventDate ? post.eventDate.slice(0, 10) : '',
            eventDescription: post.eventDescription || '',
            eventPlace: post.eventPlace || '',
            eventVolunteerNo: post.eventVolunteerNo || '',
            eventType: post.eventType || 'Volunteer',
            eventStartTime: post.eventStartTime || '',
            eventEndTime: post.eventEndTime || '',
        });
        setIsEditingView(false);
        setShowViewModal(true);
    };

    // Edit in view modal
    const handleViewEditChange = (e) => {
        const { name, value } = e.target;
        setViewEventData({ ...viewEventData, [name]: value });
    };

    const handleUpdateEvent = (e) => {
        e.preventDefault();
        if (!selectedPost) return;
        const updateData = {
            ...viewEventData,
            eventVolunteerNo: viewEventData.eventType === 'Donation' ? 0 : viewEventData.eventVolunteerNo
        };
        axios.put(`${WEB_API_BASE}/events/${selectedPost._id}`, updateData)
            .then(res => {
                logAuditFrontend({
                    userId: localStorage.getItem('adminEmail') || 'unknown',
                    userType: 'admin',
                    action: 'Edit Event',
                    details: `Edited event: ${updateData.eventTitleName}`,
                    platform: 'web'
                });
                setMessage("✅ Event updated successfully!");
                setTimeout(() => setMessage(''), 2200);
                setShowViewModal(false);
                fetchEvents();
            })
            .catch(err => {
                console.error(err);
                setMessage("❌ Failed to update event.");
                setTimeout(() => setMessage(''), 2200);
            });
    };

    // Open the confirm alert
    const handleDeleteEvent = (eventId) => {
        setDeleteTargetEventId(eventId);
        setDeleteAlertOpen(true);
    };

    // Confirm deletion
    const confirmDeleteEvent = () => {
        if (!deleteTargetEventId) return;
        axios.delete(`${WEB_API_BASE}/events/${deleteTargetEventId}`)
            .then(() => {
                setMessage("✅ Event deleted successfully!");
                setTimeout(() => setMessage(''), 2200);
                setDeleteAlertOpen(false);
                setDeleteTargetEventId(null);
                fetchEvents();
            })
            .catch(err => {
                console.error("Error deleting event:", err);
                setMessage("❌ Failed to delete event.");
                setTimeout(() => setMessage(''), 2200);
                setDeleteAlertOpen(false);
                setDeleteTargetEventId(null);
            });
    };

    // Cancel deletion
    const cancelDeleteEvent = () => {
        setDeleteAlertOpen(false);
        setDeleteTargetEventId(null);
    };

    return (
        <div id="events-container">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <div className="header-cTitle">
                        <p className="header-title">Event Management</p>
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

            {/* View/Edit Event Modal */}
            {showViewModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{isEditingView ? "Edit Event" : "View Event"}</h2>
                            <button className="modal-close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="events-type-tabs">
                                <button
                                    type="button"
                                    className={viewEventData.eventType === 'Volunteer' ? 'events-active-type-tab' : 'events-type-tab'}
                                    disabled={!isEditingView}
                                    onClick={() => isEditingView && setViewEventData({ ...viewEventData, eventType: 'Volunteer' })}
                                >
                                    Volunteer
                                </button>
                                <button
                                    type="button"
                                    className={viewEventData.eventType === 'Donation' ? 'events-active-type-tab' : 'events-type-tab'}
                                    disabled={!isEditingView}
                                    onClick={() => isEditingView && setViewEventData({ ...viewEventData, eventType: 'Donation', eventVolunteerNo: 0 })}
                                >
                                    Donation
                                </button>
                            </div>
                            <form onSubmit={handleUpdateEvent} className="events-form">
                                <input
                                    type="text"
                                    name="eventPicture"
                                    placeholder="Event Picture URL"
                                    value={viewEventData.eventPicture}
                                    onChange={handleViewEditChange}
                                    disabled={!isEditingView}
                                    required
                                />
                                <input
                                    type="text"
                                    name="eventTitleName"
                                    placeholder="Event Title"
                                    value={viewEventData.eventTitleName}
                                    onChange={handleViewEditChange}
                                    disabled={!isEditingView}
                                    required
                                />
                                <input
                                    type="date"
                                    name="eventDate"
                                    value={viewEventData.eventDate}
                                    onChange={handleViewEditChange}
                                    disabled={!isEditingView}
                                    required
                                />
                                <textarea
                                    name="eventDescription"
                                    placeholder="Event Description"
                                    value={viewEventData.eventDescription}
                                    onChange={handleViewEditChange}
                                    disabled={!isEditingView}
                                    required
                                />
                                <input
                                    type="text"
                                    name="eventPlace"
                                    placeholder="Event Place"
                                    value={viewEventData.eventPlace}
                                    onChange={handleViewEditChange}
                                    disabled={!isEditingView}
                                    required
                                />
                                {viewEventData.eventType === 'Volunteer' && (
                                    <input
                                        type="number"
                                        name="eventVolunteerNo"
                                        placeholder="Volunteers Needed"
                                        value={viewEventData.eventVolunteerNo}
                                        onChange={handleViewEditChange}
                                        disabled={!isEditingView}
                                        required
                                    />
                                )}
                                {isEditingView ? (
                                    <button type="submit" className="events-submit-btn">Save Changes</button>
                                ) : (
                                    <button
                                        type="button"
                                        className="events-submit-btn"
                                        style={{ background: '#7a7a7a', marginTop: 8 }}
                                        onClick={() => setIsEditingView(true)}
                                    >Edit</button>
                                )}
                                <div className="modal-message">{message}</div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Alert */}
            <ConfirmAlert
                open={deleteAlertOpen}
                type="warning"
                title="Delete Event"
                message="Are you sure you want to delete this event? This action cannot be undone."
                onConfirm={confirmDeleteEvent}
                onCancel={cancelDeleteEvent}
                confirmText="Delete"
                cancelText="Cancel"
            />

            {/* Posted Events as cards */}
            <div className="events-list-view events-card-list">
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
                    gap: "24px",
                    padding: "24px"
                }}>
                    {events.map((event, index) => (
                        <div className="event-card" key={event._id} style={{
                            borderRadius: 16,
                            boxShadow: "0 4px 18px rgba(60,60,60,0.09)",
                            background: "#fff",
                            overflow: "hidden",
                            minWidth: 300,
                            maxWidth: 390,
                            margin: "0 auto",
                            display: "flex",
                            flexDirection: "column"
                        }}>
                            <div style={{ position: "relative" }}>
                                <img
                                    src={event.eventPicture || "https://images.unsplash.com/photo-1506744038136-46273834b3fb"}
                                    alt="Event"
                                    style={{
                                        width: "100%",
                                        height: "160px",
                                        objectFit: "cover"
                                    }}
                                />
                                <div style={{
                                    position: "absolute",
                                    top: 14,
                                    right: 14,
                                    background: "#cb1e2a",
                                    color: "#fff",
                                    fontWeight: 600,
                                    borderRadius: 8,
                                    padding: "5px 16px",
                                    fontSize: 15,
                                    boxShadow: "0 1.5px 6px rgba(203,30,42,0.07)"
                                }}>
                                    {event.eventType}
                                </div>
                            </div>
                            <div style={{ padding: "18px 20px 14px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                                <div style={{ color: "#7a7a7a", fontWeight: 500, fontSize: 13, marginBottom: 2 }}>
                                    {(() => {
                                        if (event.eventStartTime && event.eventEndTime) {
                                            const date = new Date(event.eventDate);
                                            const options = { weekday: 'short', month: 'short', day: 'numeric' };
                                            return `${date.toLocaleDateString("en-US", options)} at ${event.eventStartTime} to ${event.eventEndTime}`;
                                        }
                                        return formatDate(new Date(event.eventDate));
                                    })()}
                                </div>
                                <div style={{ fontFamily: "Poppins-Bold", fontWeight: 700, fontSize: 21, color: "#cb1e2a", lineHeight: 1.15 }}>
                                    {event.eventTitleName}
                                </div>
                                <div style={{ fontWeight: 500, color: "#323232", fontSize: 16, marginBottom: 0 }}>
                                    {event.eventPlace}
                                </div>
                                {event.eventDescription && (
                                    <div style={{ fontSize: 13, color: "#858585", fontStyle: "italic", marginBottom: 3 }}>
                                        {event.eventDescription}
                                    </div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between", marginTop: 7 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: "#242424" }}>
                                        {event.eventType === "Volunteer"
                                            ? `${event.eventCurrentVolunteers || 0}/${event.eventVolunteerNo} Volunteers`
                                            : "Donation"}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#888" }}>
                                        Posted {formatDate(new Date(event.createdAt || event.eventDate))}
                                    </div>
                                </div>
                                <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                                    <button className="events-view-btn" onClick={() => handleViewPost(event)}>View</button>
                                    <button className="events-delete-btn" onClick={() => handleDeleteEvent(event._id)} style={{ marginLeft: 8 }}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EventManagement;