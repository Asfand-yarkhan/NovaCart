import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

const STEPS = ['processing', 'confirmed', 'shipped', 'delivered'];
const statusColor = { processing: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#059669', cancelled: '#ef4444' };

const API_BASE = 'http://localhost:5000';

const OrderDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const isSuccess = location.state?.success;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api(`/orders/${id}`).then(setOrder).catch(err => setError(err.message)).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div>Loading...</div></main>;
    if (error || !order) return <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>{error || 'Order not found'}</main>;

    const currentStep = STEPS.indexOf(order.status);
    const color = statusColor[order.status] || '#64748b';

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet><title>Order #{id.slice(-8).toUpperCase()} | NovaCart</title></Helmet>
            <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px' }}>
                {isSuccess && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '12px', padding: '18px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <i className="fa-solid fa-circle-check" style={{ color: '#059669', fontSize: '1.5rem' }}></i>
                        <div>
                            <p style={{ fontWeight: '700', color: '#065f46', margin: '0 0 2px' }}>Order placed successfully! 🎉</p>
                            <p style={{ color: '#059669', margin: 0, fontSize: '0.9rem' }}>Your order is being processed. You'll receive updates on it here.</p>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#1e293b' }}>Order #{id.slice(-8).toUpperCase()}</h1>
                    <span style={{ padding: '6px 16px', borderRadius: '20px', background: `${color}15`, color, fontWeight: '700', fontSize: '0.9rem' }}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                </div>

                {/* Tracking Steps */}
                {order.status !== 'cancelled' && (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '25px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>Order Tracking</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                            {STEPS.map((step, i) => {
                                const done = i <= currentStep;
                                const stepColor = done ? '#059669' : '#cbd5e1';
                                return (
                                    <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: done ? '#059669' : '#fff', border: `2px solid ${stepColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: done ? '#fff' : '#cbd5e1', marginBottom: '8px', fontSize: '1rem' }}>
                                            <i className={`fa-solid ${done ? 'fa-check' : 'fa-circle'}`}></i>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: done ? '#059669' : '#94a3b8', fontWeight: done ? '700' : '400', textAlign: 'center', margin: 0 }}>{step.charAt(0).toUpperCase() + step.slice(1)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Shipping */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ color: '#1e293b', marginBottom: '12px' }}><i className="fa-solid fa-location-dot" style={{ color: '#059669', marginRight: '8px' }}></i>Shipping To</h4>
                        <p style={{ color: '#374151', fontWeight: '600', margin: '0 0 4px' }}>{order.shippingAddress?.fullName}</p>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0' }}>{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.zip}</p>
                    </div>
                    {/* Summary */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h4 style={{ color: '#1e293b', marginBottom: '12px' }}><i className="fa-solid fa-receipt" style={{ color: '#059669', marginRight: '8px' }}></i>Order Details</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 4px' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 4px' }}>Items: {order.items.length}</p>
                        <p style={{ color: '#059669', fontWeight: '700', margin: 0 }}>Total: Rs. {order.total?.toFixed(2)}</p>
                    </div>
                </div>

                {/* Items */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <h4 style={{ color: '#1e293b', marginBottom: '16px' }}>Items Ordered</h4>
                    {order.items.map((item, i) => {
                        const imgSrc = item.image ? `${API_BASE}${item.image}` : null;
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <div style={{ width: '55px', height: '55px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                    {imgSrc ? <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-basket-shopping" style={{ color: '#6ee7b7' }}></i>}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '600', color: '#1e293b', margin: '0 0 2px' }}>{item.name}</p>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Qty: {item.quantity} × Rs. {item.price}</p>
                                </div>
                                <p style={{ fontWeight: '700', color: '#059669' }}>Rs. {(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                        );
                    })}
                </div>

                <Link to="/orders" style={{ color: '#059669', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem' }}>← Back to All Orders</Link>
            </div>
        </main>
    );
};

export default OrderDetail;
