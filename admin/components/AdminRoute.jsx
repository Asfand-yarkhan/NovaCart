import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../frontend/src/context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Loading admin panel...
            </div>
        );
    }

    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

    if (user.role !== 'admin') {
        return <Navigate to="/login" replace state={{ error: 'Access denied. Please sign in with an admin account (admin@novacart.com).', from: location }} />;
    }

    return children;
};

export default AdminRoute;
