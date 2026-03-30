import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { cartCount } = useCart();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    return (
        <nav className={`navbar ${scrolled ? 'scrolled glass' : ''}`}>
            <div className="container nav-container">
                <Link to="/" className="nav-logo">
                    <i className="fa-solid fa-leaf text-gradient"></i>
                    <span>NovaCart</span>
                </Link>

                <div className="nav-search">
                    <input type="text" placeholder="Search for fresh groceries..." />
                    <button className="search-btn" onClick={() => navigate('/shop')}><i className="fa-solid fa-magnifying-glass"></i></button>
                </div>

                <div className="nav-actions">
                    <button className="btn-icon" aria-label="Favorites" onClick={() => navigate('/wishlist')}>
                        <i className="fa-regular fa-heart"></i>
                    </button>
                    <button className="btn-icon" aria-label="Cart" onClick={() => navigate('/cart')} style={{ position: 'relative' }}>
                        <i className="fa-solid fa-cart-shopping"></i>
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>

                    {user ? (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setMenuOpen(o => !o)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '25px', padding: '6px 14px', cursor: 'pointer', color: '#1e293b', fontWeight: '600', fontSize: '0.9rem' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: '700' }}>
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                {user.name?.split(' ')[0]}
                                <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem', color: '#64748b' }}></i>
                            </button>
                            {menuOpen && (
                                <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', minWidth: '180px', zIndex: 9999, overflow: 'hidden' }}>
                                    <Link to="/orders" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#374151', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <i className="fa-solid fa-bag-shopping" style={{ color: '#059669', width: '16px' }}></i> My Orders
                                    </Link>
                                    <Link to="/wishlist" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#374151', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <i className="fa-regular fa-heart" style={{ color: '#ef4444', width: '16px' }}></i> Wishlist
                                    </Link>
                                    {user.role === 'admin' && (
                                        <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#374151', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>
                                            <i className="fa-solid fa-gauge-high" style={{ color: '#3b82f6', width: '16px' }}></i> Admin Panel
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', width: '100%', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' }}>
                                        <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: '16px' }}></i> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="btn btn-primary login-btn" onClick={() => navigate('/login')}>
                            Log In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
