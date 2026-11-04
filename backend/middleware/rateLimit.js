// Minimal in-memory limiter for credential endpoints. Only failed attempts (4xx) count,
// so people who sign in successfully are never locked out, while password guessing is slowed.
// Good enough for a single-instance deploy; use a Redis-backed limiter for several servers.
const rateLimit = ({ windowMs, max }) => {
    const hits = new Map();
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
    }, windowMs).unref();

    return (req, res, next) => {
        if (process.env.NODE_ENV === 'test') return next();
        const key = req.ip;
        const now = Date.now();
        let entry = hits.get(key);
        if (entry && entry.reset <= now) { hits.delete(key); entry = undefined; }

        if (entry && entry.count >= max) {
            res.set('Retry-After', Math.ceil((entry.reset - now) / 1000));
            return res.status(429).json({ message: 'Too many failed attempts. Please wait a few minutes and try again.' });
        }

        res.on('finish', () => {
            if (res.statusCode < 400 || res.statusCode === 429) return;
            const e = hits.get(key);
            if (!e || e.reset <= Date.now()) hits.set(key, { count: 1, reset: Date.now() + windowMs });
            else e.count += 1;
        });
        next();
    };
};

module.exports = rateLimit;
