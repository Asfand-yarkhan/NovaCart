import React from 'react';
import { Helmet } from 'react-helmet-async';

const Contact = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <Helmet>
                <title>Contact Us | NovaCart</title>
                <meta name="description" content="Get in touch with the NovaCart support team. We're here to help with your orders, grocery deliveries, and any questions you might have." />
                <meta name="keywords" content="contact NovaCart, customer support, help center, grocery delivery help" />
            </Helmet>
            <div className="container">
                <div className="section-header">
                    <h2>Contact Us</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                    <div>
                        <h3>Get in Touch</h3>
                        <p style={{ marginTop: '15px', color: '#64748b' }}>We'd love to hear from you. Please fill out this form or shoot us an email.</p>
                        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <i className="fa-solid fa-envelope" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}></i>
                                <span>support@novacart.com</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <i className="fa-solid fa-phone" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}></i>
                                <span>+1 (800) 123-4567</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}></i>
                                <span>123 Grocery Lane, Fresh City, NY 10001</span>
                            </div>
                        </div>
                    </div>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <input type="text" placeholder="Your Name" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                        <input type="email" placeholder="Email Address" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                        <textarea placeholder="Your Message" rows="5" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }} required></textarea>
                        <button className="btn btn-primary" type="submit">Send Message</button>
                    </form>
                </div>
            </div>
        </main>
    );
};

export default Contact;
