import React from 'react';

const Shop = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <div className="container">
                <div className="section-header">
                    <h2>Shop All Products</h2>
                </div>
                <div className="text-center" style={{ padding: '40px' }}>
                    <i className="fa-solid fa-basket-shopping" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }}></i>
                    <h3>Our store is being stocked!</h3>
                    <p>Check back soon for more fresh groceries and complete listings.</p>
                </div>
            </div>
        </main>
    );
};

export default Shop;
