import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Categories.css';

const API_BASE = 'http://localhost:5000';

const Categories = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({});

    const categories = [
        { id: 1, name: 'Fresh Fruits',  dbCategory: 'Fruits',     icon: 'fa-apple-whole',    color: '#ffedd5', iconColor: '#ea580c' },
        { id: 2, name: 'Vegetables',    dbCategory: 'Vegetables',  icon: 'fa-carrot',         color: '#ecfccb', iconColor: '#65a30d' },
        { id: 3, name: 'Dairy & Milk',  dbCategory: 'Dairy',       icon: 'fa-cheese',         color: '#fffedd', iconColor: '#eab308' },
        { id: 4, name: 'Meat & Fish',   dbCategory: 'Meat',        icon: 'fa-drumstick-bite', color: '#fee2e2', iconColor: '#dc2626' },
        { id: 5, name: 'Bakery',        dbCategory: 'Bakery',      icon: 'fa-bread-slice',    color: '#ffedd5', iconColor: '#d97706' },
        { id: 6, name: 'Beverages',     dbCategory: 'Beverages',   icon: 'fa-wine-bottle',    color: '#e0f2fe', iconColor: '#0284c7' },
    ];

    // Fetch all products once to compute per-category counts
    useEffect(() => {
        fetch(`${API_BASE}/api/products`)
            .then(r => r.json())
            .then(products => {
                const map = {};
                products.forEach(p => {
                    const key = p.category?.toLowerCase();
                    map[key] = (map[key] || 0) + 1;
                });
                setCounts(map);
            })
            .catch(() => {});
    }, []);

    const handleClick = (cat) => {
        navigate(`/shop?category=${encodeURIComponent(cat.dbCategory)}`);
    };

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
                    {categories.map((cat, index) => {
                        const count = counts[cat.dbCategory.toLowerCase()];
                        return (
                            <div
                                className={`category-card animate-fade delay-${(index % 3) * 100}`}
                                key={cat.id}
                                onClick={() => handleClick(cat)}
                                title={`Browse ${cat.name}`}
                            >
                                <div
                                    className="category-icon-wrapper"
                                    style={{ backgroundColor: cat.color, color: cat.iconColor }}
                                >
                                    <i className={`fa-solid ${cat.icon}`}></i>
                                </div>
                                <h3>{cat.name}</h3>
                                <p>{count !== undefined ? `${count} item${count !== 1 ? 's' : ''}` : 'Browse'}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Categories;
