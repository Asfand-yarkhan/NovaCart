const express = require('express');
const { createMessage, getMessages, updateMessage, deleteMessage, subscribe } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const contact = express.Router();
contact.post('/', createMessage);
contact.get('/', protect, adminOnly, getMessages);
contact.patch('/:id', protect, adminOnly, updateMessage);
contact.delete('/:id', protect, adminOnly, deleteMessage);

const newsletter = express.Router();
newsletter.post('/', subscribe);

module.exports = { contact, newsletter };
