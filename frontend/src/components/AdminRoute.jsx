import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', color: '#64748b' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '10px' }}></i> Loading admin panel...
            </div>
        );
    }

    if (!user) return <Navigate to="/admin/login" replace />;

    if (user.role !== 'admin') {
        return <Navigate to="/admin/login" replace state={{ error: 'Please sign in with an admin account (admin@novacart.com).' }} />;
    }

    return children;
};

export default AdminRoute;
