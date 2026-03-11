import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedProducts from '../components/FeaturedProducts';

const Home = () => {
    return (
        <main>
            <Helmet>
                <title>NovaCart - Fresh Groceries Delivered Quickly</title>
                <meta name="description" content="Shop fresh, organic groceries online at NovaCart. Lightning-fast delivery straight to your doorstep. Best prices on produce, dairy, bakery, and more." />
                <meta name="keywords" content="online grocery, fresh fruits, organic vegetables, grocery delivery, daily essentials, NovaCart" />
            </Helmet>
            <Hero />
            <Categories />
            <FeaturedProducts />
        </main>
    );
};

export default Home;
