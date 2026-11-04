require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const { UPLOAD_DIR } = require('./config/paths');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('JWT_SECRET is not set. Refusing to start in production.');
        process.exit(1);
    }
    process.env.JWT_SECRET = 'novacart-dev-secret-change-me';
    console.warn('JWT_SECRET is not set. Using an insecure development secret.');
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.disable('x-powered-by');
app.use(cors({
    origin: (origin, cb) => {
        const allowed = CLIENT_URL.split(',').map(s => s.trim());
        // Allow same-origin / curl (no origin) and any localhost port during development
        if (!origin || allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
        cb(null, false);
    }
}));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
const { contact, newsletter } = require('./routes/contactRoutes');
app.use('/api/contact', contact);
app.use('/api/newsletter', newsletter);
app.use('/', require('./routes/seoRoutes'));

// Serve the built frontend when it exists (single-server production deploy)
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (process.env.SERVE_FRONTEND === 'true') {
    app.use(express.static(dist));
    app.get(/^\/(?!api|uploads).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
} else {
    app.get('/', (req, res) => res.json({ name: 'NovaCart API', docs: '/api/health' }));
}

app.use(notFound);
app.use(errorHandler);

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novacart';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log(`Connected to MongoDB (${mongoose.connection.name})`);
        app.listen(PORT, () => console.log(`NovaCart API listening on http://localhost:${PORT}`));
    })
    .catch((error) => {
        console.error('Could not connect to MongoDB:', error.message);
        process.exit(1);
    });

module.exports = app;
