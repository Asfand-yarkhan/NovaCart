/* eslint-disable no-console */
// Resets the database to a realistic demo store.
// Usage: npm run seed            (products, users, orders, reviews, messages)
//        npm run seed -- --products-only
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Message = require('../models/Message');
const Subscriber = require('../models/Subscriber');
const { UPLOAD_DIR } = require('../config/paths');
const { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, DELIVERY_WINDOWS } = require('../config/store');
const { products: catalogue } = require('./data');

const productsOnly = process.argv.includes('--products-only');
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novacart';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@novacart.pk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

// Deterministic PRNG so every seed produces the same store
let s = 20261104;
const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => Math.floor(a + rand() * (b - a + 1));

const customers = [
    { name: 'Hira Siddiqui', email: 'hira.siddiqui@example.pk', phone: '0321 4478 192', city: 'Lahore', street: '14-B, Street 7, Model Town', state: 'Punjab', zip: '54700' },
    { name: 'Bilal Qureshi', email: 'bilal.qureshi@example.pk', phone: '0300 8124 657', city: 'Karachi', street: 'Flat 302, Al-Habib Heights, Block 13-D, Gulshan-e-Iqbal', state: 'Sindh', zip: '75300' },
    { name: 'Zainab Raza', email: 'zainab.raza@example.pk', phone: '0333 5129 804', city: 'Islamabad', street: 'House 61, Street 22, F-10/2', state: 'ICT', zip: '44000' },
    { name: 'Usman Tariq', email: 'usman.tariq@example.pk', phone: '0345 7731 220', city: 'Lahore', street: '92 Main Boulevard, DHA Phase 5', state: 'Punjab', zip: '54810' },
    { name: 'Mahnoor Iqbal', email: 'mahnoor.iqbal@example.pk', phone: '0312 6650 913', city: 'Rawalpindi', street: '7-A Satellite Town, Block C', state: 'Punjab', zip: '46300' },
    { name: 'Hamza Sheikh', email: 'hamza.sheikh@example.pk', phone: '0301 2298 476', city: 'Karachi', street: 'Bungalow 18, Khayaban-e-Shamsheer, DHA Phase 6', state: 'Sindh', zip: '75500' },
    { name: 'Areeba Khan', email: 'areeba.khan@example.pk', phone: '0336 9041 385', city: 'Faisalabad', street: '221 Peoples Colony No. 1', state: 'Punjab', zip: '38000' }
];

const reviewLines = {
    5: [
        'Arrived cold and well packed. Exactly what the photo shows.',
        'Better than what I get from the sabzi mandi, and I did not have to go anywhere.',
        'Third time ordering this. Consistent every time.',
        'Fresh, sweet and the rider called before arriving. Will order again.',
        'My kids finished it in two days. Ordering double next week.'
    ],
    4: [
        'Good quality. One piece was a little soft but the rest were perfect.',
        'Tasty and fresh. Slightly pricier than the market but worth the convenience.',
        'Very good, delivery came in the second half of the window.',
        'Nice and fresh. Packaging could use less plastic.'
    ],
    3: [
        'Decent, though not as ripe as I expected. Lasted fine for a week.',
        'Okay for the price. I have had better from this store before.'
    ]
};

const ratingFor = () => { const r = rand(); return r < 0.62 ? 5 : r < 0.9 ? 4 : 3; };

