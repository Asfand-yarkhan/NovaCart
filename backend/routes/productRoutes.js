const express = require('express');
const router = express.Router();
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');

// Storefront & Admin: Get All Products
router.get('/', getProducts);

// Admin: Manage Products
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
