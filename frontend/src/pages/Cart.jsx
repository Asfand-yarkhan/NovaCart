import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const API_BASE = 'http://localhost:5000';

const Cart = () => {
    const { cartItems, cartTotal, cartLoading, removeFromCart, updateQty } = useCart();
    const navigate = useNavigate();
    const DELIVERY_FEE = 150;

    if (cartLoading) return <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div>Loading cart...</div></main>;

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet>
                <title>Shopping Cart | NovaCart</title>
                <meta name="description" content="View your NovaCart shopping cart and checkout." />
            </Helmet>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '30px' }}>
                    <i className="fa-solid fa-cart-shopping" style={{ marginRight: '12px', color: '#059669' }}></i>Shopping Cart
                </h1>

                {cartItems.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <i className="fa-solid fa-cart-shopping" style={{ fontSize: '4rem', color: '#d1d5db', marginBottom: '20px' }}></i>
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
                                            {imgSrc ? <img src={imgSrc} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-basket-shopping" style={{ fontSize: '2rem', color: '#6ee7b7' }}></i>}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ color: '#1e293b', marginBottom: '4px' }}>{p.name}</h4>
                                            <span style={{ fontsize: '0.85rem', color: '#64748b', background: '#f0fdf4', padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem' }}>{p.category}</span>
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
                                            <i className="fa-solid fa-trash-can"></i>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#64748b' }}>
                                <span>Delivery Fee</span>
                                <span style={{ fontWeight: '600', color: '#374151' }}>Rs. {DELIVERY_FEE}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '2px solid #f1f5f9', marginBottom: '20px' }}>
                                <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>Total</span>
                                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: '#059669' }}>Rs. {(cartTotal + DELIVERY_FEE).toFixed(2)}</span>
                            </div>
                            <button onClick={() => navigate('/checkout')} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i>
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
