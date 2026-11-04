const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000, default: '' },
    verified: { type: Boolean, default: false }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '' },
    category: { type: String, required: [true, 'Category is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    compareAtPrice: { type: Number, min: 0, default: null },
    unit: { type: String, trim: true, default: '1 pc' },
    origin: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
    image: { type: String, default: '' },
    featured: { type: Boolean, default: false },

    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],

    // SEO fields
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 200 },
    metaKeywords: { type: String, trim: true }
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', category: 'text', metaKeywords: 'text' });
productSchema.index({ category: 1, price: 1 });

productSchema.pre('validate', function () {
    if (!this.slug && this.name) this.slug = slugify(this.name);
    else if (this.slug) this.slug = slugify(this.slug);
});

productSchema.methods.recalculateRating = function () {
    this.numReviews = this.reviews.length;
    this.rating = this.numReviews
        ? Math.round((this.reviews.reduce((s, r) => s + r.rating, 0) / this.numReviews) * 10) / 10
        : 0;
};

module.exports = mongoose.model('Product', productSchema);
