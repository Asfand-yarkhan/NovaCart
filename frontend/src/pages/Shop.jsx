import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [addedId, setAddedId] = useState(null);
    const { addToCart } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Read ?category= from URL
    const [searchParams, setSearchParams] = useSearchParams();
    const urlCategory = searchParams.get('category') || 'All';
    const [category, setCategory] = useState(urlCategory);

    // Sync category state when URL param changes (e.g. back/forward nav)
    useEffect(() => {
        setCategory(searchParams.get('category') || 'All');
    }, [searchParams]);

    const handleCategoryChange = (cat) => {
        setCategory(cat);
        if (cat === 'All') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams, { replace: true });
    };

    useEffect(() => {
        fetch(`${API_BASE}/api/products`)
            .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then(setProducts).catch(err => setError(err.message)).finally(() => setIsLoading(false));
    }, []);

    const categories = ['All', ...new Set(products.map(p => p.category))];
    const filtered = products.filter(p =>
        (category === 'All' || p.category === category) &&
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleAddToCart = (p) => {
        addToCart(p);
        setAddedId(p._id);
        setTimeout(() => setAddedId(null), 1500);
    };

    const handleWishlist = (p) => {
        if (!user) { navigate('/login'); return; }
        toggleWishlist(p);
    };

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet>
                <title>Shop Fresh Organic Groceries | NovaCart</title>
                <meta name="description" content="Browse our complete catalog of farm-fresh fruits, vegetables, dairy, meats and household essentials." />
                <meta name="keywords" content="buy groceries online, fresh food catalog, organic products, NovaCart store" />
            </Helmet>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '40px 20px', marginBottom: '0', textAlign: 'center' }}>
                <h1 style={{ color: '#fff', fontSize: '2.2rem', fontWeight: '800', margin: '0 0 8px' }}>
                    {category === 'All' ? 'Shop All Products' : `${category}`}
                </h1>
                <p style={{ color: '#a7f3d0', margin: 0 }}>
                    {category === 'All'
                        ? 'Browse our complete catalog of fresh and organic products'
                        : `Showing all products in ${category} · Click any other category to switch`
                    }
                </p>
                {category !== 'All' && (
                    <button
                        onClick={() => handleCategoryChange('All')}
                        style={{ marginTop: '12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '7px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                    >
                        ✕ Clear Filter
                    </button>
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
                {/* Search + Filter */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
                        <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ width: '100%', padding: '11px 14px 11px 40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#fff' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {categories.map(cat => (
                            <button key={cat} onClick={() => handleCategoryChange(cat)} style={{ padding: '9px 18px', borderRadius: '20px', border: '1.5px solid', borderColor: category === cat ? '#059669' : '#e2e8f0', background: category === cat ? '#059669' : '#fff', color: category === cat ? '#fff' : '#374151', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '16px' }}></i><p>Loading products...</p></div>
                ) : error ? (
                    <div style={{ textAlign: 'center', color: '#ef4444', padding: '60px' }}>Error: {error}</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>No products found. {search && 'Try a different search term.'}</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
                        {filtered.map(product => {
                            const imgSrc = product.image ? `${API_BASE}${product.image}` : null;
                            const wishlisted = isWishlisted(product._id);
                            const justAdded = addedId === product._id;
                            return (
                                <div key={product._id} style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>
                                    {/* Image */}
                                    <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ height: '190px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                            {imgSrc ? <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-basket-shopping" style={{ fontSize: '5rem', color: '#6ee7b7' }}></i>}
                                            <span style={{ position: 'absolute', top: '10px', left: '10px', background: '#059669', color: '#fff', fontSize: '0.75rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>{product.category}</span>
                                        </div>
                                    </Link>
                                    <div style={{ padding: '18px' }}>
                                        <Link to={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{ color: '#1e293b', marginBottom: '6px', fontSize: '1.05rem', fontWeight: '700' }}>{product.name}</h3>
                                        </Link>
                                        {product.description && <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                            <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#059669' }}>Rs. {product.price?.toFixed(2)}</span>
                                            <span style={{ fontSize: '0.8rem', color: product.stock > 0 ? '#059669' : '#ef4444', fontWeight: '600' }}>{product.stock > 0 ? `${product.stock} left` : 'Out of stock'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button onClick={() => handleWishlist(product)} style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: wishlisted ? '#fef2f2' : '#fff', color: wishlisted ? '#ef4444' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', transition: 'all 0.2s', flexShrink: 0 }}>
                                                <i className={`fa-${wishlisted ? 'solid' : 'regular'} fa-heart`}></i>
                                            </button>
                                            <button onClick={() => handleAddToCart(product)} disabled={product.stock === 0} style={{ flex: 1, padding: '10px', background: justAdded ? '#10b981' : product.stock === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #059669, #10b981)', color: product.stock === 0 ? '#94a3b8' : '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: product.stock === 0 ? 'not-allowed' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}>
                                                <i className={`fa-solid ${justAdded ? 'fa-check' : 'fa-cart-shopping'}`}></i>
                                                {justAdded ? 'Added!' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Shop;
