import React, { useEffect, useState } from 'react';
import { api } from '../../frontend/src/utils/api';

const Dashboard = () => {
    const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, customers: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api('/products').catch(() => []),
            api('/orders').catch(() => []),
            api('/users').catch(() => [])
        ]).then(([products, orders, users]) => {
            const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
            setStats({ products: products.length, orders: orders.length, revenue, customers: users.length });
            setRecentOrders(orders.slice(0, 5));
        }).finally(() => setLoading(false));
    }, []);

    const kpiCards = [
        { label: 'Total Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: 'fa-dollar-sign', color: '#10b981' },
        { label: 'Total Orders', value: stats.orders, icon: 'fa-shopping-cart', color: '#3b82f6' },
        { label: 'Customers', value: stats.customers, icon: 'fa-users', color: '#8b5cf6' },
        { label: 'Products', value: stats.products, icon: 'fa-box', color: '#f59e0b' }
    ];

    const statusColor = { processing: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#059669', cancelled: '#ef4444' };

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '24px', color: '#1e293b' }}>Dashboard Overview</h1>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {kpiCards.map((card, i) => (
                    <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '5px', fontWeight: '500' }}>{card.label}</p>
                            <h3 style={{ fontSize: '1.6rem', color: '#1e293b', fontWeight: '800' }}>{loading ? '—' : card.value}</h3>
                        </div>
                        <div style={{ width: '52px', height: '52px', borderRadius: '12px', backgroundColor: `${card.color}20`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                            <i className={`fa-solid ${card.icon}`}></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '1.1rem' }}>Recent Orders</h3>
                {loading ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Loading...</div>
                    : recentOrders.length === 0 ? <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No orders yet</div>
                        : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead><tr>
                                    {['Order', 'Customer', 'Total', 'Status', 'Date'].map(h => (
                                        <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.8rem', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                                    ))}
                                </tr></thead>
                                <tbody>
                                    {recentOrders.map(order => {
                                        const color = statusColor[order.status] || '#64748b';
                                        return (
                                            <tr key={order._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '10px', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>#{order._id.slice(-6).toUpperCase()}</td>
                                                <td style={{ padding: '10px', color: '#374151', fontSize: '0.9rem' }}>{order.user?.name || 'Guest'}</td>
                                                <td style={{ padding: '10px', fontWeight: '700', color: '#059669' }}>Rs. {order.total?.toFixed(0)}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={{ padding: '3px 10px', borderRadius: '20px', background: `${color}15`, color, fontWeight: '600', fontSize: '0.78rem' }}>
                                                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px', color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
            </div>
        </div>
    );
};

export default Dashboard;
