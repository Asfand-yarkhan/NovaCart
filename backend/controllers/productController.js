const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const Order = require('../models/Order');
const slugify = require('../utils/slugify');
const { httpError } = require('../middleware/errorMiddleware');

const LIST_FIELDS = '-reviews -metaKeywords';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1, numReviews: -1 },
    name: { name: 1 },
    stock: { stock: 1 }
};

// @route GET /api/products
// Query: q, category, minPrice, maxPrice, inStock, featured, onSale, sort, page, limit
const getProducts = async (req, res) => {
    const { q, category, minPrice, maxPrice, inStock, featured, onSale, sort = 'newest' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 24));

    const filter = {};
    if (q && q.trim()) {
        const rx = new RegExp(escapeRegex(q.trim()), 'i');
        filter.$or = [{ name: rx }, { category: rx }, { description: rx }, { metaKeywords: rx }];
    }
    if (category && category !== 'All') {
        const list = String(category).split(',').map(c => c.trim()).filter(Boolean);
        filter.category = list.length > 1 ? { $in: list } : list[0];
    }
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (featured === 'true') filter.featured = true;
    if (onSale === 'true') filter.$expr = { $gt: ['$compareAtPrice', '$price'] };

    const [products, total] = await Promise.all([
        Product.find(filter).select(LIST_FIELDS).sort(SORTS[sort] || SORTS.newest)
            .skip((page - 1) * limit).limit(limit).lean(),
        Product.countDocuments(filter)
    ]);

    res.json({ products, total, page, pages: Math.max(1, Math.ceil(total / limit)), limit });
};

// @route GET /api/products/categories
const getCategories = async (req, res) => {
    const rows = await Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, inStock: { $sum: { $cond: [{ $gt: ['$stock', 0] }, 1, 0] } }, minPrice: { $min: '$price' } } },
        { $sort: { _id: 1 } }
    ]);
    res.json(rows.map(r => ({ name: r._id, slug: slugify(r._id), count: r.count, inStock: r.inStock, minPrice: r.minPrice })));
};

// @route GET /api/products/slug/:slug
const getProductBySlug = async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) throw httpError(404, 'We could not find that product.');

    product.reviews = (product.reviews || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const related = await Product.find({ category: product.category, _id: { $ne: product._id } })
        .select(LIST_FIELDS).sort({ stock: -1, rating: -1 }).limit(4).lean();

    res.json({ ...product, related });
};

// @route GET /api/products/:id   (admin editing)
const getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');
    res.json(product);
};

// multipart/form-data sends everything as strings; coerce the fields we know about.
const parseBody = (body = {}) => {
    const data = {};
    const str = ['name', 'description', 'category', 'unit', 'origin', 'slug', 'metaTitle', 'metaDescription', 'metaKeywords'];
    str.forEach(k => { if (body[k] !== undefined) data[k] = String(body[k]).trim(); });
    ['price', 'stock'].forEach(k => {
        if (body[k] !== undefined && body[k] !== '') data[k] = Number(body[k]);
    });
    if (body.compareAtPrice !== undefined) {
        data.compareAtPrice = body.compareAtPrice === '' || body.compareAtPrice === 'null' ? null : Number(body.compareAtPrice);
    }
    if (body.featured !== undefined) data.featured = body.featured === true || body.featured === 'true';
    if (data.slug === '') delete data.slug;
    ['price', 'stock', 'compareAtPrice'].forEach(k => {
        if (data[k] !== undefined && data[k] !== null && Number.isNaN(data[k])) throw httpError(400, `${k} must be a number.`);
    });
    return data;
};

const removeLocalImage = (image) => {
    if (!image || !image.startsWith('/uploads/')) return;
    const file = path.join(__dirname, '..', image);
    fs.promises.unlink(file).catch(() => {});
};

// @route POST /api/products (admin)
const createProduct = async (req, res) => {
    const data = parseBody(req.body);
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    if (!data.slug && data.name) data.slug = slugify(data.name);
    const product = await Product.create(data);
    res.status(201).json(product);
};

// @route PUT /api/products/:id (admin)
const updateProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');

    const data = parseBody(req.body);
    const oldImage = product.image;
    if (req.file) data.image = `/uploads/${req.file.filename}`;
    if (req.body.removeImage === 'true' && !req.file) data.image = '';

    product.set(data);
    await product.save();
    if (data.image !== undefined && oldImage !== product.image) removeLocalImage(oldImage);
    res.json(product);
};

// @route DELETE /api/products/:id (admin)
const deleteProduct = async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');
    removeLocalImage(product.image);
    res.json({ message: 'Product deleted.' });
};

// @route POST /api/products/:id/reviews (customer)
const addReview = async (req, res) => {
    const rating = Number(req.body?.rating);
    const comment = String(req.body?.comment || '').trim();
    if (!(rating >= 1 && rating <= 5)) throw httpError(400, 'Choose a rating from 1 to 5 stars.');

    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');

    const purchased = await Order.exists({ user: req.user._id, 'items.product': product._id, status: { $ne: 'cancelled' } });
    const existing = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
        existing.rating = rating;
        existing.comment = comment;
        existing.verified = Boolean(purchased);
    } else {
        product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment, verified: Boolean(purchased) });
    }
    product.recalculateRating();
    await product.save();
    res.status(existing ? 200 : 201).json({
        rating: product.rating,
        numReviews: product.numReviews,
        reviews: [...product.reviews].sort((a, b) => b.createdAt - a.createdAt)
    });
};

// @route DELETE /api/products/:id/reviews/:reviewId (author or admin)
const deleteReview = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw httpError(404, 'Product not found.');
    const review = product.reviews.id(req.params.reviewId);
    if (!review) throw httpError(404, 'Review not found.');
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw httpError(403, 'You can only delete your own review.');
    }
    review.deleteOne();
    product.recalculateRating();
    await product.save();
    res.json({ rating: product.rating, numReviews: product.numReviews, reviews: product.reviews });
};

module.exports = {
    getProducts, getCategories, getProductBySlug, getProductById,
    createProduct, updateProduct, deleteProduct, addReview, deleteReview
};
