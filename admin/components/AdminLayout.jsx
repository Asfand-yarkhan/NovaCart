import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../frontend/src/context/AuthContext';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/admin', label: 'Dashboard', icon: 'fa-chart-line', end: true },
        { to: '/admin/products', label: 'Products', icon: 'fa-box-open' },
        { to: '/admin/orders', label: 'Orders', icon: 'fa-cart-arrow-down' },
        { to: '/admin/users', label: 'Users', icon: 'fa-users' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Helmet>
                <title>Store Admin | NovaCart</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '20px', fontSize: '1.3rem', fontWeight: '800', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-gauge-high" style={{ color: '#38bdf8' }}></i> NovaAdmin
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', flex: 1 }}>
                    {navItems.map(item => (
                        <NavLink key={item.to} to={item.to} end={item.end} style={({ isActive }) => ({
                            padding: '13px 20px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#0f172a' : 'transparent',
                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', fontWeight: isActive ? '700' : '400', borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent', transition: 'all 0.2s'
                        })}>
                            <i className={`fa-solid ${item.icon}`} style={{ width: '16px' }}></i> {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
                    {user && (
                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: '700' }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ color: '#f1f5f9', fontSize: '0.85rem', fontWeight: '600' }}>{user.name}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Administrator</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <NavLink to="/" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', padding: '6px 0' }}>
                            <i className="fa-solid fa-store"></i> Back to Store
                        </NavLink>
                        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', padding: '6px 0', textAlign: 'left' }}>
                            <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <header style={{ height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Welcome back, <strong style={{ color: '#1e293b' }}>{user?.name}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <i className="fa-regular fa-bell" style={{ fontSize: '1.1rem', color: '#64748b', cursor: 'pointer' }}></i>
                    </div>
                </header>
                <main style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
