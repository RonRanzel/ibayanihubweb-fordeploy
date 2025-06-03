import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from 'axios';
import "../../Styles/sConversation.css";
import searchIcon from "../../Assets/search_icon.png";
import profIcon from "../../Assets/user_icon.png";
import { logAuditFrontend } from '../../logAuditFrontend';
import { vicariateData } from './vicariates';

// Use the mobile backend for chat/messages
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
    const messagesEndRef = useRef(null);

    // Derive current admin username
    const storedAdminEmail = localStorage.getItem('adminEmail');
    const currentAdminUsername = storedAdminEmail?.split('@')[0] || 'Admin';

    // Fetch current admin details
    useEffect(() => {
        if (storedAdminEmail) {
            axios.get(`${API_BASE}/api/getAdminByEmail/${storedAdminEmail}`)
                .then(response => setLoggedInAdmin(response.data))
                .catch(error => console.log("Error fetching logged-in admin:", error));
        }
    }, [storedAdminEmail]);

    // Fetch users and admins, then initialize socket
    useEffect(() => {
        // Fetch users from the unified backend
        axios.get(`${API_BASE}/api/getUsers`)
            .then(response => setUsers(response.data))
            .catch(error => console.log("Error fetching users:", error));

        axios.get(`${API_BASE}/api/getAdmin`)
            .then(response => setAdmins(response.data))
            .catch(error => console.log("Error fetching admins:", error));

        const newSocket = io(API_BASE);
        setSocket(newSocket);
        return () => newSocket.disconnect();
    }, []);

    // Prepare list of admin usernames
    const adminUsernames = admins.map(a => a.admin_email.split('@')[0]);

    // Handle joining room and receiving messages
    useEffect(() => {
        if (!socket || !selectedUser) return;
        const roomId = generateRoomId(selectedUser.username);
        socket.emit("join_room", roomId);

        // Fetch existing chat history
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_BASE}/messages/${roomId}`);
                const data = await res.json();
                setMessages(data);
                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
                }, 50);
            } catch (error) {
                console.error("Fetch messages error:", error);
            }
        };
        fetchMessages();

        // Listen for new messages
        const handleReceiveMessage = data => {
            if (data.roomId === generateRoomId(selectedUser.username)) {
                setMessages(prev => [...prev, data]);
                setTimeout(scrollToBottom, 50);
            }
        };
        
        socket.on("receive_private_message", handleReceiveMessage);
        return () => socket.off("receive_private_message", handleReceiveMessage);
    }, [socket, selectedUser]);

    // Join group room and fetch messages when a group is selected
    useEffect(() => {
        if (!socket || !selectedGroup) return;
        socket.emit("join_room", selectedGroup._id);
        // Fetch group messages
        fetch(`${API_BASE}/messages/${selectedGroup._id}`)
            .then(res => res.json())
            .then(setGroupMessages)
            .catch(() => setGroupMessages([]));
        // Listen for new group messages
        const handleReceiveGroupMessage = data => {
            if (data.roomId === selectedGroup._id) {
                setGroupMessages(prev => [...prev, data]);
                setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 50);
            }
        };
        socket.on("receive_group_message", handleReceiveGroupMessage);
        return () => socket.off("receive_group_message", handleReceiveGroupMessage);
    }, [socket, selectedGroup]);

    // Fetch group chats for the current admin
    useEffect(() => {
        if (!currentAdminUsername) return;
        console.log('Fetching group chats for:', currentAdminUsername);
        axios.get(`${API_BASE}/api/groupchats/user/${currentAdminUsername}`)
            .then(res => {
                console.log('Fetched group chats:', res.data);
                setGroupChats(res.data);
            })
            .catch(err => {
                console.error('Error fetching group chats:', err);
                setGroupChats([]);
            });
    }, [showCreateGroupModal, currentAdminUsername]);

    // Re-join all group chat rooms whenever groupChats changes
    useEffect(() => {
        if (!socket || !currentAdminUsername) return;
        // Always join all group chat rooms for this admin
        groupChats.forEach(gc => socket.emit('join_room', gc._id));
    }, [socket, groupChats, currentAdminUsername]);

    const generateRoomId = (user1, user2 = 'admin') => {
        const sorted = [user1, user2].sort();
        return `${sorted[0]}_${sorted[1]}`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const handleSendMessage = () => {
        if (!message.trim() || !selectedUser) return;
        const roomId = generateRoomId(selectedUser.username);
        const newMsg = {
            roomId,
            sender: currentAdminUsername,
            receiver: selectedUser.username,
            content: message,
        };
        // Do NOT optimistically update setMessages here
        socket.emit("send_private_message", newMsg);
        setMessage("");
        setTimeout(scrollToBottom, 50);
    };

    const handleSendGroupMessage = () => {
        if (!groupMessage.trim() || !selectedGroup) return;
        const newMsg = {
            roomId: selectedGroup._id,
            sender: currentAdminUsername,
            content: groupMessage,
        };
        // Do NOT optimistically update setGroupMessages here
        socket.emit("send_group_message", newMsg);
        setGroupMessage("");
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 50);
    };
    
    const filteredUsers = users.filter(u =>
        (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDate = date =>
        date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const formatTime = date => date.toLocaleTimeString("en-US");

    // Log audit data when component mounts
    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Conversation',
            details: 'Admin viewed the Conversation panel',
            platform: 'web'
        });
    }, []);

    // Fetch volunteer events for group chat modal
    useEffect(() => {
        axios.get(`${API_BASE}/api/events`)
            .then(res => {
                // Only include events with eventType === 'Volunteer'
                setVolunteerEvents(res.data.filter(ev => ev.eventType === 'Volunteer'));
            })
            .catch(() => setVolunteerEvents([]));
    }, []);

    // Fetch accepted volunteers for selected event when addAllChecked or selectedEventId changes
    useEffect(() => {
        if (addAllChecked && selectedEventId) {
            axios.get('https://ibayanihubweb-backend.onrender.com/api/accepted-volunteers')
                .then(res => {
                    const filtered = res.data.filter(v => v.eventId === selectedEventId);
                    setGroupUsers(filtered.map(v => ({ username: v.username, fullName: v.fullName })));
                })
                .catch(() => setGroupUsers([]));
        }
    }, [addAllChecked, selectedEventId]);

    // Add user handler
    const handleAddUser = user => {
        if (!groupUsers.some(u => u.username === user.username)) {
            setGroupUsers([...groupUsers, user]);
        }
    };

    // Remove user handler
    const handleRemoveUser = username => {
        setGroupUsers(groupUsers.filter(u => u.username !== username));
    };

    return (
        <div id="users-container">
            <div id="users-header-container">
                <div className="header-box date-box">
                    <p className="date">{formatDate(dateTime)}</p>
                    <p className="time">{formatTime(dateTime)}</p>
                </div>

                <div className="header-box search-box">
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
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
                                <p className="profile-email">Fetching admin data...</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="conversation-container">
                <div className="user-list">
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <button onClick={() => setActiveTab('group')} className={activeTab === 'group' ? 'active-tab' : ''}>Group Chat</button>
                        <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active-tab' : ''}>Users</button>
                    </div>
                    {activeTab === 'group' ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h1 style={{ margin: 0 }}>Group Chat Conversation</h1>
                                <button onClick={() => setShowCreateGroupModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#CB1E2A' }} title="Create Group Chat">
                                    <span role="img" aria-label="Create">✏️</span>
                                </button>
                            </div>
                            {groupChats.length === 0 ? (
                                <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No group chats yet. Click the ✏️ button to create one.</div>
                            ) : (
                                <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                                    {groupChats.map(gc => (
                                        <div key={gc._id} className={`user-item ${selectedGroup?._id === gc._id ? "selected" : ""}`} onClick={() => setSelectedGroup(gc)}>
                                            {gc.name}
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
                            {filteredUsers.map(user => (
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
                                </div>
                            ))}
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
                                                    } catch (err) {
                                                        alert('Failed to leave group chat.');
                                                    }
                                                }
                                            }}
                                        >Leave Group</button>
                                    )}
                                </div>
                                <div className="chat-messages">
                                    {groupMessages.map((msg, idx) => (
                                        <div key={idx} className="chat-bubble admin">
                                            <div className="sender-name">{msg.sender}</div>
                                            <span>{msg.content}</span>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                {/* Restore chat input for group chat */}
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
                                                <div className="sender-name">{displayName}</div>
                                                <span>{msg.content}</span>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                                {/* Restore chat input for private chat */}
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
                                {selectedUser && (
                                    <button
                                        style={{ margin: '8px 0', color: '#CB1E2A', background: 'none', border: '1px solid #CB1E2A', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', float: 'right' }}
                                        onClick={async () => {
                                            if (window.confirm('Delete this private chat?')) {
                                                const roomId = generateRoomId(selectedUser.username);
                                                await axios.delete(`${API_BASE}/api/messages/private/${roomId}`);
                                                setMessages([]);
                                            }
                                        }}
                                        title="Delete User Chat"
                                    >Delete Chat 🗑️</button>
                                )}
                            </>
                        ) : (
                            <div className="select-user-text">Select a user to start chatting</div>
                        )
                    )}
                </div>
            </div>

            {showCreateGroupModal && (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal-content" style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 400, maxWidth: 480, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
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
                        // Show a user picker (simple prompt for demo)
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
        // Ensure admin is included in members
        const memberUsernames = groupUsers.map(u => u.username);
        if (!memberUsernames.includes(currentAdminUsername)) {
            memberUsernames.push(currentAdminUsername);
        }
        try {
            const res = await axios.post(`https://ibayanihubweb-backend.onrender.com/api/groupchats`, {
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
            // TODO: Optionally refresh group chat list here
        } catch (err) {
            alert('Failed to create group chat.');
        }
    }}
> Create </button>
                </div>
            </div>
        </div>
    </div>
)}
        </div>
    );
};

export default Conversation;
