import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer relative pt-20 pb-10">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col brand-col">
                        <Link to="/" className="footer-logo">
                            <i className="fa-solid fa-leaf text-gradient"></i>
                            <span>NovaCart</span>
                        </Link>
                        <p className="footer-desc">
                            Your one-stop destination for fresh groceries, daily essentials, and healthy organic products. Fast delivery, guaranteed freshness.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-icon"><i className="fa-brands fa-facebook-f"></i></a>
                            <a href="#" className="social-icon"><i className="fa-brands fa-twitter"></i></a>
                            <a href="#" className="social-icon"><i className="fa-brands fa-instagram"></i></a>
                            <a href="#" className="social-icon"><i className="fa-brands fa-youtube"></i></a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4 className="footer-title">Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/shop">Shop</Link></li>
                            <li><Link to="/categories">Categories</Link></li>
                            <li><Link to="/">Blog</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h4 className="footer-title">Customer Services</h4>
                        <ul className="footer-links">
                            <li><Link to="/login">My Account</Link></li>
                            <li><Link to="/">Order Tracking</Link></li>
                            <li><Link to="/wishlist">Wishlist</Link></li>
                            <li><Link to="/">Privacy Policy</Link></li>
                            <li><Link to="/">Terms & Conditions</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col newsletter-col">
                        <h4 className="footer-title">Subscribe</h4>
                        <p className="footer-desc">Get the latest updates on new products and upcoming sales.</p>
                        <form className="newsletter-form">
                            <input type="email" placeholder="Your email address" required />
                            <button type="submit" className="btn btn-primary"><i className="fa-regular fa-paper-plane"></i></button>
                        </form>
                        <div className="payment-methods mt-4">
                            {/* Decorative payment icons */}
                            <i className="fa-brands fa-cc-visa"></i>
                            <i className="fa-brands fa-cc-mastercard"></i>
                            <i className="fa-brands fa-cc-paypal"></i>
                            <i className="fa-brands fa-cc-stripe"></i>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} NovaCart. All rights reserved.</p>
                    <div className="footer-bottom-links">
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
