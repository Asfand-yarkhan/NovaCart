import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API_BASE = 'http://localhost:5000';
const CHATBOT_API = 'http://localhost:5000/api';

const Cart = () => {
    const {
        cartItems, cartTotal, cartLoading,
        removeFromCart, updateQty,
        appliedCoupon, applyDiscount, removeDiscount,
        discountAmount, finalTotal
    } = useCart();
    const navigate = useNavigate();

    const DELIVERY_FEE = appliedCoupon?.type === 'shipping' ? 0 : 150;
    const grandTotal   = finalTotal + DELIVERY_FEE;

    const [couponInput, setCouponInput]   = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError]   = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();
        if (!code) return;
        setCouponLoading(true);
        setCouponError('');
        setCouponSuccess('');
        try {
            const res = await fetch(`${CHATBOT_API}/chatbot/apply-coupon`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, cartTotal })
            });
            const data = await res.json();
            if (data.success) {
                applyDiscount(data.coupon);
                setCouponSuccess(`✅ Coupon "${code}" applied! You save ₨${data.savings.toLocaleString()}`);
                setCouponInput('');
            } else {
                setCouponError(data.message || 'Invalid coupon code.');
            }
        } catch {
            setCouponError('Failed to validate coupon. Please try again.');
        } finally {
            setCouponLoading(false);
        }
    };

    if (cartLoading) return (
        <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div>Loading cart...</div>
        </main>
    );

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet>
                <title>Shopping Cart | NovaCart</title>
                <meta name="description" content="View your NovaCart shopping cart and checkout." />
            </Helmet>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '30px' }}>
                    <i className="fa-solid fa-cart-shopping" style={{ marginRight: '12px', color: '#059669' }} />Shopping Cart
                </h1>

                {cartItems.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <i className="fa-solid fa-cart-shopping" style={{ fontSize: '4rem', color: '#d1d5db', marginBottom: '20px' }} />
                        <h3 style={{ color: '#374151', marginBottom: '10px' }}>Your cart is empty</h3>
                        <p style={{ color: '#64748b', marginBottom: '25px' }}>Add some fresh groceries to get started!</p>
                        <Link to="/shop" style={{ display: 'inline-block', padding: '12px 30px', background: '#059669', color: '#fff', borderRadius: '50px', textDecoration: 'none', fontWeight: '700' }}>Shop Now</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px', alignItems: 'start' }}>
                        {/* Cart Items */}
                        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            {cartItems.map((item, idx) => {
                                const p = item.product;
                                const imgSrc = p.image ? `${API_BASE}${p.image}` : null;
                                return (
                                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 25px', borderBottom: idx < cartItems.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                            {imgSrc ? <img src={imgSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-basket-shopping" style={{ fontSize: '2rem', color: '#6ee7b7' }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: '#1e293b', marginBottom: '4px' }}>{p.name}</h4>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', background: '#f0fdf4', padding: '2px 10px', borderRadius: '20px' }}>{p.category}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button onClick={() => updateQty(p._id, item.quantity - 1)} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#374151' }}>−</button>
                                            <span style={{ fontWeight: '700', minWidth: '24px', textAlign: 'center', color: '#1e293b' }}>{item.quantity}</span>
                                            <button onClick={() => updateQty(p._id, item.quantity + 1)} style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#374151' }}>+</button>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <div style={{ fontWeight: '700', color: '#059669', fontSize: '1.1rem' }}>Rs. {(p.price * item.quantity).toFixed(2)}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Rs. {p.price} each</div>
                                        </div>
                                        <button onClick={() => removeFromCart(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '5px' }}>
                                            <i className="fa-solid fa-trash-can" />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div style={{ background: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
                            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9' }}>Order Summary</h3>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b' }}>
                                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                <span style={{ fontWeight: '600', color: '#374151' }}>Rs. {cartTotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#64748b' }}>
                                <span>Delivery Fee</span>
                                <span style={{ fontWeight: '600', color: appliedCoupon?.type === 'shipping' ? '#059669' : '#374151' }}>
                                    {appliedCoupon?.type === 'shipping' ? <s style={{ color: '#94a3b8', marginRight: '4px' }}>Rs. 150</s> : null}
                                    {appliedCoupon?.type === 'shipping' ? <span>FREE</span> : 'Rs. 150'}
                                </span>
                            </div>

                            {/* Discount row */}
                            {appliedCoupon && appliedCoupon.type !== 'shipping' && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#059669' }}>
                                    <span>🎟️ Discount ({appliedCoupon.code})</span>
                                    <span style={{ fontWeight: '600' }}>− Rs. {discountAmount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Applied coupon badge */}
                            {appliedCoupon && (
                                <div style={{ background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontWeight: '700', color: '#059669', fontSize: '0.85rem' }}>🎟️ {appliedCoupon.code}</span>
                                        <div style={{ fontSize: '0.75rem', color: '#374151', marginTop: '2px' }}>{appliedCoupon.description}</div>
                                    </div>
                                    <button onClick={removeDiscount} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }} title="Remove coupon">×</button>
                                </div>
                            )}

                            {/* Coupon input */}
                            {!appliedCoupon && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            id="cart-coupon-input"
                                            type="text"
                                            value={couponInput}
                                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); setCouponSuccess(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                            placeholder="Enter coupon code"
                                            style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '1px' }}
                                        />
                                        <button
                                            id="cart-apply-coupon-btn"
                                            onClick={handleApplyCoupon}
                                            disabled={couponLoading || !couponInput.trim()}
                                            style={{ padding: '10px 16px', background: couponLoading ? '#9ca3af' : '#059669', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', cursor: couponLoading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
                                        >
                                            {couponLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponError   && <div style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '6px' }}>{couponError}</div>}
                                    {couponSuccess && <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '6px' }}>{couponSuccess}</div>}
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Try: WELCOME10 · SAVE20 · FREESHIP</div>
                                </div>
                            )}

                            {/* Total */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '2px solid #f1f5f9', marginBottom: '20px' }}>
                                <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>Total</span>
                                <div style={{ textAlign: 'right' }}>
                                    {appliedCoupon && appliedCoupon.type !== 'shipping' && (
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', textDecoration: 'line-through' }}>Rs. {(cartTotal + 150).toFixed(2)}</div>
                                    )}
                                    <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#059669' }}>Rs. {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {appliedCoupon && (
                                <div style={{ background: '#ecfdf5', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', textAlign: 'center', fontSize: '0.82rem', color: '#059669', fontWeight: '600' }}>
                                    🎉 You're saving Rs. {discountAmount.toFixed(2)} with this coupon!
                                </div>
                            )}

                            <button id="cart-checkout-btn" onClick={() => navigate('/checkout')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <i className="fa-solid fa-lock" style={{ marginRight: '8px' }} />
                                Proceed to Checkout
                            </button>
                            <Link to="/shop" style={{ display: 'block', textAlign: 'center', marginTop: '12px', color: '#059669', textDecoration: 'none', fontSize: '0.9rem' }}>← Continue Shopping</Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Cart;
