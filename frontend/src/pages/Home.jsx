import React from 'react';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import FeaturedProducts from '../components/FeaturedProducts';

const Home = () => {
    return (
        <main>
            <Hero />
            <Categories />
            <FeaturedProducts />
        </main>
    );
};

export default Home;
