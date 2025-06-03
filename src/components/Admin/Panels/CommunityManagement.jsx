import React, { useState, useEffect } from "react";
import axios from 'axios';
import searchIcon from "../../Assets/search_icon.png";
import profIcon from "../../Assets/user_icon.png";
import "../../Styles/sManagePosting.css";
import { logAuditFrontend } from '../../logAuditFrontend';

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
    const [announcementSubTab, setAnnouncementSubTab] = useState('posts');
    const [announcementData, setAnnouncementData] = useState({ title: '', content: '', media: null });
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcementImagePreview, setAnnouncementImagePreview] = useState(null);

    // --- COMMUNITY POST CREATION LOGIC (with profile picture) ---
    const [postData, setPostData] = useState({ title: '', content: '', media: null });
    const [postImagePreview, setPostImagePreview] = useState(null);
    const [postMessage, setPostMessage] = useState('');
    const [showPostCreateModal, setShowPostCreateModal] = useState(false);

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
        axios.get(`${API_BASE}/posts`)
            .then(res => setCommunityPosts(res.data))
            .catch(err => console.log("Error fetching community posts:", err));
        axios.get(`${API_BASE}/announcements`)
            .then(res => setAnnouncements(res.data))
            .catch(err => console.log("Error fetching announcements:", err));
    }, []);

    const formatDate = (date) => date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const formatTime = (date) => date.toLocaleTimeString("en-US");

    const handleViewPost = (post) => {
        setSelectedPost(post);
        setShowPostModal(true);
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
                    axios.get(`${API_BASE}/posts`)
                        .then(res => {
                            setCommunityPosts(res.data);
                            setMessage("✅ Post deleted successfully!");
                        })
                        .catch(err => console.log("Error fetching community posts:", err));
                })
                .catch(err => {
                    console.log("Error deleting post:", err);
                    setMessage("❌ Failed to delete post.");
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
                axios.get(`${API_BASE}/announcements`)
                    .then(res => setAnnouncements(res.data))
                    .catch(err => console.log("Error fetching announcements:", err));
            })
            .catch(err => {
                setAnnouncementMessage('❌ Failed to post announcement.');
                console.log("Error posting announcement:", err);
            });
    };

    const handleDeleteAnnouncement = (announcementId) => {
        if (window.confirm("Are you sure you want to delete this announcement?")) {
            axios.delete(`${API_BASE}/announcements/${announcementId}`)
                .then(() => {
                    axios.get(`${API_BASE}/announcements`)
                        .then(res => {
                            setAnnouncements(res.data);
                            setAnnouncementMessage("✅ Announcement deleted successfully!");
                        })
                        .catch(err => console.log("Error fetching announcements:", err));
                })
                .catch(err => {
                    console.log("Error deleting announcement:", err);
                    setAnnouncementMessage("❌ Failed to delete announcement.");
                });
        }
    };

    const handlePostChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'media' && files && files[0]) {
            setPostData({ ...postData, media: files[0] });
            setPostImagePreview(URL.createObjectURL(files[0]));
        } else {
            setPostData({ ...postData, [name]: value });
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('title', postData.title);
        formData.append('content', postData.content);
        // Use admin name if available, else fallback
        formData.append('user', loggedInAdmin ? `${loggedInAdmin.admin_firstName} ${loggedInAdmin.admin_lastName}` : 'Caritas Manila');
        formData.append('username', 'caritasmanila');
        if (postData.media) {
            formData.append('media', postData.media);
        }
        try {
            const res = await axios.post(`${API_BASE}/community-posts`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPostMessage('✅ Post created successfully!');
            setPostData({ title: '', content: '', media: null });
            setPostImagePreview(null);
            setShowPostCreateModal(false);
            // Refresh posts
            const postsRes = await axios.get(`${API_BASE}/posts`);
            setCommunityPosts(postsRes.data);
        } catch (err) {
            setPostMessage('❌ Failed to create post.');
        }
    };

    // Helper for correct profile picture URL (force https)
    const getProfilePictureUrl = (profilePicture) => {
        if (!profilePicture) return require('../../Assets/user_icon.png');
        let url = profilePicture;
        if (url.startsWith('http://')) url = url.replace('http://', 'https://');
        if (url.startsWith('https://')) return url;
        // fallback to local asset
        try {
            return require('../../Assets/user_icon.png');
        } catch (e) {
            return '/user_icon.png';
        }
    };

    // Helper to get full media URL (like in CommunityHub.jsx)
    const getMediaUrl = (media) => {
        if (!media) return '';
        if (media.startsWith('http')) return media;
        if (media.startsWith('/uploads') || media.startsWith('uploads')) {
            return `${API_BASE.replace('/api','')}${media.startsWith('/') ? '' : '/'}${media}`;
        }
        return media;
    };

    // Card view for a community post matching the provided design
    const renderCommunityPostCard = (post, onDelete, onClose) => {
        const avatarSrc = getProfilePictureUrl(post.profilePicture);
        const mediaSrc = getMediaUrl(post.media);
        return (
            <div style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: 24,
                width: 400,
                margin: '0 auto',
                position: 'relative',
                fontFamily: 'inherit',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                        <span style={{ fontWeight: 700, fontSize: 22 }}>Community </span>
                        <span style={{ fontWeight: 700, fontSize: 22, color: '#F44336' }}>Post</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#F44336' }}>
                        &#10005;
                    </button>
                </div>
                {/* Title */}
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{post.title}</div>
                {/* Description */}
                <div style={{ color: '#333', fontSize: 14, marginBottom: 16 }}>{post.content || post.description}</div>
                {/* Post Image */}
                {mediaSrc && (
                    <div style={{ width: '100%', height: 180, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee', borderRadius: 8, overflow: 'hidden' }}>
                        <img src={mediaSrc} alt="post" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                )}
                {/* Like/Comment Row */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#F44336', fontSize: 18, marginRight: 4 }}>&#10084;</span>
                    <span style={{ marginRight: 16, fontSize: 14 }}>{Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}</span>
                    <span style={{ color: '#888', fontSize: 18, marginRight: 4 }}>&#128172;</span>
                    <span style={{ fontSize: 14 }}>{Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)} Comments</span>
                </div>
                {/* Heart label */}
                <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Heart</div>
                {/* User/Time/Delete Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img src={avatarSrc} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', marginRight: 8, border: '1px solid #eee', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 500, fontSize: 15 }}>{post.user || post.username}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#888', fontSize: 13 }}>Posted {post.timeAgo || (post.createdAt ? new Date(post.createdAt).toLocaleString() : '')}</div>
                        <button onClick={() => onDelete(post._id)} style={{ background: '#F44336', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, marginTop: 4, cursor: 'pointer' }}>
                            Delete Post
                        </button>
                    </div>
                </div>
                {/* Comments Section */}
                {Array.isArray(post.comments) && post.comments.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Comments</div>
                        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                            {post.comments.map((comment, idx) => (
                                typeof comment === 'object' && comment !== null ? (
                                    <div key={comment._id || idx} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                        <img
                                            src={getProfilePictureUrl(comment.profilePicture)}
                                            alt="avatar"
                                            style={{ width: 28, height: 28, borderRadius: '50%', marginRight: 8, border: '1px solid #eee', objectFit: 'cover' }}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: 14 }}>{comment.fullName || comment.username}</div>
                                            <div style={{ fontSize: 13, color: '#555' }}>{comment.text}</div>
                                            <div style={{ fontSize: 11, color: '#aaa' }}>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</div>
                                        </div>
                                    </div>
                                ) : null
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render announcement cards with images
    const renderAnnouncementCard = (announcement) => {
        return (
            <div key={announcement._id} style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: 16,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                maxWidth: 500
            }}>
                {announcement.media && (
                    <img src={announcement.media} alt="Announcement" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                )}
                <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{announcement.title}</div>
                    <div style={{ color: '#555', fontSize: 14, margin: '4px 0' }}>{announcement.content}</div>
                    <div style={{ color: '#888', fontSize: 12 }}>Posted {announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : ''}</div>
                </div>
            </div>
        );
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
                    <input type="text" placeholder="Search" />
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
            <div className="posting-header">
                <h1>Community <span>Management</span></h1>
                <div className="sub-tabs">
                    <button
                        className={announcementSubTab === 'posts' ? 'active-sub-tab' : ''}
                        onClick={() => setAnnouncementSubTab('posts')}
                    >
                        Posts
                    </button>
                    <button
                        className={announcementSubTab === 'announcements' ? 'active-sub-tab' : ''}
                        onClick={() => setAnnouncementSubTab('announcements')}
                    >
                        Announcements
                    </button>
                </div>
            </div>
            {announcementSubTab === 'posts' && (
                <div className="list-view">
                    <button className="post-announcement-btn" onClick={() => setShowPostCreateModal(true)}>
                        + Create Community Post
                    </button>
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Title</th>
                                <th>Content</th>
                                <th>Posted By</th>
                                <th>Profile Picture</th>
                                <th>Posted Date</th>
                                <th>Image</th>
                                <th>Likes</th>
                                <th>Comments</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {communityPosts.map((post, index) => (
                                <tr key={post._id}>
                                    <td>{String(index + 1).padStart(2, '0')}</td>
                                    <td>{post.title}</td>
                                    <td className="content-cell">{post.content}</td>
                                    <td>
                                        <div className="user-info">
                                            <span className="full-name">{post.user}</span>
                                            <span className="username">@{post.username}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <img
                                            src={getProfilePictureUrl(post.profilePicture)}
                                            alt="avatar"
                                            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #eee', objectFit: 'cover' }}
                                        />
                                    </td>
                                    <td>{formatDate(new Date(post.createdAt))}</td>
                                    <td>
                                        {post.media && (
                                            <img
                                                src={getMediaUrl(post.media)}
                                                alt="Post media"
                                                className="post-thumbnail"
                                                style={{ maxWidth: 80, maxHeight: 80, objectFit: 'contain', borderRadius: 6, background: '#eee' }}
                                            />
                                        )}
                                    </td>
                                    <td>{post.likes?.length || 0}</td>
                                    <td>{post.comments?.length || 0}</td>
                                    <td>
                                        <button
                                            className="view-button"
                                            onClick={() => handleViewPost(post)}
                                            tabIndex={0}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            View
                                        </button>
                                        <button
                                            className="delete-button"
                                            onClick={() => handleDeletePost(post._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {announcementSubTab === 'announcements' && (
                <div>
                    <button className="post-announcement-btn" onClick={() => setShowAnnouncementModal(true)}>
                        + Post Announcement
                    </button>
                    <div className="list-view">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>No.</th>
                                    <th>Title</th>
                                    <th>Content</th>
                                    <th>Posted By</th>
                                    <th>Profile Picture</th>
                                    <th>Posted Date</th>
                                    <th>Image</th>
                                    <th>Likes</th>
                                    <th>Comments</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {announcements.map((post, index) => (
                                    <tr key={post._id}>
                                        <td>{String(index + 1).padStart(2, '0')}</td>
                                        <td>{post.title}</td>
                                        <td className="content-cell">{post.content}</td>
                                        <td>
                                            <div className="user-info">
                                                <span className="full-name">{post.user}</span>
                                                <span className="username">@{post.username}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <img
                                                src={getProfilePictureUrl(post.profilePicture)}
                                                alt="avatar"
                                                style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #eee', objectFit: 'cover' }}
                                            />
                                        </td>
                                        <td>{formatDate(new Date(post.createdAt))}</td>
                                        <td>
                                            {post.media && (
                                                <img
                                                    src={getMediaUrl(post.media)}
                                                    alt="Post media"
                                                    className="post-thumbnail"
                                                    style={{ maxWidth: 80, maxHeight: 80, objectFit: 'contain', borderRadius: 6, background: '#eee' }}
                                                />
                                            )}
                                        </td>
                                        <td>{post.likes?.length || 0}</td>
                                        <td>{post.comments?.length || 0}</td>
                                        <td>
                                            <button
                                                className="view-button"
                                                onClick={() => handleViewPost(post)}
                                            >
                                                View
                                            </button>
                                            <button
                                                className="delete-button"
                                                onClick={() => handleDeleteAnnouncement(post._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {showAnnouncementModal && (
                        <div className="modal-overlay">
                            <div className="modal-content post-detail-modal">
                                <div className="modal-header">
                                    <h2>Post Announcement</h2>
                                    <button className="close-button" onClick={() => setShowAnnouncementModal(false)}>×</button>
                                </div>
                                <form onSubmit={handleAnnouncementSubmit} className="announcement-form">
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
                                        <img src={announcementImagePreview} alt="Preview" className="post-thumbnail" />
                                    )}
                                    <button type="submit">Post</button>
                                    {announcementMessage && <p>{announcementMessage}</p>}
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {showPostModal && selectedPost && (
                <div className="modal-overlay">
                    <div className="modal-content post-detail-modal">
                        <div className="modal-header">
                            <h2>View Community Post</h2>
                            <button className="close-button" onClick={() => setShowPostModal(false)}>×</button>
                        </div>
                        {renderCommunityPostCard(selectedPost, handleDeletePost, () => setShowPostModal(false))}
                    </div>
                </div>
            )}
            {showPostCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content post-detail-modal">
                        <div className="modal-header">
                            <h2>Create Community Post</h2>
                            <button className="close-button" onClick={() => setShowPostCreateModal(false)}>×</button>
                        </div>
                        <form onSubmit={handlePostSubmit} className="announcement-form">
                            <input
                                type="text"
                                name="title"
                                placeholder="Title"
                                value={postData.title}
                                onChange={handlePostChange}
                                required
                            />
                            <textarea
                                name="content"
                                placeholder="Content"
                                value={postData.content}
                                onChange={handlePostChange}
                                required
                            />
                            <input
                                type="file"
                                name="media"
                                accept="image/*"
                                onChange={handlePostChange}
                            />
                            {postImagePreview && (
                                <img src={postImagePreview} alt="Preview" className="post-thumbnail" />
                            )}
                            <button type="submit">Post</button>
                            {postMessage && <p>{postMessage}</p>}
                        </form>
                    </div>
                </div>
            )}
            <div style={{ margin: '24px 0' }}>
                <h2>Announcements</h2>
                {announcements.length === 0 && <div>No announcements found.</div>}
                {announcements.map(renderAnnouncementCard)}
            </div>
        </div>
    );
};

export default CommunityManagement;
