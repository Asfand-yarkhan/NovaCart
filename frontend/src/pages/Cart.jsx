import React from 'react';

const Cart = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
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
