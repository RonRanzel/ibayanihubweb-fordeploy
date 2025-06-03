import { logAuditFrontend } from '../../logAuditFrontend';
import React, { useEffect } from "react";

const Analytics = () => { 
    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Analytics',
            details: 'Admin viewed the Analytics panel',
            platform: 'web'
        });
    }, []);
    return(
        <div>

        </div>
    )
}

export default Analytics