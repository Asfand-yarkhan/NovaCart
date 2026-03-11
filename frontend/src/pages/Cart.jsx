import React from 'react';
import { Helmet } from 'react-helmet-async';

const Cart = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <Helmet>
                <title>Shopping Cart | NovaCart</title>
                <meta name="description" content="View the items in your NovaCart shopping cart. Enjoy secure checkout and fast delivery on all your favorite groceries." />
                <meta name="keywords" content="shopping cart, checkout, your groceries, secure payment" />
            </Helmet>
            <div className="container">
                <div className="section-header">
                    <h2>Shopping Cart</h2>
                </div>
                <div className="text-center" style={{ padding: '40px' }}>
                    <i className="fa-solid fa-cart-shopping" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }}></i>
                    <h3>Your cart is empty</h3>
                    <p>Looks like you haven't added anything to your cart yet.</p>
                </div>
            </div>
        </main>
    );
};

export default Cart;
