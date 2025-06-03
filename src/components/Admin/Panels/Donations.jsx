import { logAuditFrontend } from '../../logAuditFrontend';
import React, { useEffect, useState } from "react";
import searchIcon from "../../Assets/searchicon.svg";
import profIcon from "../../Assets/user_icon.png";
import dlIcon from "../../Assets/downloadicon.svg";
import axios from 'axios';
import '../../Styles/sDonation.css';

const Donations = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('accepted');
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDonationModal, setShowDonationModal] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Donations',
            details: 'Admin viewed the Donations panel',
            platform: 'web'
        });
    }, []);
    useEffect(() => {
        fetch('https://ibayanihub-backend.onrender.com/api/donations')
            .then(res => res.json())
            .then(data => {
                console.log('Fetched donations:', data); // Debug output
                setDonations(data); 
                setLoading(false); 
            })
            .catch(() => setLoading(false));
    }, []);
    // Fetch logged-in admin details
    useEffect(() => {
        const email = localStorage.getItem('adminEmail');
        if (email) {
            axios.get(`https://ibayanihubweb-backend.onrender.com/api/getAdminByEmail/${email}`)
                .then(response => setLoggedInAdmin(response.data))
                .catch(error => console.log("Error fetching logged-in admin:", error));
        }
    }, []);

    // Filter donations by status
    const requests = donations.filter(d => d.status === 'pending');
    const accepted = donations.filter(d => d.status === 'accepted');

    // Accept donation
    const handleAccept = async (id) => {
        await fetch(`https://ibayanihub-backend.onrender.com/api/donations/${id}/accept`, { method: 'PUT' });
        setDonations(donations => donations.map(d => d._id === id ? { ...d, status: 'accepted' } : d));
    };
    // Reject donation
    const handleReject = async (id) => {
        await fetch(`https://ibayanihub-backend.onrender.com/api/donations/${id}/reject`, { method: 'PUT' });
        setDonations(donations => donations.map(d => d._id === id ? { ...d, status: 'rejected' } : d));
    };
    // Download donations as CSV
    const handleDownloadDonations = () => {
        const data = (activeTab === 'accepted' ? accepted : requests);
        if (!data.length) return alert('No donations to download.');
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'Download Donations',
            details: `Downloaded ${activeTab} donations as CSV`,
            platform: 'web'
        });
        const headers = [
            'Name', 'Amount', 'Reference', 'Photo', 'Date', 'Status'
        ];
        const rows = data.map(donation => [
            donation.fullName || '',
            donation.amount || '',
            donation.reference || '',
            donation.photoUrl || donation.profilePicture || '',
            donation.createdAt ? new Date(donation.createdAt).toLocaleString() : '',
            donation.status || ''
        ]);
        const csv = [headers, ...rows].map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `donations_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: 24, background: '#f4f4f4', minHeight: '100vh' }}>
            {/* Header */}
            <div className="dashb-header">
                <div className="dashb-header-left">
                    <div className="dashb-date-time-box">
                        <div className="dashb-date">{dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div className="dashb-time">{dateTime.toLocaleTimeString('en-US', { hour12: true })}</div>
                    </div>
                </div>
                <div className="dashb-title-main">Donation Management</div>
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
            {/* Tabs, Search, Download */}
            <div className="donate-top-bar">
                <div className="donate-tabs">
                    <button className={activeTab === 'accepted' ? 'donate-tab-btn donate-active-tab' : 'donate-tab-btn'} onClick={() => setActiveTab('accepted')}>Monitor Transactions</button>
                    <button className={activeTab === 'requests' ? 'donate-tab-btn donate-active-tab' : 'donate-tab-btn'} onClick={() => setActiveTab('requests')}>Transaction Requests</button>
                </div>
                <div className="donate-search-container">
                    <div className="donate-searchbar">
                        <img src={searchIcon} alt="Search" className="donate-search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, username, event title, or program..."
                            // value={searchTerm}
                            // onChange={(e) => setSearchTerm(e.target.value)}
                            className="donate-search-input"
                        />
                    </div>
                    <button className="donate-download-button" onClick={handleDownloadDonations}>
                        <img src={dlIcon} alt="Download" />
                        <span>Download</span>
                    </button>
                </div>
            </div>
            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 20, marginTop: 8 }}>
                {loading ? <p>Loading...</p> : (
                <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f7f7f7' }}>
                            <th style={{ padding: 8, fontWeight: 600 }}>Name</th>
                            <th style={{ padding: 8, fontWeight: 600 }}>Amount</th>
                            <th style={{ padding: 8, fontWeight: 600 }}>Reference</th>
                            <th style={{ padding: 8, fontWeight: 600 }}>Photo</th>
                            <th style={{ padding: 8, fontWeight: 600 }}>Date</th>
                            <th style={{ padding: 8, fontWeight: 600 }}>View</th>
                            {activeTab === 'requests' && <th style={{ padding: 8, fontWeight: 600 }}>Action</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {(activeTab === 'accepted' ? accepted : requests).map((row, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 8 }}>{row.fullName}</td>
                                <td style={{ padding: 8 }}>{row.amount}</td>
                                <td style={{ padding: 8 }}>{row.reference}</td>
                                <td style={{ padding: 8 }}>
                                    {row.photoUrl ? (
                                        <a href={row.photoUrl} target="_blank" rel="noopener noreferrer">View</a>
                                    ) : row.profilePicture ? (
                                        <a href={row.profilePicture} target="_blank" rel="noopener noreferrer">View</a>
                                    ) : '—'}
                                </td>
                                <td style={{ padding: 8 }}>{row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}</td>
                                <td style={{ padding: 8 }}>
                                    <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setSelectedDonation(row); setShowDonationModal(true); }}>View</button>
                                </td>
                                {activeTab === 'requests' && (
                                    <td style={{ padding: 8 }}>
                                        <button style={{ background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, marginRight: 8, cursor: 'pointer' }} onClick={() => handleAccept(row._id)}>Accept</button>
                                        <button style={{ background: '#F44336', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleReject(row._id)}>Reject</button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                )}
            </div>
            {/* Donation View Modal */}
            {showDonationModal && selectedDonation && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content" style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 420, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ margin: 0, color: '#CB1E2A' }}>Donation Details</h2>
                            <button onClick={() => setShowDonationModal(false)} style={{ background: 'none', border: 'none', fontSize: 28, fontWeight: 700, color: '#CB1E2A', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <strong>Name:</strong> {selectedDonation.fullName}<br />
                            <strong>Amount:</strong> {selectedDonation.amount}<br />
                            <strong>Reference:</strong> {selectedDonation.reference}<br />
                            <strong>Status:</strong> {selectedDonation.status}<br />
                            <strong>Date:</strong> {selectedDonation.createdAt ? new Date(selectedDonation.createdAt).toLocaleString() : ''}<br />
                        </div>
                        {selectedDonation.photoUrl && (
                            <div style={{ marginBottom: 16 }}>
                                <strong>Receipt Image:</strong><br />
                                <img src={selectedDonation.photoUrl} alt="Receipt" style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8, marginTop: 8 }} />
                            </div>
                        )}
                        {!selectedDonation.photoUrl && selectedDonation.profilePicture && (
                            <div style={{ marginBottom: 16 }}>
                                <strong>Receipt Image:</strong><br />
                                <img src={selectedDonation.profilePicture} alt="Receipt" style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8, marginTop: 8 }} />
                            </div>
                        )}
                        {!selectedDonation.photoUrl && !selectedDonation.profilePicture && (
                            <div style={{ marginBottom: 16 }}>
                                <strong>Receipt Image:</strong><br />
                                <span style={{ color: '#888' }}>No image provided.</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Donations;