import React, { useEffect, useState } from 'react';
import { api } from '../../frontend/src/utils/api';

const statusOptions = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusColor = { processing: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#059669', cancelled: '#ef4444' };

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/orders').then(setOrders).catch(err => setError(err.message)).finally(() => setLoading(false));
    }, []);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const updated = await api(`/orders/${orderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: updated.status } : o));
        } catch (err) { alert(err.message); }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading orders...</div>;
    if (error) return <div style={{ padding: '20px', color: '#ef4444' }}>Error: {error}</div>;

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '24px' }}>Orders Management</h1>
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {orders.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No orders yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                {['Order ID', 'Customer', 'Items', 'Total', 'Date', 'Status', 'Update'].map(h => (
                                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => {
                                const color = statusColor[order.status] || '#64748b';
                                return (
                                    <tr key={order._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#1e293b', fontSize: '0.85rem' }}>#{order._id.slice(-8).toUpperCase()}</td>
                                        <td style={{ padding: '14px 16px', color: '#374151', fontSize: '0.9rem' }}>
                                            <div style={{ fontWeight: '600' }}>{order.user?.name || 'N/A'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{order.user?.email}</div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#64748b' }}>{order.items?.length} item(s)</td>
                                        <td style={{ padding: '14px 16px', fontWeight: '700', color: '#059669' }}>Rs. {order.total?.toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '20px', background: `${color}18`, color, fontWeight: '600', fontSize: '0.8rem' }}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <select value={order.status} onChange={e => handleStatusChange(order._id, e.target.value)}
                                                style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', background: '#fff', cursor: 'pointer', outline: 'none', color: '#374151' }}>
                                                {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                            </select>
                                        </td>
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

export default AdminOrders;
