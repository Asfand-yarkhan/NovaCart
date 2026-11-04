/* eslint-disable no-console */
// Promote an existing account to admin: npm run make-admin -- someone@example.com
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const email = (process.argv[2] || '').toLowerCase().trim();
if (!email) {
    console.error('Usage: npm run make-admin -- <email>');
    process.exit(1);
}

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novacart')
    .then(async () => {
        const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
        console.log(user ? `${user.email} is now an admin.` : `No account found for ${email}.`);
    })
    .catch(err => { console.error(err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
