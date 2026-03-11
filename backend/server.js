const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./routes/productRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Main Route Mounting
app.use('/api/products', productRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'NovaCart API is running smoothly' });
});

// Database Connection & Server Start
// Using a local fallback if MONGO_URI is not provided in .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/novacart';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Directly Connected to MongoDB Database (NovaCart)');
        app.listen(PORT, () => {
            console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error connecting to MongoDB:', error.message);
        process.exit(1);
    });
