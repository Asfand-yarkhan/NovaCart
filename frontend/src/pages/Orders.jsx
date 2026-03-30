import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const statusColor = { processing: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#059669', cancelled: '#ef4444' };
const statusIcon = { processing: 'fa-clock', confirmed: 'fa-check-circle', shipped: 'fa-truck', delivered: 'fa-box-open', cancelled: 'fa-times-circle' };

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/orders/mine').then(setOrders).catch(err => setError(err.message)).finally(() => setLoading(false));
    }, []);

    if (loading) return <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div>Loading orders...</div></main>;

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet><title>My Orders | NovaCart</title></Helmet>
            <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '30px' }}>
                    <i className="fa-solid fa-bag-shopping" style={{ marginRight: '12px', color: '#059669' }}></i>My Orders
                </h1>
                {error && <div style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</div>}
                {orders.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <i className="fa-solid fa-bag-shopping" style={{ fontSize: '4rem', color: '#d1d5db', marginBottom: '20px' }}></i>
                        <h3 style={{ color: '#374151', marginBottom: '10px' }}>No orders yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '25px' }}>Start shopping to see your orders here.</p>
                        <Link to="/shop" style={{ display: 'inline-block', padding: '12px 30px', background: '#059669', color: '#fff', borderRadius: '50px', textDecoration: 'none', fontWeight: '700' }}>Shop Now</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(order => {
                            const color = statusColor[order.status] || '#64748b';
                            const icon = statusIcon[order.status] || 'fa-circle';
                            return (
                                <Link key={order._id} to={`/orders/${order._id}`} style={{ textDecoration: 'none' }}>
                                    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px 25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s', cursor: 'pointer', border: '1px solid transparent' }}>
                                        <div>
                                            <p style={{ fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>Order #{order._id.slice(-8).toUpperCase()}</p>
                                            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{order.items.length} item(s) · {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <span style={{ fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>Rs. {order.total?.toFixed(2)}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', background: `${color}15`, color, fontWeight: '600', fontSize: '0.85rem' }}>
                                                <i className={`fa-solid ${icon}`}></i>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                            <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8' }}></i>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Orders;
