import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Helmet>
                <title>Store Admin | NovaCart</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #334155' }}>
                    <i className="fa-solid fa-gauge-high" style={{ marginRight: '10px' }}></i> NovaAdmin
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', padding: '20px 0' }}>
                    <NavLink to="/admin" end style={({ isActive }) => ({
                        padding: '15px 20px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#0f172a' : 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px'
                    })}>
                        <i className="fa-solid fa-chart-line"></i> Dashboard
                    </NavLink>
                    <NavLink to="/admin/products" style={({ isActive }) => ({
                        padding: '15px 20px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#0f172a' : 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px'
                    })}>
                        <i className="fa-solid fa-box-open"></i> Products
                    </NavLink>
                    <NavLink to="/admin/orders" style={({ isActive }) => ({
                        padding: '15px 20px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#0f172a' : 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px'
                    })}>
                        <i className="fa-solid fa-cart-arrow-down"></i> Orders
                    </NavLink>
                    <NavLink to="/admin/customers" style={({ isActive }) => ({
                        padding: '15px 20px', color: isActive ? '#38bdf8' : '#cbd5e1', backgroundColor: isActive ? '#0f172a' : 'transparent', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px'
                    })}>
                        <i className="fa-solid fa-users"></i> Customers
                    </NavLink>
                </nav>
                <div style={{ marginTop: 'auto', padding: '20px' }}>
                    <NavLink to="/" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Back to Store
                    </NavLink>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Topbar */}
                <header style={{ height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
                    <div>
                        <i className="fa-solid fa-bars" style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}></i>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ position: 'relative' }}>
                            <i className="fa-regular fa-bell" style={{ fontSize: '1.2rem', color: '#64748b' }}></i>
                            <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#ef4444', color: '#fff', fontSize: '0.6rem', padding: '2px 5px', borderRadius: '10px' }}>3</span>
                        </div>
                        <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#cbd5e1', backgroundImage: 'url("https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff")', backgroundSize: 'cover' }}></div>
                    </div>
                </header>

                {/* Page Content */}
                <main style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
