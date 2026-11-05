/* eslint-disable no-console */
// Checks that MONGO_URI in backend/.env works: npm run db:check
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/novacart';
const safe = uri.replace(/\/\/([^:/]+):([^@]+)@/, '//$1:****@');
console.log(`Connecting to ${safe}`);

if (/YOUR_DB_(USER|PASSWORD)|<db_(username|password)>/.test(uri)) {
    console.error('MONGO_URI still has placeholder text. Put your Atlas database user and password in backend/.env.');
    process.exit(1);
}

mongoose.connect(uri, { serverSelectionTimeoutMS: 12000 })
    .then(async () => {
        const db = mongoose.connection.db;
        const collections = (await db.listCollections().toArray()).map(c => c.name).sort();
        const counts = {};
        for (const name of ['products', 'users', 'orders']) {
            if (collections.includes(name)) counts[name] = await db.collection(name).countDocuments();
        }
        console.log(`Connected. Database "${mongoose.connection.name}" on ${mongoose.connection.host}`);
        console.log(collections.length ? `Collections: ${collections.join(', ')}` : 'The database is empty. Run: npm run seed');
        if (Object.keys(counts).length) console.log('Documents:', counts);
    })
    .catch(err => {
        const msg = err.message || String(err);
        console.error('Could not connect:', msg.split('\n')[0]);
        if (/bad auth|authentication failed/i.test(msg)) {
            console.error('-> The username or password is wrong. Check Database Access in Atlas, and URL-encode special characters in the password (@ is %40, # is %23).');
        } else if (/whitelist|not authorized|IP|Server selection timed out|ETIMEOUT|ECONNREFUSED/i.test(msg)) {
            console.error('-> Atlas did not answer. Add your IP in Atlas under Network Access (or 0.0.0.0/0 for testing), wait a minute, and try again.');
        } else if (/querySrv|ENOTFOUND|EBADNAME/i.test(msg)) {
            console.error('-> The cluster address could not be found. Copy the connection string again from Atlas, and check your internet connection or DNS.');
        }
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
