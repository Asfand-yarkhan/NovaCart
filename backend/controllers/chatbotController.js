const Product = require('../models/Product');
const Order = require('../models/Order');

// ─── FAQ Knowledge Base ─────────────────────────────────────────────────────
const FAQ = {
    shipping: {
        keywords: ['shipping', 'delivery', 'deliver', 'ship', 'how long', 'how fast', 'days', 'arrives', 'arrival'],
        answer: `🚚 **Shipping Info:**\n\n• **Standard Delivery:** 3-5 business days — ₨150 flat fee\n• **Express Delivery:** 1-2 business days — ₨300\n• **Free Shipping** on orders above ₨2,000\n• We deliver to all major cities in Pakistan including Karachi, Lahore, Islamabad, Rawalpindi, and Peshawar.\n\nOrders placed before **3 PM** are dispatched the same day!`
    },
    returns: {
        keywords: ['return', 'refund', 'exchange', 'money back', 'return policy', 'replace', 'replacement', 'damaged', 'wrong item'],
        answer: `🔄 **Return & Refund Policy:**\n\n• **7-day return window** from delivery date\n• Items must be unused, unopened, and in original packaging\n• **Perishable goods** (fresh produce, dairy) cannot be returned\n• **Refund:** Processed within 3-5 business days to your original payment method\n• **Damaged/Wrong items?** Contact us within 24 hours with a photo — instant replacement!\n\nCall us: 0800-NOVACART or email support@novacart.pk`
    },
    payment: {
        keywords: ['payment', 'pay', 'credit card', 'debit card', 'cash', 'cod', 'bank transfer', 'easypaisa', 'jazzcash', 'online payment', 'method'],
        answer: `💳 **Payment Methods:**\n\n• **Credit/Debit Cards** — Visa, Mastercard (via Stripe)\n• **Cash on Delivery (COD)** — Available citywide\n• **JazzCash** — Mobile wallet\n• **Easypaisa** — Mobile wallet\n• **Bank Transfer** — HBL, UBL, MCB\n\nAll online payments are **100% secure** with SSL encryption. 🔒`
    },
    contact: {
        keywords: ['contact', 'support', 'help', 'customer service', 'email', 'phone', 'call', 'chat', 'reach'],
        answer: `📞 **Contact NovaCart Support:**\n\n• **Phone:** 0800-NOVACART (Free)\n• **Email:** support@novacart.pk\n• **Live Chat:** Available 9 AM – 9 PM (Mon–Sat)\n• **WhatsApp:** +92-300-NOVACART\n\nAverage response time: **under 2 hours** ⚡`
    },
    coupon: {
        keywords: ['coupon', 'discount', 'promo', 'code', 'voucher', 'offer', 'deal', 'sale', 'percentage off'],
        answer: `🎟️ **Discount Coupons:**\n\n• **WELCOME10** — 10% off your first order\n• **SAVE20** — 20% off orders above ₨3,000\n• **FRESH15** — 15% off all fresh produce\n• **FREESHIP** — Free shipping on any order\n\nApply coupons at checkout. Coupons cannot be combined.`
    },
    hours: {
        keywords: ['hours', 'open', 'timing', 'when', 'available', 'working', 'time'],
        answer: `🕐 **Operating Hours:**\n\n• **Delivery:** 7 days a week, 9 AM – 9 PM\n• **Customer Support:** Mon–Sat, 9 AM – 9 PM\n• **Orders:** You can place orders 24/7 online!\n\nPublic holidays may affect delivery timings.`
    }
};

