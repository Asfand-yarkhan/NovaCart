import React from 'react';
import { Helmet } from 'react-helmet-async';

const Wishlist = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <Helmet>
                <title>Your Wishlist | NovaCart</title>
                <meta name="description" content="Manage your saved items and favorite groceries. Add products to your wishlist to easily shop for them later on NovaCart." />
                <meta name="keywords" content="wishlist, favorite groceries, saved items, buy later" />
            </Helmet>
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
