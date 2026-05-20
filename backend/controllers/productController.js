const Product = require('../../database/models/Product');
const { mergeSeoIntoProduct, generateProductSeo } = require('../../seo/seoGenerator');

// Get all products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching products', error: error.message });
    }
};

// Get product by slug
const getProductBySlug = async (req, res) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Preview / generate SEO with AI (Admin)
const generateSeo = async (req, res) => {
    try {
        const { name, description, category, price, excludeId } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ message: 'Product name is required for SEO generation' });
        }
        const seo = await generateProductSeo(
            { name, description, category, price },
            { excludeId }
        );
        res.json({ ...seo, aiPowered: Boolean(process.env.GEMINI_API_KEY) });
    } catch (error) {
        res.status(500).json({ message: 'SEO generation failed', error: error.message });
    }
};

// Create a new product (Admin)
const createProduct = async (req, res) => {
    try {
        let data = { ...req.body };
        if (req.file) data.image = `/uploads/${req.file.filename}`;
        data = await mergeSeoIntoProduct(data);
        const product = new Product(data);
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
        let data = { ...req.body };
        if (req.file) data.image = `/uploads/${req.file.filename}`;
        data = await mergeSeoIntoProduct(data, { excludeId: id, enrichDescription: false });
        const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
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
        if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ message: 'Product successfully deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

module.exports = {
    getProducts,
    getProductBySlug,
    generateSeo,
    createProduct,
    updateProduct,
    deleteProduct,
};
