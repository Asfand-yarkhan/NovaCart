import React from 'react';

const Wishlist = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <div className="container">
                <div className="section-header">
                    <h2>Your Wishlist</h2>
                </div>
                <div className="text-center" style={{ padding: '40px' }}>
                    <i className="fa-regular fa-heart" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }}></i>
                    <h3>No favorites yet</h3>
                    <p>Tap the heart icon on products to save them for later.</p>
                </div>
            </div>
        </main>
    );
};

export default Wishlist;
