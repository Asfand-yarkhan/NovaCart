import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/products');
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.slice(0, 4)); // Only show top 4 featured products
                }
            } catch (err) {
                console.error('Error fetching featured products:', err.message);
            }
        };

        fetchProducts();
    }, []);

    return (
        <section className="featured section-padding bg-light">
            <div className="container">
                <div className="section-header">
                    <h2>Featured Products</h2>
                    <button className="view-all-btn" onClick={() => navigate('/shop')}>
                        View All <i className="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

                <div className="products-grid">
                    {products.length === 0 ? (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b' }}>Check back soon for featured items!</p>
                    ) : (
                        products.map((product, index) => (
                            <div className={`product-card animate-fade delay-${index * 100}`} key={product._id}>
                                {product.tag && (
                                    <div className={`product-tag ${product.tag === 'Sale' ? 'tag-sale' : 'tag-fresh'}`}>
                                        {product.tag}
                                    </div>
                                )}

                                <div className="product-image-container" style={{ height: '200px', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Fallback image logic since we don't have images in DB yet */}
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="product-image" />
                                    ) : (
                                        <i className="fa-solid fa-basket-shopping" style={{ fontSize: '4rem', color: '#d1d5db' }}></i>
                                    )}
                                    <button className="btn-icon heart-btn" onClick={() => navigate('/wishlist')}><i className="fa-regular fa-heart"></i></button>
                                </div>

                                <div className="product-info">
                                    <span className="product-category">{product.category}</span>
                                    <h3 className="product-title">{product.name}</h3>

                                    <div className="product-rating">
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star"></i>
                                        <i className="fa-solid fa-star-half-stroke"></i>
                                        <span>(4.5)</span>
                                    </div>

                                    <div className="product-bottom">
                                        <div className="product-price">
                                            <span className="current-price">${product.price.toFixed(2)}</span>
                                            {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                                        </div>
                                        <button className="add-to-cart-btn btn-primary" onClick={() => navigate('/cart')}>
                                            <i className="fa-solid fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
