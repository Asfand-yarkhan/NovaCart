import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
                    <button className="btn-icon" aria-label="Cart" onClick={() => navigate('/cart')}>
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span className="cart-badge">3</span>
                    </button>
                    <button className="btn btn-primary login-btn" onClick={() => navigate('/login')}>
                        Log In
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
