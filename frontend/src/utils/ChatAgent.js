// ChatAgent.js — Client-side intelligence layer for NovaCart chatbot

const API_BASE = 'http://localhost:5000/api';

/**
 * Send a message to the chatbot API and receive a structured response.
 * @param {string} message - User's message
 * @param {Array} context - Recent conversation context (optional)
 * @returns {Promise<Object>} — { intent, text, products?, action?, quickReplies? }
 */
export const sendMessage = async (message, context = []) => {
    const token = localStorage.getItem('novacart_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_BASE}/chatbot/query`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message, context: context.slice(-6) })
        });
        if (!res.ok) throw new Error('Server error');
        return await res.json();
    } catch (err) {
        // Offline fallback — rule-based client-side responses
        return offlineFallback(message);
    }
};

/**
 * Fetch autocomplete suggestions for the given query prefix.
 * @param {string} q - Query prefix
 * @returns {Promise<Array>} — Array of suggestion objects
 */
export const fetchSuggestions = async (q) => {
    if (!q || q.trim().length < 2) return [];
    try {
        const res = await fetch(`${API_BASE}/chatbot/suggestions?q=${encodeURIComponent(q.trim())}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.suggestions || [];
    } catch {
        return [];
    }
};

/**
 * Offline fallback — basic responses when the backend is unreachable
 */
const offlineFallback = (message) => {
    const msg = message.toLowerCase();
    if (/hi|hello|hey/.test(msg)) {
        return { intent: 'greeting', text: "👋 Hi! I'm Nova, NovaCart's assistant. It seems I'm having trouble connecting. Please check your internet connection and try again!", quickReplies: [] };
    }
    if (/ship|deliver/.test(msg)) {
        return { intent: 'faq', text: "🚚 **Shipping:** Standard delivery takes 3-5 days at ₨150. Free shipping above ₨2,000!", quickReplies: ['More questions'] };
    }
    if (/return|refund/.test(msg)) {
        return { intent: 'faq', text: "🔄 **Returns:** 7-day return window. Items must be unopened. Refund in 3-5 business days.", quickReplies: ['More questions'] };
    }
    if (/payment/.test(msg)) {
        return { intent: 'faq', text: "💳 **Payments:** We accept Credit/Debit cards, Cash on Delivery, JazzCash, and Easypaisa.", quickReplies: ['More questions'] };
    }
    return {
        intent: 'offline',
        text: "⚠️ I'm having trouble connecting to the server. Please try again in a moment!\n\nFor immediate help, visit our **Shop** or **Contact Us** page.",
        quickReplies: ['Go to Shop', 'Contact Us']
    };
};

/**
 * Format a markdown-ish text to safe display content.
 * Converts **bold** and *italic* markers for rendering.
 */
export const parseMarkdown = (text) => {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="nc-chat-link">$1</a>')
        .replace(/\n/g, '<br/>');
};
