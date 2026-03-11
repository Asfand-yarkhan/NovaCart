import React from 'react';

const About = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <div className="container">
                <div className="section-header">
                    <h2>About NovaCart</h2>
                </div>
                <div style={{ padding: '0 20px', lineHeight: '1.8', fontSize: '1.1rem' }}>
                    <p>NovaCart brings the freshest fruits, vegetables, and everyday essentials straight to your home with lightning-fast delivery. Quality guaranteed.</p>
                    <p style={{ marginTop: '15px' }}>Our mission is to make grocery shopping seamless, fast, and enjoyable for everyone. We partner with local farmers and trusted suppliers to bring you 100% organic and fresh products every day.</p>
                    <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                        <h3 style={{ marginBottom: '15px' }}>How it Works</h3>
                        <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <li>Browse our wide selection of products</li>
                            <li>Add items to your virtual cart</li>
                            <li>Checkout securely</li>
                            <li>Receive your groceries at your doorstep!</li>
                        </ol>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default About;
