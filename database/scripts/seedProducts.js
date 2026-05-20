const path = require('path');
const Module = require('module');

// 1. Add to the entrypoint's own search paths
module.paths.push(path.resolve(__dirname, '../../backend/node_modules'));

// 2. Hook to resolve for all required child modules
const originalNodeModulePaths = Module._nodeModulePaths;
Module._nodeModulePaths = function(from) {
    const paths = originalNodeModulePaths(from);
    paths.push(path.resolve(__dirname, '../../backend/node_modules'));
    return paths;
};

require('dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const catalog = require('../data/productsSeed');
const { mergeSeoIntoProduct, slugify } = require('../../seo/seoGenerator');

const seed = async () => {
    const force = process.argv.includes('--force');
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await Product.countDocuments();
    if (existing > 0 && !force) {
        console.log(`Skipped: ${existing} products already in database. Use --force to re-seed.`);
        process.exit(0);
    }

    if (force) {
        await Product.deleteMany({});
        console.log('Cleared existing products.');
    }

    let created = 0;
    for (const item of catalog) {
        const withSeo = await mergeSeoIntoProduct({ ...item });
        const slug = withSeo.slug || slugify(item.name);
        const duplicate = await Product.findOne({ slug });
        withSeo.slug = duplicate ? `${slug}-${created + 1}` : slug;

        await Product.create(withSeo);
        created += 1;
        console.log(`  + ${item.name} (${item.category})`);
    }

    console.log(`\nDone: ${created} products seeded.`);
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
