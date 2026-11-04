const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const {
    getProducts, getCategories, getProductBySlug, getProductById,
    createProduct, updateProduct, deleteProduct, addReview, deleteReview
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { UPLOAD_DIR } = require('../config/paths');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (/^image\/(jpe?g|png|webp|avif|gif)$/.test(file.mimetype)) return cb(null, true);
        cb(Object.assign(new Error('Upload a JPG, PNG, WebP or AVIF image.'), { status: 400 }));
    }
});

// Storefront
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);

// Reviews
router.post('/:id/reviews', protect, addReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

// Admin
router.get('/:id', protect, adminOnly, getProductById);
router.post('/', protect, adminOnly, upload.single('image'), createProduct);
router.put('/:id', protect, adminOnly, upload.single('image'), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
