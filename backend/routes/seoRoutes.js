const express = require('express');
const Product = require('../models/Product');
const { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, DELIVERY_WINDOWS, CURRENCY } = require('../config/store');

const router = express.Router();

const escapeXml = (s) => String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

// @route GET /sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
    const site = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
    const products = await Product.find().select('slug updatedAt').lean();
    const categories = await Product.distinct('category');
    const staticPages = ['', '/shop', '/categories', '/about', '/contact', '/faq'];

    const urls = [
        ...staticPages.map(p => `<url><loc>${site}${p}</loc><changefreq>weekly</changefreq><priority>${p === '' ? '1.0' : '0.7'}</priority></url>`),
        ...categories.map(c => `<url><loc>${site}/shop?category=${encodeURIComponent(c)}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`),
        ...products.map(p => `<url><loc>${site}/product/${escapeXml(p.slug)}</loc><lastmod>${new Date(p.updatedAt).toISOString().slice(0, 10)}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`)
    ];

    res.type('application/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
    );
});

// @route GET /api/store  – public store settings so the frontend never hardcodes them
router.get('/api/store', (req, res) => {
    res.json({ currency: CURRENCY, deliveryFee: DELIVERY_FEE, freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD, deliveryWindows: DELIVERY_WINDOWS });
});

module.exports = router;
