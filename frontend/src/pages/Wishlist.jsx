import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000';

const Wishlist = () => {
    const { wishlistItems, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();
    const { user } = useAuth();

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet>
                <title>Your Wishlist | NovaCart</title>
                <meta name="description" content="Manage your saved NovaCart items." />
            </Helmet>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '30px' }}>
                    <i className="fa-solid fa-heart" style={{ marginRight: '12px', color: '#ef4444' }}></i>Your Wishlist
                </h1>
                {!user ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <i className="fa-regular fa-heart" style={{ fontSize: '4rem', color: '#fca5a5', marginBottom: '20px' }}></i>
                        <h3 style={{ color: '#374151', marginBottom: '10px' }}>Sign in to see your wishlist</h3>
                        <Link to="/login" style={{ display: 'inline-block', padding: '12px 30px', background: '#059669', color: '#fff', borderRadius: '50px', textDecoration: 'none', fontWeight: '700' }}>Sign In</Link>
                    </div>
                ) : wishlistItems.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '60px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <i className="fa-regular fa-heart" style={{ fontSize: '4rem', color: '#d1d5db', marginBottom: '20px' }}></i>
                        <h3 style={{ color: '#374151', marginBottom: '10px' }}>No favorites yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '25px' }}>Tap the heart on any product to save it here.</p>
                        <Link to="/shop" style={{ display: 'inline-block', padding: '12px 30px', background: '#059669', color: '#fff', borderRadius: '50px', textDecoration: 'none', fontWeight: '700' }}>Browse Products</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
                        {wishlistItems.map(product => {
                            const imgSrc = product.image ? `${API_BASE}${product.image}` : null;
                            return (
                                <div key={product._id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                                    <div style={{ height: '180px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                        {imgSrc ? <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-basket-shopping" style={{ fontSize: '4rem', color: '#6ee7b7' }}></i>}
                                        <button onClick={() => toggleWishlist(product)} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                            <i className="fa-solid fa-heart"></i>
                                        </button>
                                    </div>
                                    <div style={{ padding: '18px' }}>
                                        <span style={{ fontSize: '0.75rem', background: '#f0fdf4', color: '#059669', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{product.category}</span>
                                        <h4 style={{ margin: '10px 0 5px', color: '#1e293b' }}>{product.name}</h4>
                                        <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#059669', marginBottom: '15px' }}>Rs. {product.price?.toFixed(2)}</p>
                                        <button onClick={() => addToCart(product)} style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                            <i className="fa-solid fa-cart-shopping" style={{ marginRight: '8px' }}></i>Add to Cart
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Wishlist;