async function run() {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to ${mongoose.connection.name}`);

    // Copy seed images into uploads/ so they are served exactly like admin uploads
    const srcDir = path.join(__dirname, 'images');
    for (const f of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, f), path.join(UPLOAD_DIR, `seed-${f}`));
    }

    await Product.deleteMany({});
    const products = await Product.insertMany(catalogue.map(({ photo, ...p }) => ({
        ...p,
        image: `/uploads/seed-${p.slug}.jpg`,
        metaTitle: `${p.name} (${p.unit}) | Buy online at NovaCart`.slice(0, 70),
        metaDescription: `${p.description} Same-day grocery delivery in Lahore, Karachi and Islamabad.`.slice(0, 160),
        metaKeywords: [p.name.toLowerCase(), p.category.toLowerCase(), 'online grocery pakistan', 'novacart'].join(', ')
    })));
    console.log(`Inserted ${products.length} products`);

    if (productsOnly) return;

    await Promise.all([User.deleteMany({}), Order.deleteMany({}), Message.deleteMany({}), Subscriber.deleteMany({})]);

    const admin = await User.create({ name: 'Sana Malik', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin', phone: '0322 1100 450' });
    const users = [];
    for (const [i, c] of customers.entries()) {
        const u = await User.create({
            name: c.name, email: c.email, password: 'Customer@123', phone: c.phone,
            address: { fullName: c.name, phone: c.phone, street: c.street, city: c.city, state: c.state, zip: c.zip, country: 'Pakistan' }
        });
        // Back-date sign-ups so "new customers" looks organic
        await User.updateOne({ _id: u._id }, { $set: { createdAt: new Date(Date.now() - (60 - i * 7) * 86400000) } }, { timestamps: false });
        users.push({ doc: u, info: c });
    }
    console.log(`Created admin and ${users.length} customers`);

    // Orders spread across the last 30 days
    const inStock = products.filter(p => p.stock > 0);
    const orders = [];
    for (let day = 29; day >= 0; day--) {
        const count = between(day < 3 ? 2 : 1, day % 6 === 0 || day % 7 === 5 ? 5 : 4);
        for (let k = 0; k < count; k++) {
            const { doc: u, info } = pick(users);
            const lines = new Map();
            const n = between(2, 6);
            while (lines.size < n) lines.set(pick(inStock), between(1, 3));
            const items = [...lines].map(([p, quantity]) => ({
                product: p._id, name: p.name, slug: p.slug, unit: p.unit, price: p.price, quantity, image: p.image
            }));
            const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
            const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

            const createdAt = new Date(Date.now() - day * 86400000);
            createdAt.setHours(between(8, 22), between(0, 59), 0, 0);
            if (createdAt > new Date()) createdAt.setTime(Date.now() - between(10, 120) * 60000);

            let status;
            if (day >= 3) status = rand() < 0.07 ? 'cancelled' : 'delivered';
            else if (day >= 1) status = pick(['shipped', 'delivered', 'confirmed']);
            else status = pick(['processing', 'processing', 'confirmed']);

            const flow = ['processing', 'confirmed', 'shipped', 'delivered'];
            const history = status === 'cancelled'
                ? [{ status: 'processing', at: createdAt }, { status: 'cancelled', at: new Date(createdAt.getTime() + 40 * 60000), note: 'Cancelled by customer' }]
                : flow.slice(0, flow.indexOf(status) + 1).map((st, idx) => ({ status: st, at: new Date(createdAt.getTime() + idx * between(50, 180) * 60000) }));

            const slotDate = new Date(createdAt); slotDate.setDate(slotDate.getDate() + (createdAt.getHours() > 17 ? 1 : 0));
            orders.push({
                user: u._id,
                items,
                shippingAddress: { fullName: info.name, phone: info.phone, street: info.street, city: info.city, state: info.state, zip: info.zip, country: 'Pakistan' },
                deliverySlot: { date: slotDate, window: pick(DELIVERY_WINDOWS) },
                paymentMethod: 'cod',
                paymentStatus: status === 'delivered' ? 'paid' : 'pending',
                subtotal, deliveryFee, total: subtotal + deliveryFee,
                status, statusHistory: history, stockRestored: status === 'cancelled',
                createdAt, updatedAt: history[history.length - 1].at
            });
        }
    }
    // Save one by one so each gets its order number; keep our createdAt values
    for (const o of orders) {
        const doc = new Order(o);
        await doc.save({ timestamps: false });
    }
    console.log(`Created ${orders.length} orders`);

    // Reviews from customers who actually bought the product
    const bought = new Map();
    for (const o of orders.filter(x => x.status === 'delivered')) {
        for (const i of o.items) {
            const key = i.product.toString();
            if (!bought.has(key)) bought.set(key, new Set());
            bought.get(key).add(o.user.toString());
        }
    }
    let reviewCount = 0;
    for (const product of products) {
        const buyers = [...(bought.get(product._id.toString()) || [])].slice(0, between(0, 4));
        for (const uid of buyers) {
            const u = users.find(x => x.doc._id.toString() === uid).doc;
            const rating = ratingFor();
            product.reviews.push({
                user: u._id, name: u.name, rating, comment: pick(reviewLines[rating]), verified: true,
                createdAt: new Date(Date.now() - between(1, 25) * 86400000)
            });
            reviewCount++;
        }
        product.recalculateRating();
        await product.save();
    }
    console.log(`Added ${reviewCount} verified reviews`);

    await Message.insertMany([
        { name: 'Bilal Qureshi', email: 'bilal.qureshi@example.pk', subject: 'Delivery', orderNumber: '', message: 'Do you deliver to Bahria Town Karachi yet? Would love to order weekly.' },
        { name: 'Fatima Noor', email: 'fatima.noor@example.pk', subject: 'Bulk order', message: 'We run a small cafe in Johar Town. Can we get a weekly invoice for milk, eggs and bread?' },
        { name: 'Zainab Raza', email: 'zainab.raza@example.pk', subject: 'Order issue', message: 'One of the yogurt cups was cracked in my last order. Not a big deal, just letting you know.', read: true }
    ]);
    await Subscriber.insertMany(customers.slice(0, 4).map(c => ({ email: c.email })));

    console.log('\nDone. Sign in with:');
    console.log(`  Admin     ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Customer  ${customers[0].email} / Customer@123`);
    console.log(`  (admin id ${admin._id})`);
}

run()
    .catch(err => { console.error(err); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