// ─── Intent Patterns ────────────────────────────────────────────────────────
const INTENTS = {
    greeting: /\b(hi|hello|hey|good morning|good evening|good afternoon|howdy|what's up|whats up|yo)\b/i,
    thanks: /\b(thanks|thank you|thank u|thx|ty|appreciate|great|awesome|perfect|wonderful)\b/i,
    bye: /\b(bye|goodbye|see you|later|exit|quit|close|done)\b/i,
    order_track: /\b(order|track|tracking|where is|where's|status|shipped|delivery status|package|parcel|my order|check order|find order|when will|estimate)\b/i,
    cart_add: /\b(add|put|include|throw in|get me|i want|place|insert)\b.*\b(cart|basket|bag|checkout)\b|\badd\b.+\bto\b/i,
    cart_remove: /\b(remove|delete|take out|drop|cancel item|clear)\b.*\b(cart|basket|bag)\b/i,
    cart_view: /\b(show|view|see|what('s| is) in|check|list)\b.*\b(cart|basket|bag)\b|\bmy cart\b/i,
    product_search: /\b(show|find|search|get|look|browse|display|products?|items?|buy|shop|available|list|recommend|suggest)\b/i,
    recommendation: /\b(recommend|suggestion|popular|trending|best|top|rated|featured|what should|what do you|similar)\b/i,
    greeting_bot: /\b(who are you|what are you|what can you do|help|capabilities|features|commands|what do you know)\b/i,
};

// ─── Price Parser ────────────────────────────────────────────────────────────
const parsePrice = (msg) => {
    const under = msg.match(/(?:under|below|less than|cheaper than|max|maximum|budget|up to)\s*(?:rs\.?|pkr|₨|rupees?)?\s*(\d+)/i);
    const over = msg.match(/(?:above|over|more than|at least|minimum|min|from)\s*(?:rs\.?|pkr|₨|rupees?)?\s*(\d+)/i);
    const between = msg.match(/between\s*(?:rs\.?|pkr|₨|rupees?)?\s*(\d+)\s*(?:and|to|-)\s*(?:rs\.?|pkr|₨|rupees?)?\s*(\d+)/i);
    if (between) return { min: Number(between[1]), max: Number(between[2]) };
    if (under) return { max: Number(under[1]) };
    if (over) return { min: Number(over[1]) };
    return null;
};

// ─── Category Keywords ──────────────────────────────────────────────────────
const CATEGORY_MAP = {
    fruit: ['fruit', 'fruits', 'apple', 'banana', 'mango', 'orange', 'grape', 'strawberry', 'watermelon', 'melon', 'peach', 'pear', 'kiwi', 'lemon', 'lime'],
    vegetable: ['vegetable', 'vegetables', 'veggie', 'veggies', 'tomato', 'potato', 'onion', 'garlic', 'carrot', 'pea', 'spinach', 'broccoli', 'cucumber', 'pepper', 'lettuce'],
    dairy: ['dairy', 'milk', 'cheese', 'butter', 'yogurt', 'cream', 'curd', 'ghee', 'paneer', 'lassi'],
    bakery: ['bakery', 'bread', 'bun', 'cake', 'biscuit', 'cookie', 'pastry', 'rusk', 'toast', 'pita'],
    meat: ['meat', 'chicken', 'beef', 'mutton', 'fish', 'seafood', 'prawn', 'lamb', 'turkey', 'egg'],
    grocery: ['grocery', 'rice', 'flour', 'sugar', 'salt', 'oil', 'lentil', 'dal', 'spice', 'sauce', 'ketchup', 'pasta', 'noodle', 'cereal'],
    beverage: ['beverage', 'drink', 'juice', 'water', 'soda', 'cola', 'tea', 'coffee', 'smoothie', 'soft drink'],
    snack: ['snack', 'chips', 'crisp', 'popcorn', 'nuts', 'chocolate', 'candy', 'sweet', 'candy', 'toffee'],
};

const detectCategory = (msg) => {
    const lower = msg.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(kw => lower.includes(kw))) return cat;
    }
    return null;
};

// ─── Format Helpers ──────────────────────────────────────────────────────────
const detectFAQ = (msg) => {
    const lower = msg.toLowerCase();
    for (const [key, data] of Object.entries(FAQ)) {
        if (data.keywords.some(kw => lower.includes(kw))) return data.answer;
    }
    return null;
};

const formatOrderTimeline = (order) => {
    const steps = ['processing', 'confirmed', 'shipped', 'delivered'];
    const statusIdx = steps.indexOf(order.status);
    const icons = ['🔄', '✅', '🚚', '📦'];
    const labels = ['Processing', 'Confirmed', 'Shipped', 'Delivered'];

    let timeline = `📋 **Order #${order._id.toString().slice(-8).toUpperCase()}**\n`;
    timeline += `📅 Placed: ${new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}\n`;
    timeline += `💰 Total: ₨${order.total.toLocaleString()}\n\n`;
    timeline += `**Tracking Timeline:**\n`;

    steps.forEach((step, i) => {
        const done = i <= statusIdx;
        const current = i === statusIdx;
        timeline += `${done ? icons[i] : '⬜'} ${labels[i]}${current ? ' ← *Current*' : ''}\n`;
    });

    if (order.status === 'cancelled') {
        timeline += `\n❌ **Order Cancelled**`;
    }

    timeline += `\n\n**Items (${order.items.length}):**\n`;
    order.items.slice(0, 3).forEach(item => {
        timeline += `• ${item.name} × ${item.quantity} — ₨${item.price}\n`;
    });
    if (order.items.length > 3) timeline += `• ...and ${order.items.length - 3} more items\n`;

    return timeline;
};

// ─── Main Query Handler ──────────────────────────────────────────────────────
const handleQuery = async (req, res) => {
    try {
        const { message, context = [] } = req.body;
        const userId = req.user?._id;

        if (!message || !message.trim()) {
            return res.json({ intent: 'error', text: "Please type a message! 😊" });
        }

        const msg = message.trim();
        const lower = msg.toLowerCase();

        // ─── Greeting ───────────────────────────────
        if (INTENTS.greeting.test(lower)) {
            return res.json({
                intent: 'greeting',
                text: `👋 Hello! Welcome to **NovaCart** — your freshest grocery experience!\n\nI can help you:\n• 🔍 **Search products** — "show me fruits under ₨500"\n• 🛒 **Manage cart** — "add milk to cart"\n• 📦 **Track orders** — "where is my order?"\n• ❓ **Answer questions** — shipping, returns, payments\n• 💡 **Recommend products** — "what's trending?"\n\nWhat can I help you with today?`,
                quickReplies: ['🔍 Search Products', '📦 Track Order', '💳 Payment Methods', '🚚 Shipping Info']
            });
        }

        // ─── Bot Identity ───────────────────────────
        if (INTENTS.greeting_bot.test(lower)) {
            return res.json({
                intent: 'identity',
                text: `🤖 I'm **Nova**, NovaCart's AI Shopping Assistant!\n\nHere's what I can do:\n\n**🛍️ Shopping**\n• Search for products by name, category, or price\n• Get product recommendations\n• Add/remove items from your cart\n\n**📦 Orders**\n• Track your order status in real-time\n• View order history summary\n\n**❓ Support**\n• Shipping & delivery info\n• Return & refund policy\n• Payment methods\n• Apply discount coupons\n\nJust type naturally and I'll understand! Try: *"show me vegetables under ₨200"*`,
                quickReplies: ['Show trending products', 'Track my order', 'Return policy', 'Shipping info']
            });
        }

        // ─── Thanks ──────────────────────────────────
        if (INTENTS.thanks.test(lower)) {
            return res.json({
                intent: 'thanks',
                text: `😊 You're welcome! Happy shopping at **NovaCart**!\n\nAnything else I can help you with?`,
                quickReplies: ['Browse products', 'Track my order', 'Contact support']
            });
        }

        // ─── Goodbye ─────────────────────────────────
        if (INTENTS.bye.test(lower)) {
            return res.json({
                intent: 'bye',
                text: `👋 Goodbye! Have a wonderful day!\n\nDon't forget to check out our **daily fresh deals** next time you shop at NovaCart! 🛒✨`,
                closeChat: true
            });
        }

        // ─── FAQ ──────────────────────────────────────
        const faqAnswer = detectFAQ(lower);
        if (faqAnswer) {
            return res.json({
                intent: 'faq',
                text: faqAnswer,
                quickReplies: ['Browse products', 'Track my order', 'Other questions']
            });
        }

        // ─── Order Tracking ───────────────────────────
        if (INTENTS.order_track.test(lower)) {
            if (!userId) {
                return res.json({
                    intent: 'order_auth_required',
                    text: `🔐 Please **log in** to track your orders.\n\nYou need to be signed in to view your order history and tracking details.`,
                    action: { type: 'navigate', url: '/login' }
                });
            }

            // Check if specific order ID was mentioned
            const orderIdMatch = msg.match(/[a-f0-9]{24}/i) || msg.match(/#([a-f0-9]{8,})/i);
            try {
                if (orderIdMatch) {
                    const orderId = orderIdMatch[0].replace('#', '');
                    const order = await Order.findOne({ _id: orderId, user: userId });
                    if (!order) {
                        return res.json({ intent: 'order_not_found', text: `❌ I couldn't find that order. Please check the ID and try again.\n\nYou can view all your orders by visiting the **Orders** page.`, action: { type: 'navigate', url: '/orders' } });
                    }
                    return res.json({ intent: 'order_track', text: formatOrderTimeline(order), orderId: order._id });
                }

                const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(3);
                if (!orders.length) {
                    return res.json({ intent: 'no_orders', text: `📭 You haven't placed any orders yet!\n\nStart shopping and your orders will appear here. Our fresh produce arrives daily! 🥦🍎`, quickReplies: ['Browse products', 'Shop now'], action: { type: 'navigate', url: '/shop' } });
                }

                const latest = orders[0];
                let text = formatOrderTimeline(latest);
                if (orders.length > 1) {
                    text += `\n\n📋 You have **${orders.length}** recent orders. Visit your **Orders page** for full history.`;
                }
                return res.json({ intent: 'order_track', text, orderId: latest._id, action: { type: 'navigate', url: '/orders', label: 'View All Orders' } });
            } catch (e) {
                return res.json({ intent: 'order_error', text: `⚠️ I had trouble fetching your orders. Please try the **Orders page** directly.`, action: { type: 'navigate', url: '/orders' } });
            }
        }

        // ─── Cart View ────────────────────────────────
        if (INTENTS.cart_view.test(lower)) {
            return res.json({
                intent: 'cart_view',
                text: `🛒 Opening your cart...`,
                action: { type: 'navigate', url: '/cart', label: 'View Cart' }
            });
        }

        // ─── Cart Add ────────────────────────────────
        if (INTENTS.cart_add.test(lower)) {
            const productName = msg
                .replace(/^(add|put|get me|i want|include|insert|throw in)\s*/i, '')
                .replace(/\s+(to|in|into|my)?\s*(cart|basket|bag).*$/i, '')
                .replace(/^\s+|\s+$/g, '');

            if (productName.length > 1) {
                try {
                    const products = await Product.find({
                        name: { $regex: productName, $options: 'i' }
                    }).limit(3);

                    if (products.length) {
                        return res.json({
                            intent: 'cart_add',
                            text: `🛒 Found **${products.length}** product(s) matching "${productName}". Tap **Add to Cart** to add one:`,
                            products: products.map(p => ({
                                _id: p._id, name: p.name, price: p.price, image: p.image,
                                category: p.category, slug: p.slug, stock: p.stock
                            })),
                            cartAction: 'add'
                        });
                    } else {
                        return res.json({ intent: 'cart_add_notfound', text: `😕 I couldn't find any product matching **"${productName}"**.\n\nTry searching with a different name or browse our categories!`, quickReplies: ['Browse all products', 'Show categories'], action: { type: 'navigate', url: '/shop', label: 'Go to Shop' } });
                    }
                } catch (e) {
                    return res.json({ intent: 'error', text: `⚠️ Something went wrong searching for "${productName}". Please try again!` });
                }
            }
            return res.json({ intent: 'cart_add_help', text: `🛒 What would you like to add to your cart?\n\nJust say: *"add milk to cart"* or *"add 2 kg apples"*` });
        }

        // ─── Cart Remove ──────────────────────────────
        if (INTENTS.cart_remove.test(lower)) {
            return res.json({
                intent: 'cart_remove',
                text: `🗑️ To remove items from your cart, visit the **Cart page** where you can manage all your items easily.`,
                action: { type: 'navigate', url: '/cart', label: 'Open Cart' }
            });
        }

        // ─── Product Search ───────────────────────────
        if (INTENTS.product_search.test(lower) || INTENTS.recommendation.test(lower)) {
            const priceFilter = parsePrice(lower);
            const category = detectCategory(lower);

            // Extract search term - remove intent words
            let searchTerm = msg
                .replace(/\b(show me|show|find me|find|search for|search|get me|get|look for|browse|display|buy|shop for|can you|please|i need|i want|i'd like|products?|items?)\b/gi, '')
                .replace(/\b(recommend|suggestions?|popular|trending|best|top rated|featured|what should i buy)\b/gi, '')
                .replace(/\b(under|below|less than|cheaper than|max|maximum|budget|above|over|more than|at least|min|minimum|between|and|to)\b\s*(?:rs\.?|pkr|₨|rupees?)?\s*\d+/gi, '')
                .replace(/\b(rs\.?|pkr|₨|rupees?)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();

            const query = {};
            if (priceFilter?.min) query.price = { ...(query.price || {}), $gte: priceFilter.min };
            if (priceFilter?.max) query.price = { ...(query.price || {}), $lte: priceFilter.max };
            if (category) query.category = { $regex: category, $options: 'i' };
            if (searchTerm && searchTerm.length > 1 && !category) {
                query.$or = [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { category: { $regex: searchTerm, $options: 'i' } },
                    { description: { $regex: searchTerm, $options: 'i' } }
                ];
            }

            const isTrending = INTENTS.recommendation.test(lower) && !INTENTS.product_search.test(lower);
            const products = await Product.find(isTrending && Object.keys(query).length === 0 ? {} : query)
                .limit(6)
                .sort(isTrending ? { createdAt: -1 } : { price: priceFilter?.max ? 1 : -1 });

            if (!products.length) {
                let filterDesc = [];
                if (category) filterDesc.push(`in "${category}"`);
                if (priceFilter?.max) filterDesc.push(`under ₨${priceFilter.max}`);
                if (priceFilter?.min) filterDesc.push(`above ₨${priceFilter.min}`);
                const filterStr = filterDesc.length ? ` ${filterDesc.join(' ')}` : '';

                return res.json({
                    intent: 'no_results',
                    text: `😕 No products found${searchTerm ? ` for **"${searchTerm}"**` : ''}${filterStr}.\n\nTry adjusting your search or browse our full catalog!`,
                    quickReplies: ['Show all products', 'Browse categories'],
                    action: { type: 'navigate', url: '/shop', label: 'Browse All' }
                });
            }

            let responseText = `🛍️ Found **${products.length} product${products.length > 1 ? 's' : ''}**`;
            if (searchTerm && searchTerm.length > 1) responseText += ` for "${searchTerm}"`;
            if (category) responseText += ` in ${category}`;
            if (priceFilter?.max) responseText += ` under ₨${priceFilter.max}`;
            if (priceFilter?.min) responseText += ` above ₨${priceFilter.min}`;
            responseText += ':';

            return res.json({
                intent: 'product_search',
                text: responseText,
                products: products.map(p => ({
                    _id: p._id, name: p.name, price: p.price, image: p.image,
                    category: p.category, slug: p.slug, stock: p.stock, description: p.description
                })),
                cartAction: 'add',
                quickReplies: ['Show more', 'Go to shop']
            });
        }

        // ─── Fallback ────────────────────────────────
        return res.json({
            intent: 'fallback',
            text: `🤔 I'm not sure about that. Here's what I can help you with:\n\n• 🔍 **"show me vegetables under ₨300"**\n• 🛒 **"add milk to cart"**\n• 📦 **"where is my order?"**\n• 🚚 **"shipping info"**\n• 🔄 **"return policy"**\n• 💳 **"payment methods"**\n\nOr visit our [**Shop page**](/shop) to browse all products!`,
            quickReplies: ['Search Products', 'Track Order', 'Shipping Info', 'Return Policy']
        });

    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({ intent: 'error', text: '⚠️ Something went wrong. Please try again in a moment!' });
    }
};

// ─── Autocomplete Suggestions ────────────────────────────────────────────────
const getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) return res.json({ suggestions: [] });

        const products = await Product.find({
            name: { $regex: q.trim(), $options: 'i' }
        }).select('name category').limit(5);

        const suggestions = products.map(p => ({
            text: p.name,
            type: 'product',
            category: p.category
        }));

        // Add quick action suggestions
        const actions = ['shipping info', 'return policy', 'payment methods', 'track my order', 'my cart'].filter(a => a.includes(q.toLowerCase()));
        actions.forEach(a => suggestions.unshift({ text: a, type: 'action' }));

        res.json({ suggestions: suggestions.slice(0, 6) });
    } catch (error) {
        res.status(500).json({ suggestions: [] });
    }
};

module.exports = { handleQuery, getSuggestions };
