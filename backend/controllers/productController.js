const Product = require('../models/Product');

// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching products', error: error.message });
    }
};

// Create a new product (Admin)
const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
};

// Update an existing product (Admin)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error: error.message });
    }
};

// Delete a product (Admin)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

module.exports = {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
};
