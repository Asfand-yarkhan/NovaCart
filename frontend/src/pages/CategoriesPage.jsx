import React from 'react';
import { Helmet } from 'react-helmet-async';

const CategoriesPage = () => {
    const categories = [
        { id: 1, name: 'Fresh Fruits', icon: 'fa-apple-whole', color: '#ffedd5', iconColor: '#ea580c' },
        { id: 2, name: 'Vegetables', icon: 'fa-carrot', color: '#ecfccb', iconColor: '#65a30d' },
        { id: 3, name: 'Dairy & Milk', icon: 'fa-cheese', color: '#fffedd', iconColor: '#eab308' },
        { id: 4, name: 'Meat & Fish', icon: 'fa-drumstick-bite', color: '#fee2e2', iconColor: '#dc2626' },
        { id: 5, name: 'Bakery', icon: 'fa-bread-slice', color: '#ffedd5', iconColor: '#d97706' },
        { id: 6, name: 'Beverages', icon: 'fa-wine-bottle', color: '#e0f2fe', iconColor: '#0284c7' },
        { id: 7, name: 'Snacks', icon: 'fa-cookie', color: '#fef3c7', iconColor: '#d97706' },
        { id: 8, name: 'Household', icon: 'fa-soap', color: '#dcfce7', iconColor: '#15803d' },
    ];

    return (
        <main className="categories section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <Helmet>
                <title>Browse Categories | NovaCart</title>
                <meta name="description" content="Explore a wide variety of grocery categories at NovaCart including fresh fruits, vegetables, dairy, bakery items, household goods, and more." />
                <meta name="keywords" content="grocery categories, fresh fruits, vegetables, dairy products, bakery, household goods" />
            </Helmet>
            <div className="container">
                <div className="section-header">
                    <h2>All Categories</h2>
                </div>
                <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px' }}>
                    {categories.map((cat, index) => (
                        <div className="category-card" key={cat.id} style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <div className="category-icon-wrapper" style={{ backgroundColor: cat.color, color: cat.iconColor, width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: '1.5rem' }}>
                                <i className={`fa-solid ${cat.icon}`}></i>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{cat.name}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
};

export default CategoriesPage;
