import { logAuditFrontend } from '../../logAuditFrontend';
import React, { useEffect, useState } from "react";
import searchIcon from "../../Assets/searchicon.svg";
import profIcon from "../../Assets/user_icon.png";
import dlIcon from "../../Assets/downloadicon.svg";
import '../../Styles/sDonation.css';
import '../../Styles/sHeader.css';

const TABS = [
    { key: 'cash', label: "Cash" },
    { key: 'inKind', label: "In-Kind" },
    { key: 'fraud', label: "Fraud" },
];

const DonationManagement = () => {
    const [dateTime, setDateTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('cash');
    const [searchTerm1, setSearchTerm1] = useState("");
    const [searchTerm2, setSearchTerm2] = useState("");
    const [loggedInAdmin, setLoggedInAdmin] = useState(null);
    const [donations, setDonations] = useState([]);
    const [inKindDonations, setInKindDonations] = useState([]);
    const [acceptedInKindDonations, setAcceptedInKindDonations] = useState([]);
    const [loadingDonations, setLoadingDonations] = useState(false);
    const [selectedDonation, setSelectedDonation] = useState(null);
    const [fraudDonations, setFraudDonations] = useState([]);
    const [fraudTabType, setFraudTabType] = useState('cash');
    const [fraudInKindDonations, setFraudInKindDonations] = useState([]);

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
        const email = localStorage.getItem('adminEmail');
        if (email) {
            fetch(`https://ibayanihubweb-backend.onrender.com/api/getAdminByEmail/${email}`)
                .then(r => r.json())
                .then(setLoggedInAdmin)
                .catch(() => {});
        }
    }, []);
    useEffect(() => {
        if (activeTab === 'cash') {
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/donations')
                .then(res => res.json())
                .then(data => {
                    setDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
        } else if (activeTab === 'inKind') {
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations')
                .then(res => res.json())
                .then(data => {
                    setInKindDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
            // Fetch accepted in-kind donations
            fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations/accepted')
                .then(res => res.json())
                .then(data => {
                    setAcceptedInKindDonations(Array.isArray(data) ? data : []);
                })
                .catch(() => setAcceptedInKindDonations([]));
        } else if (activeTab === 'fraud') {
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/donations/rejected')
                .then(res => res.json())
                .then(data => {
                    setFraudDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
            fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations/rejected')
                .then(res => res.json())
                .then(data => {
                    setFraudInKindDonations(Array.isArray(data) ? data : []);
                })
                .catch(() => setFraudInKindDonations([]));
        }
    }, [activeTab]);

    // Table headings for each tab and table
    const TABLE_HEADINGS = {
        cash: {
            pending: [
                { label: "Donated By", key: "donor" },
                { label: "Amount", key: "amount" },
                { label: "Submitted At", key: "submitted" },
                { label: "Action", key: "action" }
            ],
            accepted: [
                { label: "Donated By", key: "donor" },
                { label: "Amount", key: "amount" },
                { label: "Accepted At", key: "accepted" },
                { label: "Action", key: "action" }
            ]
        },
        inKind: {
            pending: [
                { label: "Donated By", key: "donor" },
                { label: "Via", key: "via" },
                { label: "Submitted At", key: "submitted" },
                { label: "Action", key: "action" }
            ],
            accepted: [
                { label: "Donated By", key: "donor" },
                { label: "Accepted At", key: "accepted" },
                { label: "Action", key: "action" }
            ]
        },
        fraud: {
            fraud: [
                { label: "Donated By", key: "donor" },
                { label: "Submitted At", key: "submitted" },
                { label: "Reference No", key: "reference" },
                { label: "Detects", key: "detects" },
                { label: "Action", key: "action" }
            ]
        }
    };

    // Renderers for tables with empty data
    function renderTable(headings, rows) {
        return (
            <table className="donate-table">
                <thead>
                    <tr>
                        {headings.map(h => (
                            <th key={h.key}>{h.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr><td colSpan={headings.length} style={{ textAlign: 'center', color: '#888' }}>No data</td></tr>
                    ) : rows.map((row, idx) => (
                        <tr key={idx}>
                            {headings.map(h => <td key={h.key}>{row[h.key]}</td>)}
                            {row._donationObj && (
                                <td>
                                    <button onClick={() => setSelectedDonation(row._donationObj)} style={{padding: '4px 10px', background: '#CB1E2A', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer'}}>View</button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    // Card-style table headers (volunteer-like)
    function renderCardTable(title, count, searchTerm, setSearchTerm, headings, rows) {
        return (
            <div className="donate-side-table">
                <div className="donate-card-header">
                    <div className="donate-card-title">{title} <span className="donate-card-count">{count}</span></div>
                </div>
                <div className="donate-card-search-row">
                    <div className="donate-searchbar">
                        <img src={searchIcon} alt="Search" className="donate-search-icon" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="donate-search-input"
                        />
                    </div>
                    <button className="donate-download-button" disabled>
                        <img src={dlIcon} alt="Download" />
                        <span>Download</span>
                    </button>
                </div>
                <div className="donate-table-scroll" style={{ minHeight: 360, maxHeight: 360 }}>
                    {renderTable(headings, rows)}
                </div>
            </div>
        );
    }

    function handleAcceptDonation(donation) {
        fetch(`https://ibayanihub-backend.onrender.com/api/donations/${donation._id}/accept`, {
            method: 'PUT',
        })
        .then(res => res.json())
        .then(() => {
            setSelectedDonation(null);
            // Refresh donations
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/donations')
                .then(res => res.json())
                .then(data => {
                    setDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
        });
    }
    function handleRejectDonation(donation) {
        fetch(`https://ibayanihub-backend.onrender.com/api/donations/${donation._id}/reject`, {
            method: 'PUT',
        })
        .then(res => res.json())
        .then(() => {
            setSelectedDonation(null);
            setFraudDonations(prev => {
                const updated = [...prev, donation];
                localStorage.setItem('fraudDonations', JSON.stringify(updated));
                return updated;
            });
            setDonations(prev => prev.filter(d => d._id !== donation._id)); // Remove from donations
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/donations')
                .then(res => res.json())
                .then(data => {
                    setDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
        });
    }
    function handleAcceptInKindDonation(donation) {
        fetch(`https://ibayanihub-backend.onrender.com/api/in-kind-donations/${donation._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'accepted' })
        })
        .then(res => res.json())
        .then(() => {
            setSelectedDonation(null);
            setInKindDonations(prev => prev.filter(d => d._id !== donation._id)); // Remove from pending in-kind list immediately
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations')
                .then(res => res.json())
                .then(data => {
                    setInKindDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
            // Refresh accepted in-kind donations
            fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations/accepted')
                .then(res => res.json())
                .then(data => {
                    setAcceptedInKindDonations(Array.isArray(data) ? data : []);
                })
                .catch(() => setAcceptedInKindDonations([]));
        });
    }
    function handleRejectInKindDonation(donation) {
        fetch(`https://ibayanihub-backend.onrender.com/api/in-kind-donations/${donation._id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
        })
        .then(res => res.json())
        .then(() => {
            setSelectedDonation(null);
            setInKindDonations(prev => prev.filter(d => d._id !== donation._id)); // Remove from pending in-kind list immediately
            setLoadingDonations(true);
            fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations')
                .then(res => res.json())
                .then(data => {
                    setInKindDonations(Array.isArray(data) ? data : []);
                    setLoadingDonations(false);
                })
                .catch(() => setLoadingDonations(false));
        });
    }
    function handleBackToPending(donation) {
        // Remove from fraudDonations
        setFraudDonations(prev => {
            const updated = prev.filter(d => d._id !== donation._id);
            localStorage.setItem('fraudDonations', JSON.stringify(updated));
            return updated;
        });
        // Backend update for cash donations
        if (!donation.type || donation.type === 'cash') {
            fetch(`https://ibayanihub-backend.onrender.com/api/donations/${donation._id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending' })
            })
            .then(res => res.json())
            .then(() => {
                setLoadingDonations(true);
                fetch('https://ibayanihub-backend.onrender.com/api/donations')
                    .then(res => res.json())
                    .then(data => {
                        setDonations(Array.isArray(data) ? data : []);
                        setLoadingDonations(false);
                    })
                    .catch(() => setLoadingDonations(false));
            });
        } else if (donation.type === 'inKind') {
            fetch(`https://ibayanihub-backend.onrender.com/api/in-kind-donations/${donation._id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'pending' })
            })
            .then(res => res.json())
            .then(() => {
                setLoadingDonations(true);
                fetch('https://ibayanihub-backend.onrender.com/api/in-kind-donations')
                    .then(res => res.json())
                    .then(data => {
                        setInKindDonations(Array.isArray(data) ? data : []);
                        setLoadingDonations(false);
                    })
                    .catch(() => setLoadingDonations(false));
            });
        }
        setSelectedDonation(null);
    }

    return (
        <div id="donate-container">
            {/* Header */}
            <div className="header">
                <div className="header-left">
                    <div className="header-cTitle">
                        <p className="header-title">Donation Management</p>
                    </div>
                    <div className="header-cDateTime">
                        <p className="header-date">
                            {dateTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="header-time">
                            {dateTime.toLocaleTimeString('en-US', { hour12: true })}
                        </p>
                    </div>
                </div>
                <div className="header-right">
                    <div className="header-cProf">
                        <img src={profIcon} alt="User" className="header-img" />
                        <div className="header-cName">
                            <p className="header-name">
                                {loggedInAdmin
                                    ? `${loggedInAdmin.admin_firstName?.toUpperCase()}${loggedInAdmin.admin_middleName ? ' ' + loggedInAdmin.admin_middleName.toUpperCase() : ''} ${loggedInAdmin.admin_lastName?.toUpperCase()}`
                                    : 'Admin'}
                            </p>
                            <p className="header-email">{loggedInAdmin?.admin_email || ''}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="donate-top-bar">
                <div className="donate-tabs">
                    {TABS.map(tab =>
                        <button
                            key={tab.key}
                            className={activeTab === tab.key ? 'donate-tab-btn donate-active-tab' : 'donate-tab-btn'}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    )}
                </div>
                <div className="donate-type-title">
                    {activeTab === 'cash' && 'Cash Transactions'}
                    {activeTab === 'inKind' && 'In-Kind Transactions'}
                    {activeTab === 'fraud' && 'Fraud Transactions'}
                </div>
            </div>

            {/* Tab Content */}
            <div className="donation-tab-content-main" style={{ marginTop: 18 }}>
                {/* CASH: Show 2 tables side by side */}
                {activeTab === 'cash' && (
                    <div className="donate-table-flex" style={{ display: "flex", gap: 24 }}>
                        {renderCardTable(
                            "Pending Transactions",
                            donations.filter(d => d.status === 'pending').length,
                            searchTerm1,
                            setSearchTerm1,
                            TABLE_HEADINGS.cash.pending,
                            donations.filter(d => d.status === 'pending' && (
                                d.fullName?.toLowerCase().includes(searchTerm1.toLowerCase()) ||
                                d.reference?.toLowerCase().includes(searchTerm1.toLowerCase())
                            )).map(d => ({
                                donor: d.fullName,
                                amount: `₱${d.amount}`,
                                submitted: new Date(d.createdAt).toLocaleString(),
                                action: '',
                                _donationObj: d
                            }))
                        )}
                        {renderCardTable(
                            "Accepted Transactions",
                            donations.filter(d => d.status === 'accepted').length,
                            searchTerm2,
                            setSearchTerm2,
                            TABLE_HEADINGS.cash.accepted,
                            donations.filter(d => d.status === 'accepted' && (
                                d.fullName?.toLowerCase().includes(searchTerm2.toLowerCase()) ||
                                d.reference?.toLowerCase().includes(searchTerm2.toLowerCase())
                            )).map(d => ({
                                donor: d.fullName,
                                amount: `₱${d.amount}`,
                                accepted: new Date(d.createdAt).toLocaleString(),
                                action: '',
                                _donationObj: d
                            }))
                        )}
                    </div>
                )}

                {/* IN-KIND: Show 2 tables side by side */}
                {activeTab === 'inKind' && (
                    <div className="donate-table-flex" style={{ display: "flex", gap: 24 }}>
                        <div className="donate-side-table">
                            <div className="donate-card-header">
                                <div className="donate-card-title">In-Kind Transactions <span className="donate-card-count">{inKindDonations.length}</span></div>
                            </div>
                            <div className="donate-card-search-row">
                                <div className="donate-searchbar">
                                    <img src={searchIcon} alt="Search" className="donate-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchTerm1}
                                        onChange={e => setSearchTerm1(e.target.value)}
                                        className="donate-search-input"
                                    />
                                </div>
                            </div>
                            <div className="donate-table-scroll" style={{ minHeight: 360, maxHeight: 360 }}>
                                <table className="donate-table">
                                    <thead>
                                        <tr>
                                            <th>Donated By</th>
                                            <th>Qty</th>
                                            <th>Unit</th>
                                            <th>Particulars</th>
                                            <th>Unit Cost</th>
                                            <th>Total</th>
                                            <th>Via</th>
                                            <th>Drop Off</th>
                                            <th>Notes</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inKindDonations.length === 0 ? (
                                            <tr><td colSpan={10} style={{ textAlign: 'center', color: '#888' }}>No data</td></tr>
                                        ) : inKindDonations.filter(d => d.status === 'pending' && (
                                            d.particulars?.toLowerCase().includes(searchTerm1.toLowerCase()) ||
                                            d.username?.toLowerCase().includes(searchTerm1.toLowerCase())
                                        )).map((d, idx) => (
                                            <tr key={idx}>
                                                <td>{d.username}</td>
                                                <td>{d.qty}</td>
                                                <td>{d.unit}</td>
                                                <td>{d.particulars}</td>
                                                <td>{d.unitCost}</td>
                                                <td>{d.total}</td>
                                                <td>{d.via}</td>
                                                <td>{d.dropOff}</td>
                                                <td>{d.notes}</td>
                                                <td>
                                                    <button onClick={() => setSelectedDonation({ ...d, type: 'inKind' })} style={{padding:'4px 10px',background:'#CB1E2A',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Accepted In-Kind Transactions Table */}
                        <div className="donate-side-table">
                            <div className="donate-card-header">
                                <div className="donate-card-title">Accepted In-Kind Transactions <span className="donate-card-count">{acceptedInKindDonations.length}</span></div>
                            </div>
                            <div className="donate-card-search-row">
                                <div className="donate-searchbar">
                                    <img src={searchIcon} alt="Search" className="donate-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchTerm2}
                                        onChange={e => setSearchTerm2(e.target.value)}
                                        className="donate-search-input"
                                    />
                                </div>
                            </div>
                            <div className="donate-table-scroll" style={{ minHeight: 360, maxHeight: 360 }}>
                                <table className="donate-table">
                                    <thead>
                                        <tr>
                                            <th>Donated By</th>
                                            <th>Accepted At</th>
                                            <th>Qty</th>
                                            <th>Unit</th>
                                            <th>Particulars</th>
                                            <th>Total</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {acceptedInKindDonations.length === 0 ? (
                                            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No data</td></tr>
                                        ) : acceptedInKindDonations.filter(d =>
                                            d.particulars?.toLowerCase().includes(searchTerm2.toLowerCase()) ||
                                            d.username?.toLowerCase().includes(searchTerm2.toLowerCase())
                                        ).map((d, idx) => (
                                            <tr key={idx}>
                                                <td>{d.username}</td>
                                                <td>{new Date(d.createdAt).toLocaleString()}</td>
                                                <td>{d.qty}</td>
                                                <td>{d.unit}</td>
                                                <td>{d.particulars}</td>
                                                <td>{d.total}</td>
                                                <td>
                                                    <button onClick={() => setSelectedDonation({ ...d, type: 'inKind' })} style={{padding:'4px 10px',background:'#CB1E2A',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* FRAUD tab: single table */}
                {activeTab === 'fraud' && (
                    <div className="donate-fraud-placeholder">
                        <div className="donate-card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div className="donate-card-title">Fraud Transactions <span className="donate-card-count">{fraudTabType === 'cash' ? fraudDonations.length : fraudInKindDonations.length}</span></div>
                          <div>
                            <button onClick={()=>setFraudTabType('cash')} style={{marginRight:8,background:fraudTabType==='cash'?'#CB1E2A':'#fff',color:fraudTabType==='cash'?'#fff':'#CB1E2A',border:'1px solid #CB1E2A',borderRadius:6,padding:'4px 14px',fontWeight:'bold',cursor:'pointer'}}>Cash</button>
                            <button onClick={()=>setFraudTabType('inKind')} style={{background:fraudTabType==='inKind'?'#CB1E2A':'#fff',color:fraudTabType==='inKind'?'#fff':'#CB1E2A',border:'1px solid #CB1E2A',borderRadius:6,padding:'4px 14px',fontWeight:'bold',cursor:'pointer'}}>In-Kind</button>
                          </div>
                        </div>
                        <div className="donate-card-search-row">
                          <div className="donate-searchbar">
                            <img src={searchIcon} alt="Search" className="donate-search-icon" />
                            <input type="text" placeholder="Search" className="donate-search-input" disabled />
                          </div>
                          <button className="donate-download-button" disabled>
                            <img src={dlIcon} alt="Download" />
                            <span>Download</span>
                          </button>
                        </div>
                        <div className="donate-table-scroll" style={{ minHeight: 360, maxHeight: 360 }}>
                          <table className="donate-table">
                            <thead>
                              <tr>
                                {fraudTabType === 'cash' ? (
                                  <>
                                    <th>Donated By</th>
                                    <th>Submitted At</th>
                                    <th>Reference No</th>
                                    <th>Type</th>
                                    <th>Action</th>
                                  </>
                                ) : (
                                  <>
                                    <th>Donated By</th>
                                    <th>Qty</th>
                                    <th>Unit</th>
                                    <th>Particulars</th>
                                    <th>Total</th>
                                    <th>Submitted At</th>
                                    <th>Action</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {fraudTabType === 'cash' ? (
                                fraudDonations.length === 0 ? (
                                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No data</td></tr>
                                ) : fraudDonations.map((d, idx) => (
                                  <tr key={idx}>
                                    <td>{d.username || d.fullName}</td>
                                    <td>{new Date(d.createdAt).toLocaleString()}</td>
                                    <td>{d.reference || '-'}</td>
                                    <td>{d.type === 'inKind' ? 'In-Kind' : 'Cash'}</td>
                                    <td><button onClick={() => setSelectedDonation(d)} style={{padding:'4px 10px',background:'#CB1E2A',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>View</button></td>
                                  </tr>
                                ))
                              ) : (
                                fraudInKindDonations.length === 0 ? (
                                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No data</td></tr>
                                ) : fraudInKindDonations.map((d, idx) => (
                                  <tr key={idx}>
                                    <td>{d.username}</td>
                                    <td>{d.qty}</td>
                                    <td>{d.unit}</td>
                                    <td>{d.particulars}</td>
                                    <td>{d.total}</td>
                                    <td>{new Date(d.createdAt).toLocaleString()}</td>
                                    <td><button onClick={() => setSelectedDonation({ ...d, type: 'inKind' })} style={{padding:'4px 10px',background:'#CB1E2A',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>View</button></td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Donation Detail Modal */}
            {selectedDonation && activeTab === 'fraud' && (
              <div className="donation-modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="donation-modal-content" style={{background:'#f4f4f4',padding:0,borderRadius:14,maxWidth:500,width:'95%',position:'relative',boxShadow:'0 4px 32px rgba(0,0,0,0.18)'}}>
                    {/* Header */}
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#CB1E2A',borderTopLeftRadius:14,borderTopRightRadius:14,padding:'18px 24px 12px 24px'}}>
                        <span style={{color:'#fff',fontWeight:'bold',fontSize:22}}>Fraud Transaction Proof</span>
                        <button onClick={()=>setSelectedDonation(null)} style={{background:'none',border:'none',fontSize:28,color:'#fff',cursor:'pointer',marginLeft:8}}>&times;</button>
                    </div>
                    {/* Proof Image (Reverted logic) */}
                    {selectedDonation.proof || selectedDonation.photoUrl ? (
                    <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
                      <img src={selectedDonation.proof || selectedDonation.photoUrl} alt="Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb'}} />
                    </div>
                  ) : null}
                  {/* In-Kind/Cash Proof Image */}
                  {selectedDonation.type === 'inKind' ? (
                    <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
                      {selectedDonation.proof ? (
                        <img src={selectedDonation.proof} alt="Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb'}} onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/220x180?text=No+Image';}} />
                      ) : (
                        <img src="https://via.placeholder.com/220x180?text=No+Image" alt="No Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb',opacity:0.7}} />
                      )}
                    </div>
                  ) : (selectedDonation.photoUrl ? (
                    <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
                      <img src={selectedDonation.photoUrl} alt="Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb'}} onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/220x180?text=No+Image';}} />
                    </div>
                  ) : null)}
                    {/* Details Card */}
                    <div style={{background:'#fff',margin:'24px 24px 0 24px',borderRadius:10,boxShadow:'0 1px 8px #eee',padding:'18px 18px 10px 18px',display:'flex',flexDirection:'column',gap:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                            <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <img src={profIcon} alt="User" style={{width:38,height:38,borderRadius:'50%',border:'2px solid #CB1E2A'}} />
                                <div>
                                    <div style={{fontWeight:'bold',fontSize:16}}>{selectedDonation.fullName}</div>
                                    <div style={{fontSize:13,color:'#888'}}>@{selectedDonation.username}</div>
                                </div>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <div style={{fontSize:13,color:'#888'}}>Submitted At</div>
                                <div style={{fontWeight:'bold',fontSize:15}}>{new Date(selectedDonation.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}</div>
                                <div style={{fontSize:12,color:'#888'}}>{new Date(selectedDonation.createdAt).toLocaleTimeString()}</div>
                            </div>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',gap:18}}>
                            <div style={{fontSize:14}}><b>Reference No</b><br/>{selectedDonation.reference}</div>
                            <div style={{fontSize:14}}><b>Event</b><br/>TELETHON: Alap Kapwa 2025</div>
                            <div style={{fontSize:14}}><b>Amount</b><br/>{`₱${selectedDonation.amount}`}</div>
                            <div style={{fontSize:14}}><b>Notes</b><br/><button style={{background:'#CB1E2A',color:'#fff',border:'none',borderRadius:6,padding:'2px 12px',fontWeight:'bold',cursor:'pointer'}}>View Notes</button></div>
                        </div>
                    </div>
                    {/* Action Buttons */}
                    <div style={{display:'flex',gap:18,margin:'28px 24px 24px 24px',justifyContent:'center'}}>
                      <button onClick={()=>{handleBackToPending(selectedDonation);setSelectedDonation(null);}} style={{flex:1,background:'#3498db',color:'#fff',padding:'14px 0',border:'none',borderRadius:8,fontWeight:'bold',fontSize:17,cursor:'pointer',maxWidth:220}}>Back to Pending</button>
                    </div>
                </div>
              </div>
            )}

            {/* Transaction Detail Modal (for cash/in-kind) */}
            {selectedDonation && activeTab !== 'fraud' && (
              <div className="donation-modal-overlay" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="donation-modal-content" style={{background:'#fff',padding:0,borderRadius:14,maxWidth:500,width:'95%',position:'relative',boxShadow:'0 4px 32px rgba(0,0,0,0.18)'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',background:'#CB1E2A',borderTopLeftRadius:14,borderTopRightRadius:14,padding:'18px 24px 12px 24px'}}>
                    <span style={{color:'#fff',fontWeight:'bold',fontSize:22}}>{selectedDonation.type === 'inKind' ? 'In-Kind Donation Details' : 'Cash Donation Details'}</span>
                    <button onClick={()=>setSelectedDonation(null)} style={{background:'none',border:'none',fontSize:28,color:'#fff',cursor:'pointer',marginLeft:8}}>&times;</button>
                  </div>
                  {selectedDonation.proof || selectedDonation.photoUrl ? (
                    <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
                      <img src={selectedDonation.proof || selectedDonation.photoUrl} alt="Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb'}} />
                    </div>
                  ) : null}
                  {/* In-Kind/Cash Proof Image */}
                  {selectedDonation.type === 'inKind' ? (
                    <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
                      {selectedDonation.proof ? (
                        <img src={selectedDonation.proof} alt="Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb'}} onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/220x180?text=No+Image';}} />
                      ) : (
                        <img src="https://via.placeholder.com/220x180?text=No+Image" alt="No Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb',opacity:0.7}} />
                      )}
                    </div>
                  ) : (selectedDonation.photoUrl ? (
                    <div style={{display:'flex',justifyContent:'center',marginTop:18}}>
                      <img src={selectedDonation.photoUrl} alt="Proof" style={{maxWidth:220,maxHeight:320,borderRadius:10,boxShadow:'0 2px 8px #bbb'}} onError={e => {e.target.onerror=null;e.target.src='https://via.placeholder.com/220x180?text=No+Image';}} />
                    </div>
                  ) : null)}
                  <div style={{background:'#fff',margin:'24px 24px 0 24px',borderRadius:10,boxShadow:'0 1px 8px #eee',padding:'18px 18px 10px 18px',display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <img src={profIcon} alt="User" style={{width:38,height:38,borderRadius:'50%',border:'2px solid #CB1E2A'}} />
                        <div>
                          <div style={{fontWeight:'bold',fontSize:16}}>{selectedDonation.fullName || selectedDonation.username}</div>
                          <div style={{fontSize:13,color:'#888'}}>@{selectedDonation.username}</div>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:13,color:'#888'}}>Submitted At</div>
                        <div style={{fontWeight:'bold',fontSize:15}}>{new Date(selectedDonation.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'})}</div>
                        <div style={{fontSize:12,color:'#888'}}>{new Date(selectedDonation.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    {selectedDonation.type === 'inKind' ? (
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <div><b>Qty:</b> {selectedDonation.qty}</div>
                        <div><b>Unit:</b> {selectedDonation.unit}</div>
                        <div><b>Particulars:</b> {selectedDonation.particulars}</div>
                        <div><b>Unit Cost:</b> {selectedDonation.unitCost}</div>
                        <div><b>Total:</b> {selectedDonation.total}</div>
                        <div><b>Via:</b> {selectedDonation.via}</div>
                        <div><b>Drop Off:</b> {selectedDonation.dropOff}</div>
                        <div><b>Notes:</b> {selectedDonation.notes}</div>
                      </div>
                    ) : (
                      <div style={{display:'flex',justifyContent:'space-between',gap:18}}>
                        <div style={{fontSize:14}}><b>Reference No</b><br/>{selectedDonation.reference}</div>
                        <div style={{fontSize:14}}><b>Event</b><br/>TELETHON: Alap Kapwa 2025</div>
                        <div style={{fontSize:14}}><b>Amount</b><br/>{`₱${selectedDonation.amount}`}</div>
                        <div style={{fontSize:14}}><b>Notes</b><br/><button style={{background:'#CB1E2A',color:'#fff',border:'none',borderRadius:6,padding:'2px 12px',fontWeight:'bold',cursor:'pointer'}}>View Notes</button></div>
                      </div>
                    )}
                  </div>
                  {/* Action Buttons */}
                  {selectedDonation.type === 'inKind' && selectedDonation.status === 'pending' ? (
                    <div style={{display:'flex',gap:18,margin:'28px 24px 24px 24px'}}>
                      <button onClick={()=>{
                        handleRejectInKindDonation(selectedDonation);
                        setSelectedDonation(null);
                      }} style={{flex:1,background:'#CB1E2A',color:'#fff',padding:'14px 0',border:'none',borderRadius:8,fontWeight:'bold',fontSize:17,cursor:'pointer'}}>Reject Transaction</button>
                      <button onClick={()=>{
                        handleAcceptInKindDonation(selectedDonation);
                        setSelectedDonation(null);
                      }} style={{flex:1,background:'#2ecc40',color:'#fff',padding:'14px 0',border:'none',borderRadius:8,fontWeight:'bold',fontSize:17,cursor:'pointer'}}>Accept Transaction</button>
                    </div>
                  ) : selectedDonation.type !== 'inKind' && selectedDonation.status === 'pending' ? (
                    <div style={{display:'flex',gap:18,margin:'28px 24px 24px 24px'}}>
                      <button onClick={()=>{
                        handleRejectDonation(selectedDonation);
                        setSelectedDonation(null);
                      }} style={{flex:1,background:'#CB1E2A',color:'#fff',padding:'14px 0',border:'none',borderRadius:8,fontWeight:'bold',fontSize:17,cursor:'pointer'}}>Reject Transaction</button>
                      <button onClick={()=>{
                        handleAcceptDonation(selectedDonation);
                        setSelectedDonation(null);
                      }} style={{flex:1,background:'#2ecc40',color:'#fff',padding:'14px 0',border:'none',borderRadius:8,fontWeight:'bold',fontSize:17,cursor:'pointer'}}>Approve For Pending</button>
                    </div>
                  ) : null}
                  {selectedDonation.status === 'accepted' && (
                    <div style={{display:'flex',gap:18,margin:'28px 24px 24px 24px',justifyContent:'center'}}>
                      <button onClick={()=>{
                        handleBackToPending(selectedDonation);
                        setSelectedDonation(null);
                      }} style={{flex:1,background:'#3498db',color:'#fff',padding:'14px 0',border:'none',borderRadius:8,fontWeight:'bold',fontSize:17,cursor:'pointer',maxWidth:220}}>Back to Pending</button>
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
    );
};

export default DonationManagement;