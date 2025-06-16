import React, { useState, useEffect } from "react";
import axios from 'axios';
import searchIcon from "../../Assets/searchicon.svg";
import profIcon from "../../Assets/user_icon.png";
import { logAuditFrontend } from '../../logAuditFrontend';
import '../../Styles/sCommunity.css';
import "../../Styles/sHeader.css"

const WEB_API_BASE = "https://ibayanihubweb-backend.onrender.com/api";
const API_BASE = "https://ibayanihub-backend.onrender.com/api";

const CommunityManagement = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [showPostModal, setShowPostModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [message, setMessage] = useState("");
    const [announcements, setAnnouncements] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [announcementData, setAnnouncementData] = useState({ title: '', content: '', media: null });
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementImagePreview, setAnnouncementImagePreview] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [editAnnouncement, setEditAnnouncement] = useState(null);
    const [editAnnouncementImagePreview, setEditAnnouncementImagePreview] = useState(null);
    const [editAnnouncementMessage, setEditAnnouncementMessage] = useState('');
    const [flaggedPosts, setFlaggedPosts] = useState([]);
    const [flaggedComments, setFlaggedComments] = useState([]);

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

    const fetchPostsAndAnnouncements = () => {
        axios.get(`${API_BASE}/posts`)
            .then(res => setCommunityPosts(res.data))
            .catch(err => console.log("Error fetching community posts:", err));
        axios.get(`${API_BASE}/announcements`)
            .then(res => setAnnouncements(res.data))
            .catch(err => console.log("Error fetching announcements:", err));
    };

    const fetchFlaggedPosts = () => {
        axios.get(`${API_BASE}/flagged-posts`)
            .then(res => setFlaggedPosts(res.data))
            .catch(err => console.log("Error fetching flagged posts:", err));
    };

    const fetchFlaggedComments = () => {
        axios.get(`${API_BASE}/flagged-comments`)
            .then(res => setFlaggedComments(res.data))
            .catch(err => console.log("Error fetching flagged comments:", err));
    };

    useEffect(() => {
        fetchPostsAndAnnouncements();
        fetchFlaggedPosts();
        fetchFlaggedComments();
    }, []);

    const formatDate = (date) => date && (new Date(date)).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formatTime = (date) => date && (new Date(date)).toLocaleTimeString("en-US");

    const getTimeAgo = (date) => {
        if (!date) return "";
        const now = new Date();
        const posted = new Date(date);
        const diff = Math.floor((now - posted) / 60000); // in mins
        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff} min${diff > 1 ? "s" : ""} ago`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? "s" : ""} ago`;
    };

    const handleViewPost = (post) => {
        setSelectedPost(post);
        setShowPostModal(true);
        setEditMode(false);
        setEditAnnouncement(null);
        setEditAnnouncementImagePreview(null);
        setEditAnnouncementMessage('');
    };

    const handleDeletePost = (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            axios.delete(`${API_BASE}/posts/${postId}`)
                .then(() => {
                    logAuditFrontend({
                        userId: localStorage.getItem('adminEmail') || 'unknown',
                        userType: 'admin',
                        action: 'Delete Community Post',
                        details: `Deleted community post with ID: ${postId}`,
                        platform: 'web'
                    });
                    fetchPostsAndAnnouncements();
                    fetchFlaggedPosts(); 
                    setMessage("✅ Post deleted successfully!");
                    setShowPostModal(false);
                })
                .catch(err => {
                    setMessage("❌ Failed to delete post.");
                });
        }
    };

    const handleDeleteAnnouncement = (announcementId) => {
        if (window.confirm("Are you sure you want to delete this announcement?")) {
            axios.delete(`${API_BASE}/announcements/${announcementId}`)
                .then(() => {
                    fetchPostsAndAnnouncements();
                    setAnnouncementMessage("✅ Announcement deleted successfully!");
                    setShowPostModal(false);
                })
                .catch(() => {
                    setAnnouncementMessage("❌ Failed to delete announcement.");
                });
        }
    };

    const handleAnnouncementChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'media' && files && files[0]) {
            setAnnouncementData({ ...announcementData, media: files[0] });
            setAnnouncementImagePreview(URL.createObjectURL(files[0]));
        } else {
            setAnnouncementData({ ...announcementData, [name]: value });
        }
    };

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
                    action: 'Add Announcement',
                    details: `Added announcement: ${announcementData.title}`,
                    platform: 'web'
                });
                setAnnouncementMessage('✅ Announcement posted successfully!');
                setAnnouncementData({ title: '', content: '', media: null });
                setAnnouncementImagePreview(null);
                setShowAnnouncementModal(false);
                fetchPostsAndAnnouncements();
            })
            .catch(() => {
                setAnnouncementMessage('❌ Failed to post announcement.');
            });
    };

    const handleEditAnnouncementClick = (announcement) => {
        setEditMode(true);
        setEditAnnouncement({
            ...announcement,
            media: null 
        });
        setEditAnnouncementImagePreview(announcement.media ? getMediaUrl(announcement.media) : null);
        setEditAnnouncementMessage('');
    };

    const handleEditAnnouncementChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'media' && files && files[0]) {
            setEditAnnouncement({ ...editAnnouncement, media: files[0] });
            setEditAnnouncementImagePreview(URL.createObjectURL(files[0]));
        } else {
            setEditAnnouncement({ ...editAnnouncement, [name]: value });
        }
    };

    const handleEditAnnouncementSubmit = (e) => {
        e.preventDefault();
        if (!editAnnouncement) return;
        const formData = new FormData();
        formData.append('title', editAnnouncement.title);
        formData.append('content', editAnnouncement.content);
        formData.append('user', editAnnouncement.user);
        formData.append('username', editAnnouncement.username);
        if (editAnnouncement.media) {
            formData.append('media', editAnnouncement.media);
        }
        axios.put(`${API_BASE}/announcements/${editAnnouncement._id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
            .then(() => {
                setEditAnnouncementMessage('✅ Announcement updated successfully!');
                setSelectedPost({ ...selectedPost, ...editAnnouncement, media: editAnnouncementImagePreview });
                setEditMode(false);
                setEditAnnouncement(null);
                setEditAnnouncementImagePreview(null);
                fetchPostsAndAnnouncements();
            })
            .catch(() => {
                setEditAnnouncementMessage('❌ Failed to update announcement.');
            });
    };

    const handleUnflagPost = (postId) => {
        axios.put(`${API_BASE}/posts/${postId}`, { flagged: false })
            .then(() => {
                fetchFlaggedPosts();
                fetchPostsAndAnnouncements();
                setMessage("✅ Post retained and unflagged.");
            })
            .catch(() => setMessage("❌ Failed to unflag post."));
    };

    const handleAdminDeleteComment = (postId, commentIndex) => {
        if (window.confirm("Are you sure you want to delete this comment?")) {
            axios.post(`${API_BASE}/posts/admin-delete-comment`, { postId, commentIndex })
                .then(() => {
                    setMessage("✅ Comment deleted successfully!");
                    fetchFlaggedComments();
                    fetchPostsAndAnnouncements();
                })
                .catch(() => setMessage("❌ Failed to delete comment."));
        }
    };

    const getProfilePictureUrl = (profilePicture) => {
        if (!profilePicture) return profIcon;
        let url = profilePicture;
        if (url.startsWith('http://')) url = url.replace('http://', 'https://');
        if (url.startsWith('https://')) return url;
        return profIcon;
    };

    const getMediaUrl = (media) => {
        if (!media) return '';
        if (media.startsWith('http')) return media;
        if (media.startsWith('/uploads') || media.startsWith('uploads')) {
            return `${API_BASE.replace('/api','')}${media.startsWith('/') ? '' : '/'}${media}`;
        }
        return media;
    };

    const filteredPosts = communityPosts.filter(post =>
        (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredAnnouncements = announcements.filter(a =>
        (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const AnnouncementCard = ({ announcement }) => (
        <div className="announcement-card">
            <div className="announcement-card-img-wrapper">
                <img
                    src={announcement.media ? getMediaUrl(announcement.media) : profIcon}
                    alt="Announcement"
                    className="announcement-card-img"
                />
            </div>
            <div className="announcement-card-content">
                <div className="announcement-card-title">
                    <span style={{ color: '#CB1E2A', fontWeight: 700 }}>{announcement.title}</span>
                </div>
                <div className="announcement-card-desc">
                    {(announcement.content || '').length > 45 ? announcement.content.slice(0, 45) + "..." : announcement.content}
                </div>
                <div className="announcement-card-meta">
                    <span className="announcement-card-heart">
                        <svg width="16" height="16" fill="#e63946" viewBox="0 0 24 24" style={{ marginRight: 3 }}>
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        {typeof announcement.hearts === "number" ? announcement.hearts : (announcement.hearts ? announcement.hearts.length : 0)}
                    </span>
                    <span className="announcement-card-comments">
                        {typeof announcement.comments === "number"
                            ? `${announcement.comments} Comments`
                            : `${announcement.comments?.length || 0} Comments`
                        }
                    </span>
                </div>
                <div className="announcement-card-date">
                    Posted on {formatDate(announcement.createdAt)}
                </div>
            </div>
        </div>
    );

    return (
        <div id="community-container">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <div className="header-cTitle">
                        <p className="header-title">Community Management</p>
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
            {/* Tabs, Search, Button */}
            <div className="community-top-bar">
                <div className="community-tabs">
                    <button className={activeTab === 'posts' ? 'community-tab-btn community-active-tab' : 'community-tab-btn'} onClick={() => setActiveTab('posts')}>Community Posts</button>
                    <button className={activeTab === 'announcements' ? 'community-tab-btn community-active-tab' : 'community-tab-btn'} onClick={() => setActiveTab('announcements')}>Announcements</button>
                    <button className={activeTab === 'flagged' ? 'community-tab-btn community-active-tab' : 'community-tab-btn'} onClick={() => setActiveTab('flagged')}>Flagged</button>
                </div>
                <div className="community-search-container">
                    <div className="community-searchbar">
                        <img src={searchIcon} alt="Search" className="community-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, username, title or content..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="community-search-input"
                        />
                    </div>
                    {activeTab === 'announcements' && (
                        <button className="community-add-announcement-btn" onClick={() => setShowAnnouncementModal(true)}>
                            + Add Announcement
                        </button>
                    )}
                </div>
            </div>
            <div className="community-list-view">
                <div className="community-table-scroll">
                    {activeTab === "announcements" ? (
                        <div className="announcement-card-list">
                            {filteredAnnouncements.length === 0 ? (
                                <div style={{ textAlign: "center", color: "#888", padding: 40 }}>
                                    No announcements found.
                                </div>
                            ) : (
                                filteredAnnouncements.map((announcement) => (
                                    <div
                                        key={announcement._id}
                                        className="announcement-card-clickable"
                                        tabIndex={0}
                                        onClick={() => handleViewPost(announcement)}
                                    >
                                        <AnnouncementCard announcement={announcement} />
                                    </div>
                                ))
                            )}
                        </div>
                    ) : activeTab === "flagged" ? (
                        <>
                        <table className="community-table">
                            <thead>
                                <tr>
                                    <th>Profile Picture</th>
                                    <th>Posted By</th>
                                    <th>Date Posted</th>
                                    <th>Title</th>
                                    <th>Content</th>
                                    <th>Hearts</th>
                                    <th>Comments</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flaggedPosts.map((post) => (
                                    <tr key={post._id} style={{ background: '#ffeaea' }}>
                                        <td>
                                            <img
                                                src={getProfilePictureUrl(post.profilePicture)}
                                                alt="avatar"
                                                className="community-profile-img"
                                            />
                                        </td>
                                        <td>
                                            <span className="full-name">{post.user}</span>
                                            <span className="username" style={{ color: "#888", marginLeft: 4 }}>@{post.username}</span>
                                        </td>
                                        <td>{formatDate(post.createdAt)} {formatTime(post.createdAt)}</td>
                                        <td>{post.title}</td>
                                        <td className="content-cell">{post.content}</td>
                                        <td>{typeof post.hearts === "number" ? post.hearts : (post.hearts ? post.hearts.length : 0)}</td>
                                        <td>{typeof post.comments === "number" ? post.comments : (post.comments ? post.comments.length : 0)}</td>
                                        <td>
                                            <button className="community-delete-btn" onClick={() => handleDeletePost(post._id)} style={{ marginRight: 8 }}>Delete</button>
                                            <button className="community-view-btn" onClick={() => handleUnflagPost(post._id)}>Retain</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <h3 style={{marginTop:32, marginBottom:8, color:'#CB1E2A'}}>Flagged Comments</h3>
                        <table className="community-table">
                            <thead>
                                <tr>
                                    <th>Comment</th>
                                    <th>Commented By</th>
                                    <th>Post Title</th>
                                    <th>Post Author</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {flaggedComments.length === 0 ? (
                                    <tr><td colSpan={6} style={{textAlign:'center',color:'#888'}}>No flagged comments</td></tr>
                                ) : flaggedComments.map((fc, idx) => (
                                    <tr key={idx} style={{ background: '#fff3f3' }}>
                                        <td>{fc.comment.text}</td>
                                        <td>{fc.comment.fullName || fc.comment.username}</td>
                                        <td>{fc.postTitle}</td>
                                        <td>{fc.postUser}</td>
                                        <td>{fc.comment.createdAt ? formatDate(fc.comment.createdAt) : ''}</td>
                                        <td>
                                            <button className="community-delete-btn" onClick={() => handleAdminDeleteComment(fc.postId, fc.commentIndex)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </>
                    ) : (
                        <table className="community-table">
                            <thead>
                                <tr>
                                    <th>Posted By</th>
                                    <th>Date Posted</th>
                                    <th>Title</th>
                                    <th>Content</th>
                                    <th>Hearts</th>
                                    <th>Comments</th>
                                    <th>Report</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPosts.map((post) => (
                                    <tr key={post._id}>
                                        <td className="for-postedby">
                                            <img
                                                src={getProfilePictureUrl(post.profilePicture)}
                                                alt="avatar"
                                                className="community-profile-img"
                                            />
                                            <span className="full-name">{post.user}</span>
                                            <span className="username" style={{ color: "#888", marginLeft: 4 }}>@{post.username}</span>
                                        </td>
                                        <td>
                                            {formatDate(post.createdAt)} {formatTime(post.createdAt)}
                                        </td>
                                        <td>{post.title}</td>
                                        <td className="content-cell">{post.content}</td>
                                        <td>
                                            {typeof post.hearts === "number" ? post.hearts : (post.hearts ? post.hearts.length : 0)}
                                        </td>
                                        <td>
                                            {typeof post.comments === "number" ? post.comments : (post.comments ? post.comments.length : 0)}
                                        </td>
                                        <td>
                                            {typeof post.reports === "number"
                                                ? post.reports
                                                : (post.reports && post.reports.length
                                                    ? post.reports.length
                                                    : 0)}
                                        </td>
                                        <td>
                                            <button
                                                className="community-view-btn"
                                                onClick={() => handleViewPost(post)}
                                                tabIndex={0}
                                            >
                                                View Post
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Announcement Modal */}
            {showAnnouncementModal && (
                <div className="community-modal-overlay">
                    <div className="community-modal-content">
                        <div className="community-modal-header">
                            <h2>Post Announcement</h2>
                            <button className="community-close-btn" onClick={() => setShowAnnouncementModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAnnouncementSubmit} className="community-announcement-form">
                            <input
                                type="text"
                                name="title"
                                placeholder="Title"
                                value={announcementData.title}
                                onChange={handleAnnouncementChange}
                                required
                            />
                            <textarea
                                name="content"
                                placeholder="Content"
                                value={announcementData.content}
                                onChange={handleAnnouncementChange}
                                required
                            />
                            <input
                                type="file"
                                name="media"
                                accept="image/*"
                                onChange={handleAnnouncementChange}
                            />
                            {announcementImagePreview && (
                                <img src={announcementImagePreview} alt="Preview" className="community-post-thumbnail" />
                            )}
                            <button type="submit">Post</button>
                            {announcementMessage && <p>{announcementMessage}</p>}
                        </form>
                    </div>
                </div>
            )}

            {/* Announcement View/Edit Modal */}
            {showPostModal && selectedPost && activeTab === "announcements" && (
                <div className="community-modal-overlay" style={{
                    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                    background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
                }}>
                    <div className="community-modal-content" style={{
                        background: "#fff",
                        borderRadius: 14,
                        boxShadow: "0 6px 32px rgba(0,0,0,0.18)",
                        padding: 0,
                        width: 500,
                        maxWidth: "96vw",
                        minHeight: 180,
                        position: "relative"
                    }}>
                        <div style={{ padding: "30px 30px 0 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: -1.5 }}>
                                View Announcement
                            </div>
                            <button
                                onClick={() => { setShowPostModal(false); setEditMode(false); }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 30,
                                    fontWeight: 500,
                                    color: "#555",
                                    cursor: "pointer"
                                }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        {!editMode ? (
                            <>
                                <div style={{ padding: "0 30px 0 30px" }}>
                                    <div style={{ fontWeight: 700, fontSize: 20, margin: "20px 0 6px 0" }}>
                                        {selectedPost.title}
                                    </div>
                                    <div style={{ color: "#232323", fontSize: 15, marginBottom: 16 }}>
                                        {selectedPost.content}
                                    </div>
                                </div>
                                {selectedPost.media && (
                                    <div style={{ width: "100%", padding: 0, marginTop: 2 }}>
                                        <img
                                            src={selectedPost.media}
                                            alt="announcement-media"
                                            style={{
                                                display: "block",
                                                width: "100%",
                                                maxHeight: 260,
                                                objectFit: "cover",
                                                borderRadius: 4,
                                                margin: "0 auto"
                                            }}
                                        />
                                    </div>
                                )}
                                <div style={{
                                    padding: "18px 30px 0 30px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 24,
                                    color: "#bdbdbd",
                                    fontSize: 16,
                                    fontWeight: 500
                                }}>
                                    <span style={{ color: "#e63946", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                        <svg width="18" height="18" fill="#e63946" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                        {selectedPost.hearts ?? 0}
                                    </span>
                                    <span style={{ color: "#888", fontWeight: 500 }}>
                                        {typeof selectedPost.comments === "number"
                                            ? `${selectedPost.comments} Comments`
                                            : `${selectedPost.comments?.length || 0} Comments`
                                        }
                                    </span>
                                </div>
                                <div style={{
                                    padding: "20px 30px 20px 30px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between"
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center"
                                    }}>
                                        <img
                                            src={getProfilePictureUrl(selectedPost.profilePicture)}
                                            alt="profile"
                                            style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 10 }}
                                        />
                                        <span style={{ fontWeight: 600, fontSize: 16 }}>{selectedPost.user}</span>
                                    </div>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20
                                    }}>
                                        <span style={{ color: "#888", fontSize: 14 }}>
                                            Posted {getTimeAgo(selectedPost.createdAt)}
                                        </span>
                                        <button
                                            className="community-view-btn"
                                            style={{ marginRight: 10 }}
                                            onClick={() => handleEditAnnouncementClick(selectedPost)}
                                        >
                                            Edit Announcement
                                        </button>
                                        <button
                                            className="community-delete-btn"
                                            onClick={() => handleDeleteAnnouncement(selectedPost._id)}
                                        >
                                            Delete Post
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <form onSubmit={handleEditAnnouncementSubmit} className="community-announcement-form" style={{ padding: 24 }}>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Title"
                                    value={editAnnouncement?.title || ""}
                                    onChange={handleEditAnnouncementChange}
                                    required
                                />
                                <textarea
                                    name="content"
                                    placeholder="Content"
                                    value={editAnnouncement?.content || ""}
                                    onChange={handleEditAnnouncementChange}
                                    required
                                />
                                <input
                                    type="file"
                                    name="media"
                                    accept="image/*"
                                    onChange={handleEditAnnouncementChange}
                                />
                                {editAnnouncementImagePreview && (
                                    <img src={editAnnouncementImagePreview} alt="Preview" className="community-post-thumbnail" />
                                )}
                                <button type="submit" style={{ marginTop: 12 }}>Save</button>
                                {editAnnouncementMessage && <p>{editAnnouncementMessage}</p>}
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Post Modal for Community Posts */}
            {showPostModal && selectedPost && activeTab === "posts" && (
                <div
                    className="community-modal-overlay"
                    style={{
                        position: "fixed",
                        top: 0, left: 0,
                        width: "100vw", height: "100vh",
                        background: "rgba(0,0,0,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 9999
                    }}
                >
                    <div
                        className="community-modal-content"
                        style={{
                            background: "#fff",
                            borderRadius: 14,
                            boxShadow: "0 6px 32px rgba(0,0,0,0.18)",
                            padding: 0,
                            width: 500,
                            maxWidth: "96vw",
                            minHeight: 180,
                            position: "relative"
                        }}
                    >
                        <div style={{ padding: "30px 30px 0 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: -1.5 }}>
                                View Community <span style={{ color: "#e63946" }}>Post</span>
                            </div>
                            <button
                                onClick={() => setShowPostModal(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 30,
                                    fontWeight: 500,
                                    color: "#555",
                                    cursor: "pointer"
                                }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: "0 30px 0 30px" }}>
                            <div style={{ fontWeight: 700, fontSize: 20, margin: "20px 0 6px 0" }}>
                                {selectedPost.title}
                            </div>
                            <div style={{ color: "#232323", fontSize: 15, marginBottom: 16 }}>
                                {selectedPost.content}
                            </div>
                        </div>
                        {selectedPost.media && (
                            <div style={{ width: "100%", padding: 0, marginTop: 2 }}>
                                <img
                                    src={selectedPost.media}
                                    alt="post-media"
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        maxHeight: 260,
                                        objectFit: "cover",
                                        borderRadius: 4,
                                        margin: "0 auto"
                                    }}
                                />
                            </div>
                        )}
                        <div style={{
                            padding: "18px 30px 0 30px",
                            display: "flex",
                            alignItems: "center",
                            gap: 24,
                            color: "#bdbdbd",
                            fontSize: 16,
                            fontWeight: 500
                        }}>
                            <span style={{ color: "#e63946", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                                <svg width="18" height="18" fill="#e63946" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                {selectedPost.hearts ?? 0}
                            </span>
                            <span style={{ color: "#888", fontWeight: 500 }}>
                                {typeof selectedPost.comments === "number"
                                    ? `${selectedPost.comments} Comments`
                                    : `${selectedPost.comments?.length || 0} Comments`
                                }
                            </span>
                        </div>
                        <div style={{
                            padding: "12px 30px 0 30px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 17
                        }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 20, color: "#bdbdbd"
                            }}>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <svg width="22" height="22" fill="none" stroke="#bdbdbd" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    Heart
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <svg width="22" height="22" fill="none" stroke="#bdbdbd" strokeWidth={1.5} viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    Comment
                                </span>
                            </div>
                        </div>
                        <div style={{
                            padding: "20px 30px 20px 30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center"
                            }}>
                                <img
                                    src={getProfilePictureUrl(selectedPost.profilePicture)}
                                    alt="profile"
                                    style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 10 }}
                                />
                                <span style={{ fontWeight: 600, fontSize: 16 }}>{selectedPost.user}</span>
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 20
                            }}>
                                <span style={{ color: "#888", fontSize: 14 }}>
                                    Posted {getTimeAgo(selectedPost.createdAt)}
                                </span>
                                <button
                                    style={{
                                        background: "#e63946",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 6,
                                        padding: "8px 18px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        fontSize: 15
                                    }}
                                    onClick={() => {
                                        setShowPostModal(false);
                                        handleDeletePost(selectedPost._id);
                                    }}
                                >
                                    Delete Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityManagement;