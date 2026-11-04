const Message = require('../models/Message');
const Subscriber = require('../models/Subscriber');
const { httpError } = require('../middleware/errorMiddleware');

// @route POST /api/contact (public)
const createMessage = async (req, res) => {
    const { name, email, subject, orderNumber, message } = req.body || {};
    const doc = await Message.create({ name, email, subject, orderNumber, message });
    res.status(201).json({ message: 'Thanks, we have your message and will reply within one working day.', id: doc._id });
};

// @route GET /api/contact (admin)
const getMessages = async (req, res) => {
    const messages = await Message.find().sort({ createdAt: -1 }).limit(300).lean();
    res.json(messages);
};

// @route PATCH /api/contact/:id (admin) { read }
const updateMessage = async (req, res) => {
    const msg = await Message.findByIdAndUpdate(req.params.id, { read: Boolean(req.body?.read) }, { new: true });
    if (!msg) throw httpError(404, 'Message not found.');
    res.json(msg);
};

// @route DELETE /api/contact/:id (admin)
const deleteMessage = async (req, res) => {
    const msg = await Message.findByIdAndDelete(req.params.id);
    if (!msg) throw httpError(404, 'Message not found.');
    res.json({ message: 'Message deleted.' });
};

// @route POST /api/newsletter (public) { email }
const subscribe = async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Enter a valid email address.', fields: { email: 'Enter a valid email address' } });
    }
    await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
    res.status(201).json({ message: 'You are on the list. Expect one email a week, on Fridays.' });
};

module.exports = { createMessage, getMessages, updateMessage, deleteMessage, subscribe };
