import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../utils/api';

const Checkout = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const DELIVERY_FEE = 150;
    const total = cartTotal + DELIVERY_FEE;

    const [form, setForm] = useState({ fullName: '', street: '', city: '', state: '', zip: '', country: 'Pakistan' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleOrder = async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) { setError('Your cart is empty'); return; }
        setLoading(true); setError('');
        try {
            const items = cartItems.map(i => ({
                product: i.product._id,
                name: i.product.name,
                price: i.product.price,
                quantity: i.quantity,
                image: i.product.image || ''
            }));
            const order = await api('/orders', {
                method: 'POST',
                body: JSON.stringify({
                    items,
                    shippingAddress: form,
                    subtotal: cartTotal,
                    deliveryFee: DELIVERY_FEE,
                    total
                })
            });
            await clearCart();
            navigate(`/orders/${order._id}`, { state: { success: true } });
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const inputStyle = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' };

    return (
        <main style={{ minHeight: '100vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet><title>Checkout | NovaCart</title></Helmet>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '30px' }}>
                    <i className="fa-solid fa-lock" style={{ marginRight: '12px', color: '#059669' }}></i>Secure Checkout
                </h1>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '30px', alignItems: 'start' }}>
                    {/* Shipping Form */}
                    <form onSubmit={handleOrder} style={{ background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ color: '#1e293b', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>Shipping Address</h3>
                        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Full Name</label>
                                <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required style={inputStyle} placeholder="Muhammad Ali" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Street Address</label>
                                <input type="text" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required style={inputStyle} placeholder="House 12, Street 5, Gulberg" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>City</label>
                                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required style={inputStyle} placeholder="Lahore" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Province</label>
                                <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={inputStyle} placeholder="Punjab" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Postal Code</label>
                                <input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} required style={inputStyle} placeholder="54000" />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Country</label>
                                <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} required style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                            <h4 style={{ color: '#059669', marginBottom: '8px' }}><i className="fa-solid fa-cash-register" style={{ marginRight: '8px' }}></i>Payment Method</h4>
                            <p style={{ color: '#374151', fontSize: '0.9rem', margin: 0 }}>💵 <strong>Cash on Delivery</strong> — Pay when your order arrives.</p>
                        </div>

                        <button type="submit" disabled={loading || cartItems.length === 0} style={{ width: '100%', padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                            {loading ? 'Placing Order...' : `Place Order — Rs. ${total.toFixed(2)}`}
                        </button>
                    </form>

                    {/* Order Summary */}
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
                        <h3 style={{ color: '#1e293b', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>Order Summary ({cartItems.length} items)</h3>
                        {cartItems.map(item => (
                            <div key={item.product._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.9rem' }}>
                                <span style={{ color: '#374151', flex: 1 }}>{item.product.name} <span style={{ color: '#94a3b8' }}>×{item.quantity}</span></span>
                                <span style={{ fontWeight: '600', color: '#1e293b' }}>Rs. {(item.product.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '16px', paddingTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '8px' }}>
                                <span>Subtotal</span><span>Rs. {cartTotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '16px' }}>
                                <span>Delivery</span><span>Rs. {DELIVERY_FEE}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>
                                <span>Total</span><span style={{ color: '#059669' }}>Rs. {total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Checkout;
