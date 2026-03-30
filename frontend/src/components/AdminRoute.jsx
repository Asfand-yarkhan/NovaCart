import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    if (!user) return <Navigate to="/admin/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/" replace />;
    return children;
};

export default AdminRoute;
