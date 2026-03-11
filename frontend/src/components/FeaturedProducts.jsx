import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FeaturedProducts.css';

const FeaturedProducts = () => {
    const navigate = useNavigate();
    const products = [
        { id: 1, name: 'Fresh Organic Tomatoes', price: '$4.99', oldPrice: '$6.50', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', tag: 'Sale', category: 'Vegetables' },
        { id: 2, name: 'Premium Bananas', price: '$2.49', oldPrice: null, image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', tag: 'Fresh', category: 'Fruits' },
        { id: 3, name: 'Whole Wheat Bread', price: '$3.99', oldPrice: null, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', tag: null, category: 'Bakery' },
        { id: 4, name: 'Farm Fresh Eggs (12)', price: '$5.50', oldPrice: '$7.00', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80', tag: 'Organic', category: 'Dairy' }
    ];

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
                    {products.map((product, index) => (
                        <div className={`product-card animate-fade delay-${index * 100}`} key={product.id}>
                            {product.tag && (
                                <div className={`product-tag ${product.tag === 'Sale' ? 'tag-sale' : 'tag-fresh'}`}>
                                    {product.tag}
                                </div>
                            )}

                            <div className="product-image-container">
                                <img src={product.image} alt={product.name} className="product-image" />
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
                                        <span className="current-price">{product.price}</span>
                                        {product.oldPrice && <span className="old-price">{product.oldPrice}</span>}
                                    </div>
                                    <button className="add-to-cart-btn btn-primary" onClick={() => navigate('/cart')}>
                                        <i className="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FeaturedProducts;
