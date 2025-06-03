import { logAuditFrontend } from '../../logAuditFrontend';
import React, { useEffect } from "react";

const DonationForm = () => { 
    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Donation Form',
            details: 'Admin viewed the Donation Form panel',
            platform: 'web'
        });
    }, []);
    return(
        <div>

        </div>
    )
}

export default DonationForm
