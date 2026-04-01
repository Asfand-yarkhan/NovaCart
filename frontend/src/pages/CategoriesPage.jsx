import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

const categories = [
    { id: 1, name: 'Fresh Fruits',  dbCategory: 'Fruits',      icon: 'fa-apple-whole',    color: '#ffedd5', iconColor: '#ea580c', gradient: 'linear-gradient(135deg,#ffedd5,#fed7aa)', desc: 'Apples, Bananas, Mangoes & more' },
    { id: 2, name: 'Vegetables',    dbCategory: 'Vegetables',  icon: 'fa-carrot',         color: '#ecfccb', iconColor: '#65a30d', gradient: 'linear-gradient(135deg,#ecfccb,#d9f99d)', desc: 'Tomatoes, Potatoes, Onions & more' },
    { id: 3, name: 'Dairy & Milk',  dbCategory: 'Dairy',       icon: 'fa-cheese',         color: '#fffedd', iconColor: '#eab308', gradient: 'linear-gradient(135deg,#fffedd,#fef9c3)', desc: 'Milk, Eggs, Ghee, Yogurt & more' },
    { id: 4, name: 'Meat & Fish',   dbCategory: 'Meat',        icon: 'fa-drumstick-bite', color: '#fee2e2', iconColor: '#dc2626', gradient: 'linear-gradient(135deg,#fee2e2,#fecaca)', desc: 'Chicken, Beef, Fish & more' },
    { id: 5, name: 'Bakery',        dbCategory: 'Bakery',      icon: 'fa-bread-slice',    color: '#ffedd5', iconColor: '#d97706', gradient: 'linear-gradient(135deg,#ffedd5,#fde68a)', desc: 'Bread, Buns, Cakes & more' },
    { id: 6, name: 'Beverages',     dbCategory: 'Beverages',   icon: 'fa-wine-bottle',    color: '#e0f2fe', iconColor: '#0284c7', gradient: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', desc: 'Juices, Soft drinks, Water & more' },
    { id: 7, name: 'Snacks',        dbCategory: 'Snacks',      icon: 'fa-cookie',         color: '#fef3c7', iconColor: '#d97706', gradient: 'linear-gradient(135deg,#fef3c7,#fde68a)', desc: 'Chips, Nuts, Chocolates & more' },
    { id: 8, name: 'Grocery',       dbCategory: 'Grocery',     icon: 'fa-bag-shopping',   color: '#dcfce7', iconColor: '#15803d', gradient: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', desc: 'Rice, Flour, Spices & more' },
];

const CategoriesPage = () => {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/products`)
            .then(r => r.json())
            .then(products => {
                const map = {};
                products.forEach(p => {
                    const key = (p.category || '').toLowerCase();
                    map[key] = (map[key] || 0) + 1;
                });
                setCounts(map);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleClick = (cat) => {
        navigate(`/shop?category=${encodeURIComponent(cat.dbCategory)}`);
    };

    return (
        <main style={{ minHeight: '100vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '80px' }}>
            <Helmet>
                <title>Browse Categories | NovaCart</title>
                <meta name="description" content="Explore a wide variety of grocery categories at NovaCart including fresh fruits, vegetables, dairy, bakery items, household goods, and more." />
                <meta name="keywords" content="grocery categories, fresh fruits, vegetables, dairy products, bakery, household goods" />
            </Helmet>

            {/* Hero Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
                padding: '60px 20px 50px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px', position: 'relative' }}>
                    Browse Categories
                </h1>
                <p style={{ color: '#a7f3d0', fontSize: '1.1rem', margin: 0, position: 'relative' }}>
                    Click any category to explore fresh products instantly
                </p>
            </div>

            {/* Categories Grid */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '50px 20px 0' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '24px'
                }}>
                    {categories.map((cat) => {
                        const count = counts[cat.dbCategory.toLowerCase()];
                        const hasItems = count > 0;

                        return (
                            <div
                                key={cat.id}
                                onClick={() => handleClick(cat)}
                                style={{
                                    background: '#fff',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                                    cursor: 'pointer',
                                    border: '2px solid transparent',
                                    transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    position: 'relative',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.12)`;
                                    e.currentTarget.style.borderColor = cat.iconColor;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                                title={`Shop ${cat.name}`}
                            >
                                {/* Gradient top banner */}
                                <div style={{
                                    background: cat.gradient,
                                    padding: '28px 20px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }}>
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        background: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.8rem',
                                        color: cat.iconColor,
                                        boxShadow: `0 4px 14px ${cat.iconColor}30`,
                                        flexShrink: 0
                                    }}>
                                        <i className={`fa-solid ${cat.icon}`}></i>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', fontWeight: '700', color: '#1e293b' }}>
                                            {cat.name}
                                        </h3>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: hasItems ? cat.iconColor : '#94a3b8',
                                            color: '#fff',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            padding: '2px 10px',
                                            borderRadius: '20px'
                                        }}>
                                            {loading ? '...' : hasItems ? `${count} item${count !== 1 ? 's' : ''}` : 'Coming soon'}
                                        </span>
                                    </div>
                                </div>

                                {/* Bottom info */}
                                <div style={{ padding: '14px 20px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.4 }}>
                                        {cat.desc}
                                    </p>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: `${cat.iconColor}15`,
                                        color: cat.iconColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        marginLeft: '10px',
                                        fontSize: '0.85rem'
                                    }}>
                                        <i className="fa-solid fa-chevron-right"></i>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick search prompt */}
                <div style={{
                    marginTop: '50px',
                    textAlign: 'center',
                    padding: '30px',
                    background: '#fff',
                    borderRadius: '20px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    border: '2px dashed #e2e8f0'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍</div>
                    <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.2rem' }}>
                        Can't find what you're looking for?
                    </h3>
                    <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: '0.9rem' }}>
                        Browse all products and use the search bar to find anything instantly.
                    </p>
                    <button
                        onClick={() => navigate('/shop')}
                        style={{
                            background: 'linear-gradient(135deg, #059669, #10b981)',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 28px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className="fa-solid fa-store"></i>
                        Browse All Products
                    </button>
                </div>
            </div>
        </main>
    );
};

export default CategoriesPage;
