import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from 'axios';
import "../../Styles/sConversation.css";
import profIcon from "../../Assets/user_icon.png";
import searchIcon from "../../Assets/searchicon.svg";
import { logAuditFrontend } from '../../logAuditFrontend';
import { vicariateData } from './vicariates';

const API_BASE = "https://ibayanihubweb-backend.onrender.com";

const Conversation = () => {
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateTime, setDateTime] = useState(new Date());
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [activeTab, setActiveTab] = useState('users');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [volunteerEvents, setVolunteerEvents] = useState([]);
    const [groupUsers, setGroupUsers] = useState([]);
    const [addAllChecked, setAddAllChecked] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedParish, setSelectedParish] = useState('');
    const [groupName, setGroupName] = useState('');
    const [groupChats, setGroupChats] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupMessages, setGroupMessages] = useState([]);
    const [groupMessage, setGroupMessage] = useState("");
    const [unreadUsers, setUnreadUsers] = useState([]);
    const [unreadGroups, setUnreadGroups] = useState([]);
    const [chatTimestamps, setChatTimestamps] = useState({});
    const messagesEndRef = useRef(null);

    const storedAdminEmail = localStorage.getItem('adminEmail');
    const currentAdminUsername = storedAdminEmail?.split('@')[0] || 'Admin';

    useEffect(() => {
        if (storedAdminEmail) {
            axios.get(`${API_BASE}/api/getAdminByEmail/${storedAdminEmail}`)
                .then(res => setLoggedInAdmin(res.data))
                .catch(() => {});
        }
    }, [storedAdminEmail]);

    useEffect(() => {
        axios.get(`${API_BASE}/api/getUsers`).then(res => setUsers(res.data));
        axios.get(`${API_BASE}/api/getAdmin`).then(res => setAdmins(res.data));
        const newSocket = io(API_BASE);
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    const adminUsernames = admins.map(a => a.admin_email.split('@')[0]);

    // --- DM messages and unread logic ---
    useEffect(() => {
        if (!socket || !selectedUser) return;
        const roomId = generateRoomId(selectedUser.username);
        socket.emit("join_room", roomId);
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_BASE}/messages/${roomId}`);
                const data = await res.json();
                setMessages(data);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                }, 50);
                setChatTimestamps(prev => ({
                  ...prev,
                  [roomId]: data.length > 0 ? new Date(data[data.length - 1].createdAt || data[data.length - 1].timestamp).getTime() : 0
                }));
            } catch { }
        };
        fetchMessages();
        const handleReceiveMessage = data => {
            if (data.roomId === generateRoomId(selectedUser.username)) {
                setMessages(prev => [...prev, data]);
                setTimeout(scrollToBottom, 50);
            } else {
                setUnreadUsers(prev => prev.includes(data.sender) ? prev : [...prev, data.sender]);
            }
            updateDMTime(data.roomId, data);
        };
        socket.on("receive_private_message", handleReceiveMessage);
        return () => socket.off("receive_private_message", handleReceiveMessage);
    }, [socket, selectedUser]);

    // --- Group messages and unread logic ---
    useEffect(() => {
        if (!socket || !selectedGroup) return;
        socket.emit("join_room", selectedGroup._id);
        fetch(`${API_BASE}/messages/${selectedGroup._id}`)
            .then(res => res.json())
            .then(data => {
                setGroupMessages(data);
                setChatTimestamps(prev => ({
                  ...prev,
                  [selectedGroup._id]: data.length > 0 ? new Date(data[data.length-1].createdAt || data[data.length-1].timestamp).getTime() : 0
                }));
            })
            .catch(() => setGroupMessages([]));
        const handleReceiveGroupMessage = data => {
            if (data.roomId === selectedGroup._id) {
                setGroupMessages(prev => [...prev, data]);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 50);
            } else {
                setUnreadGroups(prev => prev.includes(data.roomId) ? prev : [...prev, data.roomId]);
            }
            updateGroupTime(data.roomId, data);
        };
        socket.on("receive_group_message", handleReceiveGroupMessage);
        return () => socket.off("receive_group_message", handleReceiveGroupMessage);
    }, [socket, selectedGroup]);

    // Mark DM as read
    useEffect(() => {
        if (activeTab === "users" && selectedUser) {
            setUnreadUsers(prev => prev.filter(u => u !== selectedUser.username));
        }
    }, [selectedUser, activeTab]);
    // Mark group as read
    useEffect(() => {
        if (activeTab === "group" && selectedGroup) {
            setUnreadGroups(prev => prev.filter(gid => gid !== selectedGroup._id));
        }
    }, [selectedGroup, activeTab]);

    useEffect(() => {
        if (!currentAdminUsername) return;
        axios.get(`${API_BASE}/api/groupchats/user/${currentAdminUsername}`)
            .then(res => setGroupChats(res.data))
            .catch(() => setGroupChats([]));
    }, [showCreateGroupModal, currentAdminUsername]);

    useEffect(() => {
        if (!socket || !currentAdminUsername) return;
        groupChats.forEach(gc => socket.emit('join_room', gc._id));
    }, [socket, groupChats, currentAdminUsername]);

    const generateRoomId = (user1, user2 = 'admin') => {
        const sorted = [user1, user2].sort();
        return `${sorted[0]}_${sorted[1]}`;
    };
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // --- Timestamp update helpers ---
    const updateDMTime = (roomId, msg) => setChatTimestamps(prev => ({
      ...prev,
      [roomId]: new Date(msg.createdAt || msg.timestamp || Date.now()).getTime()
    }));
    const updateGroupTime = (groupId, msg) => setChatTimestamps(prev => ({
      ...prev,
      [groupId]: new Date(msg.createdAt || msg.timestamp || Date.now()).getTime()
    }));

    // --- Helper for formatting timestamp ---
    const formatTimestamp = (ts) => {
        if (!ts) return "";
        const dt = typeof ts === "string" ? new Date(ts) : new Date(ts);
        if (isNaN(dt.getTime())) return "";
        const now = new Date();
        // Today
        if (
            dt.getDate() === now.getDate() &&
            dt.getMonth() === now.getMonth() &&
            dt.getFullYear() === now.getFullYear()
        ) {
            return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (
            dt.getDate() === yesterday.getDate() &&
            dt.getMonth() === yesterday.getMonth() &&
            dt.getFullYear() === yesterday.getFullYear()
        ) {
            return `Yesterday, ${dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        }
        // Else, show full date
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
            ', ' + dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const handleSendMessage = () => {
        if (!message.trim() || !selectedUser) return;
        const roomId = generateRoomId(selectedUser.username);
        const newMsg = {
            roomId,
            sender: currentAdminUsername,
            receiver: selectedUser.username,
            content: message,
            createdAt: new Date().toISOString()
        };
        socket.emit("send_private_message", newMsg);
        updateDMTime(roomId, newMsg);
        setMessage("");
        setTimeout(scrollToBottom, 50);
    };
    const handleSendGroupMessage = () => {
        if (!groupMessage.trim() || !selectedGroup) return;
        const newMsg = {
            roomId: selectedGroup._id,
            sender: currentAdminUsername,
            content: groupMessage,
            createdAt: new Date().toISOString()
        };
        socket.emit("send_group_message", newMsg);
        updateGroupTime(selectedGroup._id, newMsg);
        setGroupMessage("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    };

    const filteredUsers = users.filter(u =>
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    // --- Sort users and groups by recent activity ---
    const sortedFilteredUsers = [...filteredUsers].sort((a, b) => {
      const aTime = chatTimestamps[generateRoomId(a.username)] || 0;
      const bTime = chatTimestamps[generateRoomId(b.username)] || 0;
      return bTime - aTime;
    });
    const sortedGroupChats = [...groupChats].sort((a, b) => {
      const aTime = chatTimestamps[a._id] || 0;
      const bTime = chatTimestamps[b._id] || 0;
      return bTime - aTime;
    });

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Conversation',
            details: 'Admin viewed the Conversation panel',
            platform: 'web'
        });
    }, []);

    useEffect(() => {
        axios.get(`${API_BASE}/api/events`)
            .then(res => setVolunteerEvents(res.data.filter(ev => ev.eventType === 'Volunteer')))
            .catch(() => setVolunteerEvents([]));
    }, []);

    useEffect(() => {
        if (addAllChecked && selectedEventId) {
            axios.get(`${API_BASE}/api/accepted-volunteers`)
                .then(res => {
                    const filtered = res.data.filter(v => v.eventId === selectedEventId);
                    setGroupUsers(filtered.map(v => ({ username: v.username, fullName: v.fullName })));
                })
                .catch(() => setGroupUsers([]));
        }
    }, [addAllChecked, selectedEventId]);

    const handleAddUser = user => {
        if (!groupUsers.some(u => u.username === user.username)) {
            setGroupUsers([...groupUsers, user]);
        }
    };
    const handleRemoveUser = username => {
        setGroupUsers(groupUsers.filter(u => u.username !== username));
    };

    return (
        <div id="users-container">
            <div className="users-header">
                <div className="users-header-left">
                    <div className="users-date-time-box">
                        <div className="users-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="users-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
                    </div>
                </div>
                <div className="users-title-main">Chats</div>
                <div className="users-header-right">
                    <div className="users-admin-profile">
                        <img src={profIcon} alt="User" className="users-admin-img" />
                        <div className="users-admin-details">
                            <span className="users-admin-name">
                                {loggedInAdmin ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}` : 'Admin'}
                            </span>
                            <span className="users-admin-email">{loggedInAdmin?.admin_email || ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP BAR: Search + Tabs */}
            <div className="top-bar-flex-row">
                <div className="search-box-container">
                    <div className="search-box">
                        <img src={searchIcon} alt="Search" className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="tab-switch-container">
                    <button
                        className={`tab-switch-btn${activeTab === 'group' ? ' selected-tab' : ''}`}
                        style={{ background: activeTab === 'group' ? '#CB1E2A' : '#fff', color: activeTab === 'group' ? '#fff' : '#222' }}
                        onClick={() => setActiveTab('group')}
                    >
                        Group Chat
                    </button>
                    <button
                        className={`tab-switch-btn${activeTab === 'users' ? ' selected-tab' : ''}`}
                        style={{ background: activeTab === 'users' ? '#CB1E2A' : '#fff', color: activeTab === 'users' ? '#fff' : '#222' }}
                        onClick={() => setActiveTab('users')}
                    >
                        Users
                    </button>
                </div>
            </div>

            <div className="conversation-container">
                <div className="user-list">
                    {activeTab === 'group' ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h1 style={{ margin: 0 }}>Group Chat Conversation</h1>
                                <button onClick={() => setShowCreateGroupModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#CB1E2A' }} title="Create Group Chat">
                                    <span role="img" aria-label="Create">✏️</span>
                                </button>
                            </div>
                            {sortedGroupChats.length === 0 ? (
                                <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No group chats yet. Click the ✏️ button to create one.</div>
                            ) : (
                                <div className="user-list-scroll" style={{ marginBottom: 16 }}>
                                    {sortedGroupChats.map(gc => (
                                        <div key={gc._id} className={`user-item ${selectedGroup?._id === gc._id ? "selected" : ""}`} onClick={() => setSelectedGroup(gc)}>
                                            {gc.name}
                                            {unreadGroups.includes(gc._id) && (
                                                <span className="chat-unread-dot" title="New message"></span>
                                            )}
                                            <button
                                                style={{ marginLeft: 12, color: '#CB1E2A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                                onClick={async e => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Delete this group chat?')) {
                                                        await axios.delete(`${API_BASE}/api/groupchats/${gc._id}`);
                                                        setGroupChats(groupChats.filter(g => g._id !== gc._id));
                                                        if (selectedGroup && selectedGroup._id === gc._id) setSelectedGroup(null);
                                                    }
                                                }}
                                                title="Delete Group Chat"
                                            >🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h1>Chats</h1>
                            <div className="user-list-scroll">
                                {sortedFilteredUsers.map(user => (
                                    <div
                                        key={user._id || user.username}
                                        className={`user-item ${selectedUser?._id === user._id ? "selected" : ""}`}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            logAuditFrontend({
                                                userId: localStorage.getItem('adminEmail') || 'unknown',
                                                userType: 'admin',
                                                action: 'Select Chat User',
                                                details: `Admin started chat with user: ${user.username} (${user.firstName || ''} ${user.lastName || ''})`,
                                                platform: 'web'
                                            });
                                        }}
                                    >
                                        {user.username}
                                        {unreadUsers.includes(user.username) && (
                                            <span className="chat-unread-dot" title="New message"></span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
                <div className="chat-area">
                    {activeTab === 'group' ? (
                        selectedGroup ? (
                            <>
                                <div className="chat-header" style={{ background: '#CB1E2A', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 700, fontSize: 18 }}>{selectedGroup.name}</span>
                                    {selectedGroup && selectedGroup.members && selectedGroup.members.includes(currentAdminUsername) && (
                                        <button
                                            style={{ background: '#fff', color: '#CB1E2A', border: '1px solid #CB1E2A', borderRadius: 8, padding: '4px 16px', fontWeight: 600, fontSize: 15, marginLeft: 12, cursor: 'pointer' }}
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to leave this group?')) {
                                                    try {
                                                        await axios.post(`${API_BASE}/api/groupchats/${selectedGroup._id}/leave`, { username: currentAdminUsername });
                                                        setGroupChats(groupChats.filter(g => g._id !== selectedGroup._id));
                                                        setSelectedGroup(null);
                                                    } catch { alert('Failed to leave group chat.'); }
                                                }
                                            }}
                                        >Leave Group</button>
                                    )}
                                </div>
                                <div className="chat-messages">
                                    {groupMessages.map((msg, idx) => (
                                        <div key={idx} className="chat-bubble admin">
                                            <div className={`sender-name ${msg.sender === currentAdminUsername ? "sender-admin" : "sender-other"}`}>{msg.sender}</div>
                                            <span>{msg.content}</span>
                                            <div className="chat-timestamp">{formatTimestamp(msg.createdAt || msg.timestamp)}</div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                {selectedGroup ? (
                                    <div className="chat-input">
                                        <input
                                            type="text"
                                            value={groupMessage}
                                            placeholder="Type a message..."
                                            onChange={e => setGroupMessage(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleSendGroupMessage()}
                                        />
                                        <button onClick={handleSendGroupMessage}>Send</button>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="select-user-text">Select a group to start chatting</div>
                        )
                    ) : (
                        selectedUser ? (
                            <>
                                <div className="chat-header">
                                    <strong>Chatting with:</strong> {selectedUser.username} ({selectedUser.firstName || ''} {selectedUser.lastName || ''})
                                </div>
                                <div className="chat-messages">
                                    {messages.map((msg, idx) => {
                                        const isAdminSender = adminUsernames.includes(msg.sender);
                                        const isCurrentAdminSender = msg.sender === currentAdminUsername;
                                        const displayName = isAdminSender
                                            ? (isCurrentAdminSender ? 'You - ADMIN' : `${msg.sender} - ADMIN`)
                                            : msg.sender;
                                        return (
                                            <div
                                                key={idx}
                                                className={`chat-bubble ${isAdminSender ? "admin" : "user"}`}
                                            >
                                                <div className={`sender-name ${
                                                    isCurrentAdminSender
                                                        ? "sender-admin"
                                                        : isAdminSender
                                                            ? "sender-other"
                                                            : "sender-user"
                                                }`}>{displayName}</div>
                                                <span>{msg.content}</span>
                                                <div className="chat-timestamp">{formatTimestamp(msg.createdAt || msg.timestamp)}</div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                                {selectedUser && (
                                    <div className="chat-input">
                                        <input
                                            type="text"
                                            value={message}
                                            placeholder="Type a message..."
                                            onChange={e => setMessage(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                        />
                                        <button onClick={handleSendMessage}>Send</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="select-user-text">Select a user to start chatting</div>
                        )
                    )}
                </div>
            </div>

            {/* Modal for create group chat */}
            {showCreateGroupModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden' // Prevent modal scroll
                }}>
                    <div className="modal-content" style={{
                        background: '#fff',
                        borderRadius: 12,
                        padding: 32,
                        minWidth: 400,
                        maxWidth: 480,
                        boxShadow: '0 4px 24px #0002',
                        position: 'relative',
                        overflow: 'visible', // No scroll inside modal
                        maxHeight: 'none'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ margin: 0, color: '#CB1E2A' }}>Create a <span style={{ color: '#222' }}>Group Chat</span></h2>
                            <button onClick={() => setShowCreateGroupModal(false)} style={{ background: 'none', border: '2px solid #CB1E2A', borderRadius: 6, fontSize: 24, color: '#CB1E2A', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                            <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#eee', position: 'relative', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 44, color: '#bbb' }}>👥</span>
                                <button style={{ position: 'absolute', bottom: 8, right: 8, background: '#fff', border: '2px solid #CB1E2A', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <span role="img" aria-label="Edit" style={{ color: '#CB1E2A', fontSize: 16 }}>✏️</span>
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <input type="text" placeholder="Example Name" value={groupName} onChange={e => setGroupName(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }} />
                            <div style={{ display: 'flex', gap: 12 }}>
                                <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}>
                                    <option value="">Select Event</option>
                                    {volunteerEvents.map(ev => (
                                        <option key={ev._id} value={ev._id}>{ev.eventTitleName}</option>
                                    ))}
                                </select>
                                <select value={selectedParish} onChange={e => setSelectedParish(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}>
                                    <option value="">Select Parish</option>
                                    {vicariateData.filter(v => !v.isHeader).map((v, idx) => (
                                        <option key={idx} value={v.value}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" id="addAllJoined" checked={addAllChecked} onChange={e => setAddAllChecked(e.target.checked)} />
                                <label htmlFor="addAllJoined" style={{ fontSize: 15 }}>Add All Joined that Event</label>
                            </div>
                            <div style={{ margin: '8px 0', maxHeight: 100, overflowY: 'auto', background: '#fafafa', borderRadius: 6, padding: 8 }}>
                                {groupUsers.length > 0 ? groupUsers.map(u => (
                                    <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span>{u.fullName || u.username}</span>
                                        <button onClick={() => handleRemoveUser(u.username)} style={{ background: 'none', border: 'none', color: '#CB1E2A', fontWeight: 700, cursor: 'pointer' }}>×</button>
                                    </div>
                                )) : <span style={{ color: '#888' }}>No users added yet.</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button style={{ flex: 1, background: '#fff', color: '#CB1E2A', border: '2px solid #CB1E2A', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => {
                                    const username = prompt('Enter username to add:');
                                    const user = users.find(u => u.username === username);
                                    if (user) handleAddUser({ username: user.username, fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() });
                                    else if (username) alert('User not found');
                                }}>Add User</button>
                                <button style={{ flex: 1, background: '#CB1E2A', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                                    onClick={async () => {
                                        if (!groupName.trim() || groupUsers.length === 0) {
                                            alert('Please enter a group name and add at least one user.');
                                            return;
                                        }
                                        const memberUsernames = groupUsers.map(u => u.username);
                                        if (!memberUsernames.includes(currentAdminUsername)) {
                                            memberUsernames.push(currentAdminUsername);
                                        }
                                        try {
                                            const res = await axios.post(`${API_BASE}/api/groupchats`, {
                                                name: groupName,
                                                event: selectedEventId || undefined,
                                                parish: selectedParish || undefined,
                                                members: memberUsernames,
                                                createdBy: currentAdminUsername
                                            });
                                            alert('Group chat created!');
                                            setShowCreateGroupModal(false);
                                            setGroupName('');
                                            setGroupUsers([]);
                                            setSelectedEventId('');
                                            setSelectedParish('');
                                            setAddAllChecked(false);
                                        } catch {
                                            alert('Failed to create group chat.');
                                        }
                                    }}
                                >Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Conversation;