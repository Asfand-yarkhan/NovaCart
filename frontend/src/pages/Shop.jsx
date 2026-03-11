import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/products');
                if (!response.ok) throw new Error('Failed to fetch products');
                const data = await response.json();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px' }}>
            <Helmet>
                <title>Shop Fresh Organic Groceries | NovaCart</title>
                <meta name="description" content="Browse our complete catalog of farm-fresh fruits, crisp vegetables, dairy, meats, and household essentials. Shop NovaCart today for great deals." />
                <meta name="keywords" content="buy groceries online, fresh food catalog, shop organic products, NovaCart store" />
            </Helmet>
            <div className="container">
                <div className="section-header">
                    <h2>Shop All Products</h2>
                    <p>Browse our complete catalog of fresh and organic products.</p>
                </div>

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading healthy groceries...</div>
                ) : error ? (
                    <div style={{ textAlign: 'center', color: 'red', padding: '50px' }}>Error loading products: {error}</div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No products available yet. Check back soon!</div>
                ) : (
                    <div className="products-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
                        {products.map(product => (
                            <div className="product-card" key={product._id} style={{ border: '1px solid #e5e7eb', borderRadius: '15px', padding: '20px', transition: 'all 0.3s ease', backgroundColor: '#fff' }}>
                                <div className="product-badge" style={{ display: 'inline-block', padding: '5px 10px', backgroundColor: '#059669', color: 'white', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '15px' }}>
                                    {product.category}
                                </div>
                                <div className="product-image" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
                                    <i className="fa-solid fa-basket-shopping" style={{ fontSize: '5rem', color: '#d1d5db' }}></i>
                                </div>
                                <div className="product-info">
                                    <h3 className="product-title" style={{ fontSize: '1.2rem', color: '#111827', marginBottom: '10px', fontWeight: 'bold' }}>{product.name}</h3>

                                    <div className="product-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <div className="product-price">
                                            <span className="current-price" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>${product.price.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="product-actions" style={{ display: 'flex', gap: '10px' }}>
                                        <button className="btn-icon" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}>
                                            <i className="fa-regular fa-heart"></i>
                                        </button>
                                        <button className="btn-primary" style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: '50px', backgroundColor: '#059669', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s ease' }}>
                                            <i className="fa-solid fa-cart-shopping"></i> Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
};

export default Shop;
