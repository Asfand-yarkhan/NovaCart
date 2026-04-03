import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000';

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`${API_BASE}/api/products/slug/${slug}`)
            .then(r => { if (!r.ok) throw new Error('Product not found'); return r.json(); })
            .then(setProduct).catch(err => setError(err.message)).finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div>Loading product...</div></main>;
    if (error || !product) return <main style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>{error || 'Product not found'} <Link to="/shop" style={{ marginLeft: '12px', color: '#059669' }}>Back to Shop</Link></main>;

    const wishlisted = isWishlisted(product._id);
    const imgSrc = product.image ? `${API_BASE}${product.image}` : null;

    const handleAddToCart = () => {
        if (!user) { navigate('/login'); return; }
        addToCart(product, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <main style={{ minHeight: '60vh', marginTop: '80px', background: '#f8fafc', paddingBottom: '60px' }}>
            <Helmet>
                <title>{product.metaTitle || product.name + ' | NovaCart'}</title>
                <meta name="description" content={product.metaDescription || product.description || ''} />
                <meta name="keywords" content={product.metaKeywords || ''} />
            </Helmet>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <Link to="/shop" style={{ color: '#059669', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem', display: 'inline-block', marginBottom: '24px' }}>← Back to Shop</Link>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', background: '#fff', borderRadius: '20px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                    {/* Image */}
                    <div style={{ background: '#f0fdf4', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', overflow: 'hidden' }}>
                        {imgSrc ? <img src={imgSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} /> : <i className="fa-solid fa-basket-shopping" style={{ fontSize: '7rem', color: '#6ee7b7' }}></i>}
                    </div>
                    {/* Info */}
                    <div>
                        <span style={{ fontSize: '0.8rem', background: '#f0fdf4', color: '#059669', padding: '4px 14px', borderRadius: '20px', fontWeight: '600' }}>{product.category}</span>
                        <h1 style={{ fontSize: '1.8rem', color: '#1e293b', margin: '14px 0 8px' }}>{product.name}</h1>
                        {product.description && <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '20px' }}>{product.description}</p>}
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', marginBottom: '8px' }}>Rs. {product.price?.toFixed(2)}</div>
                        <p style={{ color: product.stock > 0 ? '#059669' : '#ef4444', fontSize: '0.9rem', fontWeight: '600', marginBottom: '24px' }}>
                            <i className={`fa-solid ${product.stock > 0 ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ marginRight: '6px' }}></i>
                            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
                        </p>

                        {/* Qty selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: '38px', height: '38px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ fontWeight: '700', fontSize: '1.1rem', minWidth: '30px', textAlign: 'center' }}>{qty}</span>
                            <button onClick={() => setQty(q => q + 1)} style={{ width: '38px', height: '38px', border: '1.5px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={handleAddToCart} disabled={product.stock === 0} style={{ flex: 1, padding: '13px', background: added ? '#10b981' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                                <i className={`fa-solid ${added ? 'fa-check' : 'fa-cart-shopping'}`} style={{ marginRight: '8px' }}></i>
                                {added ? 'Added!' : 'Add to Cart'}
                            </button>
                            <button onClick={() => toggleWishlist(product)} style={{ width: '50px', height: '50px', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: wishlisted ? '#fef2f2' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: wishlisted ? '#ef4444' : '#64748b', fontSize: '1.2rem', transition: 'all 0.2s' }}>
                                <i className={`fa-${wishlisted ? 'solid' : 'regular'} fa-heart`}></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ProductDetail;
