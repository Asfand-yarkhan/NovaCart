const path = require('path');
const Module = require('module');
const originalNodeModulePaths = Module._nodeModulePaths;
Module._nodeModulePaths = function(from) {
    const paths = originalNodeModulePaths(from);
    paths.push(path.resolve(__dirname, 'node_modules'));
    return paths;
};

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'NovaCart API is running smoothly' });
});

// Root Route
app.get('/', (req, res) => {
    res.send('<h1>NovaCart Backend is Running!</h1>');
});

// Database Connection & Server Start
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/novacart';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Database (NovaCart)');
        app.listen(PORT, () => {
            console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    });
