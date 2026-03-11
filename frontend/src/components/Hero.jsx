import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="hero">
            <div className="hero-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
            </div>

            <div className="container hero-container">
                <div className="hero-content animate-fade">
                    <span className="badge">100% Organic Products</span>
                    <h1 className="hero-title">
                        Fresh groceries <br />
                        delivered to your <span className="text-gradient">Doorstep</span>
                    </h1>
                    <p className="hero-description">
                        NovaCart brings the freshest fruits, vegetables, and everyday essentials
                        straight to your home with lightning-fast delivery. Quality guaranteed.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-primary" onClick={() => navigate('/shop')}>
                            Shop Now <i className="fa-solid fa-arrow-right"></i>
                        </button>
                        <button className="btn hero-btn-outline" onClick={() => navigate('/about')}>
                            <i className="fa-regular fa-circle-play"></i> Watch How it Works
                        </button>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <strong>14k+</strong>
                            <span>Products</span>
                        </div>
                        <div className="divider"></div>
                        <div className="stat">
                            <strong>50k+</strong>
                            <span>Customers</span>
                        </div>
                    </div>
                </div>

                <div className="hero-image-wrapper animate-fade delay-200">
                    <div className="hero-image glass">
                        {/* Generate an image logic or a placeholder. We will use an abstract representation for now */}
                        <div className="abstract-groceries">
                            <div className="floating-item item-1 glass"><i className="fa-solid fa-apple-whole"></i> Fresh</div>
                            <div className="floating-item item-2 glass"><i className="fa-solid fa-carrot"></i> Healthy</div>
                            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Fresh Groceries" className="main-image" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
