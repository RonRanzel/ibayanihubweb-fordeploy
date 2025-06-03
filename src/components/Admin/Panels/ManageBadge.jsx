import { logAuditFrontend } from '../../logAuditFrontend';
import React, { useEffect } from "react";

const ManageBadge = () => { 
    useEffect(() => {
        logAuditFrontend({
            userId: localStorage.getItem('adminEmail') || 'unknown',
            userType: 'admin',
            action: 'View Manage Badge',
            details: 'Admin viewed the Manage Badge panel',
            platform: 'web'
        });
    }, []);
    return(
        <div>

        </div>
    )
}

export default ManageBadge