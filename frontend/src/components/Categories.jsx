import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Categories.css';

const Categories = () => {
    const navigate = useNavigate();
    const categories = [
        { id: 1, name: 'Fresh Fruits', icon: 'fa-apple-whole', color: '#ffedd5', iconColor: '#ea580c' },
        { id: 2, name: 'Vegetables', icon: 'fa-carrot', color: '#ecfccb', iconColor: '#65a30d' },
        { id: 3, name: 'Dairy & Milk', icon: 'fa-cheese', color: '#fffedd', iconColor: '#eab308' },
        { id: 4, name: 'Meat & Fish', icon: 'fa-drumstick-bite', color: '#fee2e2', iconColor: '#dc2626' },
        { id: 5, name: 'Bakery', icon: 'fa-bread-slice', color: '#ffedd5', iconColor: '#d97706' },
        { id: 6, name: 'Beverages', icon: 'fa-wine-bottle', color: '#e0f2fe', iconColor: '#0284c7' }
    ];

    return (
        <section className="categories section-padding">
            <div className="container">
                <div className="section-header">
                    <h2>Explore Categories</h2>
                    <button className="view-all-btn" onClick={() => navigate('/categories')}>
                        View All <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>

                <div className="categories-grid">
                    {categories.map((cat, index) => (
                        <div
                            className={`category-card animate-fade delay-${(index % 3) * 100}`}
                            key={cat.id}
                        >
                            <div
                                className="category-icon-wrapper"
                                style={{ backgroundColor: cat.color, color: cat.iconColor }}
                            >
                                <i className={`fa-solid ${cat.icon}`}></i>
                            </div>
                            <h3>{cat.name}</h3>
                            <p>Items</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Categories;
