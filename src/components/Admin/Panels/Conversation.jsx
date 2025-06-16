import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from 'axios';
import "../../Styles/sConversation.css";
import "../../Styles/sHeader.css";
import "../../Styles/sCreateGroupChat.css";
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
            <div className="header">
                <div className="header-left">
                    <div className="header-cTitle">
                        <p className="header-title">Chats</p>
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
                            <div className="convo-group-list-header">
                                <h1>Group Chat Conversation</h1>
                                <button className="create-group-btn" onClick={() => setShowCreateGroupModal(true)} title="Create Group Chat">
                                    <span role="img" aria-label="Create">✏️</span>
                                </button>
                            </div>
                            {sortedGroupChats.length === 0 ? (
                                <div className="convo-group-empty">No group chats yet. Click the ✏️ button to create one.</div>
                            ) : (
                                <div className="user-list-scroll" style={{ marginBottom: 16 }}>
                                    {sortedGroupChats.map(gc => (
                                        <div key={gc._id} className={`user-item convo-group-item ${selectedGroup?._id === gc._id ? "selected" : ""}`} onClick={() => setSelectedGroup(gc)}>
                                            <span className="convo-group-name">{gc.name}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {unreadGroups.includes(gc._id) && (
                                                    <span className="chat-unread-dot" title="New message"></span>
                                                )}
                                                <button
                                                    className="convo-group-delete-btn"
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
                                <div className="chat-header convo-group-header">
                                    <span className="convo-group-header-title">{selectedGroup.name}</span>
                                    {selectedGroup?.members?.includes(currentAdminUsername) && (
                                        <button
                                            className="convo-group-leave-btn"
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
                <div className="group-modal-overlay">
                    <div className="group-modal-content">
                        <div className="group-modal-header">
                            <h2>Create a <span>Group Chat</span></h2>
                            <button className="group-modal-close-btn" onClick={() => setShowCreateGroupModal(false)}>×</button>
                        </div>
                        <div className="group-modal-avatar-row">
                            <div className="group-modal-avatar">
                                <span>👥</span>
                                <button className="group-modal-avatar-edit-btn">
                                    <span role="img" aria-label="Edit">✏️</span>
                                </button>
                            </div>
                        </div>
                        <div className="group-modal-fields">
                            <input type="text" placeholder="Example Name" value={groupName} onChange={e => setGroupName(e.target.value)} className="group-modal-input" />
                            <div className="group-modal-select-row">
                                <select
                                    value={selectedEventId}
                                    onChange={e => setSelectedEventId(e.target.value)}
                                    className="group-modal-select"
                                >
                                    <option value="">Select Event</option>
                                    {volunteerEvents.map(ev => (
                                        <option key={ev._id} value={ev._id}>{ev.eventTitleName}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedParish}
                                    onChange={e => setSelectedParish(e.target.value)}
                                    className="group-modal-select"
                                >
                                    <option value="">Select Parish</option>
                                    {vicariateData.filter(v => !v.isHeader).map((v, idx) => (
                                        <option key={idx} value={v.value}>{v.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="group-modal-checkbox-row">
                                <input type="checkbox" id="addAllJoined" checked={addAllChecked} onChange={e => setAddAllChecked(e.target.checked)} />
                                <label htmlFor="addAllJoined">Add All Joined that Event</label>
                            </div>
                            <div className="group-modal-userlist">
                                {groupUsers.length > 0 ? groupUsers.map(u => (
                                    <div key={u.username} className="group-modal-user">
                                        <span>{u.fullName || u.username}</span>
                                        <button className="group-modal-user-remove" onClick={() => handleRemoveUser(u.username)}>×</button>
                                    </div>
                                )) : <span className="group-modal-user-empty">No users added yet.</span>}
                            </div>
                            <div className="group-modal-buttons">
                                <button className="group-modal-add-btn" onClick={() => {
                                    const username = prompt('Enter username to add:');
                                    const user = users.find(u => u.username === username);
                                    if (user) handleAddUser({ username: user.username, fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() });
                                    else if (username) alert('User not found');
                                }}>Add User</button>
                                <button className="group-modal-create-btn"
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
                                            await axios.post(`${API_BASE}/api/groupchats`, {
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