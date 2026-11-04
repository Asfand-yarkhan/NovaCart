// NovaCart shopping assistant.
// A deterministic intent engine over the live catalogue and the shopper's own orders:
// no external AI service or API key needed. It understands product search with price and
// category filters, local (Urdu) names, typos and quantities, basket actions, checkout,
// order tracking / cancelling / reordering, and store questions (delivery, payment, returns).
//
// Response shape:
// { reply, products?, orders?, actions?, confirm?, links?, quickReplies? }
//   actions: [{ type: 'add_to_cart' | 'remove_from_cart' | 'open_cart', productId?, quantity? }]
//   confirm: { type: 'cancel_order', orderId, label }   (the widget asks before acting)
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
    DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, DELIVERY_WINDOWS, CANCELLABLE_BY_CUSTOMER, MAX_QTY_PER_ITEM
} = require('../config/store');

const rs = (n) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;
const STATUS_TEXT = {
    processing: 'being prepared',
    confirmed: 'confirmed and queued for packing',
    shipped: 'out for delivery with a rider',
    delivered: 'delivered',
    cancelled: 'cancelled'
};

// ───────────────── Language helpers ─────────────────
const SYNONYMS = {
    aloo: 'potatoes', alu: 'potatoes', potato: 'potatoes',
    pyaz: 'onions', piyaz: 'onions', onion: 'onions',
    tamatar: 'tomatoes', tomato: 'tomatoes', tomatos: 'tomatoes',
    doodh: 'milk', dudh: 'milk',
    anda: 'eggs', anday: 'eggs', ande: 'eggs', egg: 'eggs',
    chawal: 'rice', chaawal: 'rice', basmati: 'rice',
    chai: 'tea', patti: 'tea',
    murgi: 'chicken', murghi: 'chicken',
    gosht: 'beef', meat: 'meat', mutton: 'bbq',
    machli: 'fish', machhli: 'fish', fish: 'fish',
    jhinga: 'prawns', shrimp: 'prawns', shrimps: 'prawns',
    kela: 'bananas', kele: 'bananas', banana: 'bananas',
    seb: 'apples', saib: 'apples', apple: 'apples',
    aam: 'mangoes', mango: 'mangoes', mangos: 'mangoes',
    keenu: 'kinnow', kinoo: 'kinnow', orange: 'kinnow', oranges: 'kinnow',
    angoor: 'grapes', grape: 'grapes',
    tarbooz: 'watermelon',
    nimbu: 'lemons', lemon: 'lemons',
    palak: 'spinach',
    lehsan: 'garlic', lahsan: 'garlic',
    kheera: 'cucumbers', khira: 'cucumbers', cucumber: 'cucumbers',
    shimla: 'pepper', capsicum: 'pepper', peppers: 'pepper',
    gobhi: 'cabbage', bandgobhi: 'cabbage',
    gajar: 'carrots', carrot: 'carrots',
    sabzi: 'vegetables', sabzian: 'vegetables', veggies: 'vegetables', veg: 'vegetables',
    phal: 'fruits', fruit: 'fruits',
    roti: 'bread', doubleroti: 'bread', loaf: 'bread',
    makhan: 'butter', makkhan: 'butter',
    dahi: 'yogurt', yoghurt: 'yogurt', curd: 'yogurt',
    paneer: 'cheese', cheez: 'cheese',
    shehad: 'honey', shahad: 'honey',
    badam: 'almonds', almond: 'almonds',
    chana: 'chana', chanay: 'chana', chickpeas: 'chana', chickpea: 'chana',
    masala: 'masala', spices: 'masala', spice: 'masala',
    tel: 'oil', olive: 'olive',
    pani: 'water', paani: 'water',
    juice: 'juice', jus: 'juice',
    coffee: 'coffee', kaafi: 'coffee',
    biscuit: 'cookies', biscuits: 'cookies', cookie: 'cookies',
    chocolate: 'chocolates', chocolates: 'chocolates', mithai: 'chocolates',
    cake: 'cupcakes', cakes: 'cupcakes', cupcake: 'cupcakes',
    croissant: 'croissants'
};

const CATEGORY_WORDS = {
    Fruits: ['fruit', 'fruits', 'phal'],
    Vegetables: ['vegetable', 'vegetables', 'veg', 'veggies', 'sabzi', 'sabzian'],
    'Dairy & Eggs': ['dairy', 'milk products'],
    'Meat & Seafood': ['meat', 'seafood', 'gosht', 'non veg'],
    Bakery: ['bakery', 'baked', 'breads'],
    Pantry: ['pantry', 'grocery staples', 'staples', 'kitchen'],
    Beverages: ['beverage', 'beverages', 'drinks', 'drink'],
    Snacks: ['snack', 'snacks', 'sweet', 'sweets', 'treats', 'dessert', 'desserts', 'meetha']
};

const STOPWORDS = new Set(('a an the some any please pls plz me my i im i\'m we you to of for in on at and or with is are am do does can could would should '
    + 'want wanna need get give show find search look looking buy order add put into cart basket bag have has got like '
    + 'kg g gram grams litre liter l pcs pc piece pieces pack packs dozen box bottle bottles x of from under below less than '
    + 'over above more cheap cheaper cheapest price prices cost costs how much what which is there available stock in-stock '
    + 'rs pkr rupees fresh good best item items product products thing things something chahiye chahye mujhe hai hain ka ki ke '
    + 'do dena de dein kitna kitne kya').split(/\s+/));

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1, couple: 2, ek: 1, do: 2, teen: 3, char: 4, panch: 5 };

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '').replace(/[^a-z0-9.\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const singular = (w) => (w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w);

const editDistance = (a, b) => {
    if (Math.abs(a.length - b.length) > 2) return 3;
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
    }
    return dp[a.length][b.length];
};

const wordsMatch = (q, w) => {
    if (q === w || singular(q) === singular(w)) return true;
    if (q.length >= 4 && w.startsWith(q)) return true;
    const limit = q.length >= 8 ? 2 : q.length >= 5 ? 1 : 0;
    return limit > 0 && editDistance(singular(q), singular(w)) <= limit;
};

const has = (text, ...patterns) => patterns.some(p => (p instanceof RegExp ? p.test(text) : text.includes(p)));

// ───────────────── Catalogue cache ─────────────────
let cache = { at: 0, products: [] };
const catalogue = async () => {
    if (Date.now() - cache.at < 30_000 && cache.products.length) return cache.products;
    const products = await Product.find()
        .select('name slug price compareAtPrice unit stock image category rating numReviews featured description metaKeywords origin')
        .lean();
    cache = {
        at: Date.now(),
        products: products.map(p => ({
            ...p,
            _words: norm(`${p.name} ${p.slug.replace(/-/g, ' ')}`).split(' '),
            _extra: norm(`${p.category} ${p.metaKeywords || ''} ${p.origin || ''}`).split(' ')
        }))
    };
    return cache.products;
};
const card = ({ _words, _extra, description, metaKeywords, ...p }) => p;

// ───────────────── Parsing ─────────────────
function parsePrice(text) {
    const n = (s) => Number(String(s).replace(/,/g, ''));
    let m = text.match(/(?:under|below|less than|upto|up to|max|within|<)\s*(?:rs\.?|pkr)?\s*([\d,]+)/);
    if (m) return { max: n(m[1]) };
    m = text.match(/(?:over|above|more than|min|at least|>)\s*(?:rs\.?|pkr)?\s*([\d,]+)/);
    if (m) return { min: n(m[1]) };
    m = text.match(/(?:between|from)\s*(?:rs\.?)?\s*([\d,]+)\s*(?:and|to|-)\s*(?:rs\.?)?\s*([\d,]+)/);
    if (m) return { min: n(m[1]), max: n(m[2]) };
    if (/\b(cheap|cheapest|budget|sasta|sasti)\b/.test(text)) return { cheap: true };
    return {};
}

function parseCategory(text) {
    for (const [cat, words] of Object.entries(CATEGORY_WORDS)) {
        if (words.some(w => new RegExp(`\\b${w}\\b`).test(text))) return cat;
    }
    return null;
}

function parseQuantity(text) {
    const m = text.match(/\b(\d{1,2})\s*(?:x|×|pcs?|packs?|kg|dozen|bottles?|boxes?|of)?\b/);
    if (m && Number(m[1]) > 0) return Math.min(Number(m[1]), MAX_QTY_PER_ITEM);
    for (const [w, v] of Object.entries(NUMBER_WORDS)) {
        if (new RegExp(`\\b${w}\\b(?!\\s*(?:hour|day|min))`).test(text) && w.length > 2) return v;
    }
    return 1;
}

// Words that identify what the shopper is talking about
function keywords(text) {
    return norm(text)
        .replace(/\bnc-\d{6}-\d{4}\b/g, ' ')
        .replace(/(?:rs\.?|pkr)?\s*\d[\d,]*/g, ' ')
        .split(' ')
        .filter(w => w.length > 1 && !STOPWORDS.has(w))
        .map(w => SYNONYMS[w] || w)
        .flatMap(w => w.split(' '));
}

function scoreProduct(p, terms) {
    let score = 0;
    for (const t of terms) {
        if (p._words.some(w => w === t || singular(w) === singular(t))) score += 3;
        else if (p._words.some(w => wordsMatch(t, w))) score += 2;
        else if (p._extra.some(w => wordsMatch(t, w))) score += 1;
    }
    return score;
}

async function searchProducts(text, { limit = 6 } = {}) {
    const products = await catalogue();
    const terms = keywords(text);
    const price = parsePrice(text);
    const category = parseCategory(text);
    // "Is X available?" is a question about X, not a filter, so sold-out items can still be reported
    const inStockOnly = /\b(in stock|available)\b/.test(text) && !/^(is|are|do|does|kya)\b/.test(text);

    let list = products;
    if (category) list = list.filter(p => p.category === category);
    if (price.max) list = list.filter(p => p.price <= price.max);
    if (price.min) list = list.filter(p => p.price >= price.min);
    if (inStockOnly) list = list.filter(p => p.stock > 0);

    // Category words alone ("show me fruits") should not also be required to match product names
    const categoryTerms = new Set(Object.values(CATEGORY_WORDS).flat().map(w => SYNONYMS[w] || w));
    const nameTerms = terms.filter(t => !(category && categoryTerms.has(t)));

    let scored;
    if (nameTerms.length) {
        scored = list.map(p => ({ p, s: scoreProduct(p, nameTerms) })).filter(x => x.s > 0);
        const best = Math.max(0, ...scored.map(x => x.s));
        // An exact name hit (3 points a term) beats fuzzy neighbours, e.g. potatoes for "tomatos"
        scored = scored.filter(x => x.s >= (best >= 3 ? best : 1));
    } else {
        scored = list.map(p => ({ p, s: 0 }));
    }
    scored.sort((a, b) => (b.s - a.s)
        || (price.cheap ? a.p.price - b.p.price : 0)
        || ((b.p.stock > 0) - (a.p.stock > 0))
        || (b.p.rating - a.p.rating));

    return {
        products: scored.slice(0, limit).map(x => x.p),
        total: scored.length,
        terms: nameTerms,
        price,
        category,
        exact: scored.length > 0 && scored[0].s >= 3 * Math.max(1, nameTerms.length) - 1
    };
}

const describeFilters = ({ price, category }) => [
    category && `in ${category}`,
    price.max && `under ${rs(price.max)}`,
    price.min && `over ${rs(price.min)}`,
    price.cheap && 'cheapest first'
].filter(Boolean).join(', ');

// ───────────────── Orders ─────────────────
const orderSummary = (o) => ({
    _id: o._id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    createdAt: o.createdAt,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    images: o.items.slice(0, 3).map(i => i.image),
    deliverySlot: o.deliverySlot,
    canCancel: CANCELLABLE_BY_CUSTOMER.includes(o.status)
});

const signInFirst = (what) => ({
    reply: `Sign in and I can ${what}. Your basket is kept when you do.`,
    links: [{ label: 'Sign in', to: '/login' }, { label: 'Create an account', to: '/signup' }],
    quickReplies: ['Delivery times', 'Show me deals']
});

const slotText = (o) => {
    if (!o.deliverySlot?.window) return '';
    const d = o.deliverySlot.date ? new Date(o.deliverySlot.date) : null;
    const day = d ? d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Karachi' }) : '';
    return ` Delivery slot: ${day ? `${day}, ` : ''}${o.deliverySlot.window}.`;
};

async function trackOrders(user, text) {
    if (!user) return signInFirst('track your orders');
    const num = text.match(/nc-\d{6}-\d{4}/i)?.[0]?.toUpperCase();
    if (num) {
        const o = await Order.findOne({ orderNumber: num, user: user._id }).lean();
        if (!o) return { reply: `I could not find ${num} on your account. Check the number on your confirmation, or open your orders.`, links: [{ label: 'My orders', to: '/orders' }] };
        return {
            reply: `${o.orderNumber} is ${STATUS_TEXT[o.status]}.${o.status === 'cancelled' || o.status === 'delivered' ? '' : slotText(o)} Total ${rs(o.total)}, cash on delivery.`,
            orders: [orderSummary(o)],
            links: [{ label: 'Open order', to: `/orders/${o._id}` }],
            quickReplies: CANCELLABLE_BY_CUSTOMER.includes(o.status) ? [`Cancel ${o.orderNumber}`] : ['Order again']
        };
    }
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5).lean();
    if (!orders.length) {
        return { reply: 'You have not placed an order yet. Want some ideas to start with?', quickReplies: ["This week's picks", 'Show me deals'] };
    }
    const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    if (active.length) {
        const first = active[0];
        return {
            reply: active.length === 1
                ? `Your order ${first.orderNumber} is ${STATUS_TEXT[first.status]}.${slotText(first)}`
                : `You have ${active.length} orders on the way. The latest, ${first.orderNumber}, is ${STATUS_TEXT[first.status]}.`,
            orders: active.map(orderSummary),
            links: [{ label: 'All orders', to: '/orders' }]
        };
    }
    return {
        reply: `Nothing is on the way right now. Your last order, ${orders[0].orderNumber}, was ${STATUS_TEXT[orders[0].status]}.`,
        orders: orders.slice(0, 3).map(orderSummary),
        links: [{ label: 'All orders', to: '/orders' }],
        quickReplies: ['Order again']
    };
}

async function cancelFlow(user, text) {
    if (!user) return signInFirst('cancel an order for you');
    const num = text.match(/nc-\d{6}-\d{4}/i)?.[0]?.toUpperCase();
    const filter = { user: user._id, status: { $in: CANCELLABLE_BY_CUSTOMER } };
    if (num) filter.orderNumber = num;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(3).lean();
    if (!orders.length) {
        return {
            reply: num
                ? `${num} can no longer be cancelled here, it may already be out for delivery. Call us on +92 42 3578 1190 and we will try to stop it.`
                : 'None of your orders can be cancelled right now. Orders can be cancelled until the rider leaves the warehouse.',
            links: [{ label: 'My orders', to: '/orders' }]
        };
    }
    const o = orders[0];
    return {
        reply: `Cancel ${o.orderNumber} (${rs(o.total)}, ${o.items.length} products)? Stock goes back on the shelf and nothing is charged.`,
        orders: orders.map(orderSummary),
        confirm: { type: 'cancel_order', orderId: o._id, label: `Yes, cancel ${o.orderNumber}` }
    };
}

async function reorderFlow(user) {
    if (!user) return signInFirst('reorder your usual basket');
    const last = await Order.findOne({ user: user._id, status: { $ne: 'cancelled' } }).sort({ createdAt: -1 }).lean();
    if (!last) return { reply: 'There is no past order to repeat yet.', quickReplies: ["This week's picks"] };
    const products = await catalogue();
    const lines = last.items
        .map(i => ({ p: products.find(p => String(p._id) === String(i.product)), qty: i.quantity }))
        .filter(x => x.p && x.p.stock > 0);
    if (!lines.length) return { reply: `Everything from ${last.orderNumber} is sold out at the moment.` };
    return {
        reply: `I added ${lines.length} products from ${last.orderNumber} to your basket. Check quantities before you pay.`,
        products: lines.map(x => card(x.p)),
        actions: [...lines.map(x => ({ type: 'add_to_cart', productId: x.p._id, quantity: x.qty })), { type: 'open_cart' }]
    };
}

// ───────────────── Basket ─────────────────
function basketSummary(cart = []) {
    const lines = cart.filter(l => l && l.quantity > 0);
    if (!lines.length) {
        return { reply: 'Your basket is empty. Tell me what you need, for example "2 kg potatoes and a dozen eggs".', quickReplies: ["This week's picks", 'Show me deals', 'Fruits'] };
    }
    const subtotal = lines.reduce((s, l) => s + (l.price || 0) * l.quantity, 0);
    const fee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
    const list = lines.slice(0, 6).map(l => `${l.quantity} × ${l.name}`).join(', ');
    return {
        reply: `You have ${list}${lines.length > 6 ? ` and ${lines.length - 6} more` : ''}. Subtotal ${rs(subtotal)}. `
            + (fee ? `Add ${rs(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery.` : 'Delivery is free on this basket.'),
        actions: [{ type: 'open_cart' }],
        links: [{ label: 'Checkout', to: '/checkout' }]
    };
}

// ───────────────── Store knowledge ─────────────────
const KNOWLEDGE = [
    {
        test: /\b(deliver|delivery|shipping|ship|slot|window|when.*(arrive|come)|how long|same day|areas?|cities|city|lahore|karachi|islamabad|rawalpindi|faisalabad)\b/,
        answer: () => ({
            reply: `We deliver in Lahore, Karachi, Islamabad, Rawalpindi and Faisalabad. Pick a three-hour window at checkout (${DELIVERY_WINDOWS.join(', ')}). Order before 6 pm for same-day delivery. Delivery is ${rs(DELIVERY_FEE)}, or free over ${rs(FREE_DELIVERY_THRESHOLD)}.`,
            links: [{ label: 'Delivery and returns', to: '/faq#delivery' }],
            quickReplies: ['How do I pay?', 'Track my order']
        })
    },
    {
        test: /\b(pay|payment|cash|cod|card|jazzcash|easypaisa|bank|transfer|visa|mastercard)\b/,
        answer: () => ({
            reply: 'Payment is cash on delivery. Check your bag at the door, then pay the rider. Riders carry change for up to Rs 5,000. Card payments are coming soon.',
            links: [{ label: 'Payments', to: '/faq#payments' }]
        })
    },
    {
        test: /\b(return|refund|replace|replacement|damaged|bruised|rotten|missing|wrong item|complain|complaint|quality|bad)\b/,
        answer: () => ({
            reply: 'Sorry about that. Hand the item back to the rider, or send a photo on WhatsApp (+92 321 4478 190) within 24 hours and we will refund or replace it on your next order. Unopened packaged goods can be returned within 7 days.',
            links: [{ label: 'Contact support', to: '/contact' }, { label: 'Returns policy', to: '/faq#returns' }]
        })
    },
    {
        test: /\b(contact|human|agent|person|support|call|phone|whatsapp|email|talk to)\b/,
        answer: () => ({
            reply: 'You can reach a person every day from 8 am to 10 pm: WhatsApp +92 321 4478 190 (fastest), call +92 42 3578 1190, or email help@novacart.pk.',
            links: [{ label: 'Contact page', to: '/contact' }]
        })
    },
    {
        test: /\b(account|password|sign ?in|log ?in|sign ?up|register|forgot)\b/,
        answer: (user) => ({
            reply: user
                ? `You are signed in as ${user.name.split(' ')[0]}. You can update your details, address and password on the account page.`
                : 'You can shop without an account, then sign in at checkout. Create one with your email (we send a confirmation link) or with Google.',
            links: user ? [{ label: 'Account', to: '/account' }] : [{ label: 'Sign in', to: '/login' }, { label: 'Create account', to: '/signup' }]
        })
    },
    {
        test: /\b(open|opening|hours|timing|timings|time)\b/,
        answer: () => ({ reply: 'Support is open every day from 8 am to 10 pm, and deliveries run from 9 am to 9 pm.' })
    },
    {
        test: /\b(halal|organic|fresh|source|sourcing|where.*from|farm|mandi)\b/,
        answer: () => ({
            reply: 'All meat is halal and cut to order. Our buyers are at the mandi by 5 am, so fruit and vegetables usually reach you the same day they are bought. Each product page shows where it comes from.',
            links: [{ label: 'How we source', to: '/about' }]
        })
    }
];

const MENU = ['Track my order', "This week's picks", 'Show me deals', "What's in my basket?", 'Delivery times'];

// ───────────────── Main handler ─────────────────
async function respond(rawMessage, { user, cart }) {
    const text = norm(rawMessage);
    if (!text) return { reply: 'Ask me about products, your basket or an order.', quickReplies: MENU };

    // Small talk
    if (/^(hi+|hello|hey|salam|salaam|assalam.*|aoa|asalam.*|good (morning|afternoon|evening))\b/.test(text) && text.split(' ').length <= 4) {
        const name = user?.name?.split(' ')[0];
        return { reply: `${name ? `Hi ${name}` : 'Hi'}, I am the NovaCart assistant. I can find products, fill your basket, and track or cancel orders. What do you need today?`, quickReplies: MENU };
    }
    if (/^(thanks|thank you|thx|shukriya|jazakallah|ok|okay|great|nice|cool|bye|goodbye|khuda hafiz|allah hafiz)\b/.test(text) && text.split(' ').length <= 4) {
        return { reply: 'Happy to help. I am here if you need anything else.', quickReplies: ["What's in my basket?", 'Checkout'] };
    }
    if (has(text, /\b(help|what can you do|how does this work|menu|options)\b/)) {
        return {
            reply: 'Here is what I can do: search the shop ("cheap fruit under 400", "do you have salmon?"), add or remove items ("add 2 dozen eggs"), show your basket and take you to checkout, track, cancel or repeat orders, and answer questions about delivery, payment and returns.',
            quickReplies: MENU
        };
    }

    // Orders
    if (/^(keep (it|my order)|dont cancel|do not cancel|never ?mind|no thanks?)\b/.test(text)) {
        return { reply: 'No problem, your order stays as it is.', quickReplies: ['Track my order', "What's in my basket?"] };
    }
    if (has(text, /\bcancel\b/)) return cancelFlow(user, text);
    if (has(text, /\b(order again|reorder|re-order|repeat (my )?(last )?order|same as last time|buy again)\b/)) return reorderFlow(user);
    if (has(text, /\b(track|tracking|where is|wheres|status|my orders?|order status|kab aayega|kahan hai)\b/, /nc-\d{6}-\d{4}/)) return trackOrders(user, text);

    // Basket
    if (has(text, /\b(checkout|check out|place (the |my )?order|pay now|proceed)\b/)) {
        const summary = basketSummary(cart);
        if (!cart?.length) return summary;
        return { ...summary, reply: `${summary.reply} Ready when you are.`, links: [{ label: 'Go to checkout', to: '/checkout' }], actions: [] };
    }
    if (has(text, /\b(my (cart|basket|bag)|in my (cart|basket|bag)|whats in|what is in|show (my )?(cart|basket)|view (cart|basket)|basket total|cart total)\b/)) {
        return basketSummary(cart);
    }
    const removing = /\b(remove|delete|take out|drop|nikal|hatao)\b/.test(text);
    if (removing) {
        const terms = keywords(text);
        const lines = (cart || []).filter(l => terms.some(t => norm(l.name).split(' ').some(w => wordsMatch(t, w))));
        if (!lines.length) return { reply: 'I could not find that in your basket.', actions: [{ type: 'open_cart' }] };
        return {
            reply: `Removed ${lines.map(l => l.name).join(' and ')} from your basket.`,
            actions: lines.map(l => ({ type: 'remove_from_cart', productId: l.productId }))
        };
    }

    // Store questions (checked before product search so "do you deliver to Karachi" is not a product search)
    const asksAboutProduct = /\b(do you have|got any|price of|how much|kitne ka|kitna)\b/.test(text)
        || /^(is|are|kya)\b.*\b(available|in stock|there)\b/.test(text);
    if (!asksAboutProduct) {
        for (const k of KNOWLEDGE) if (k.test.test(text)) return k.answer(user);
    }

    // Deals and recommendations
    if (has(text, /\b(deal|deals|sale|discount|offer|offers|promo|cheap deals|kam qeemat)\b/)) {
        const products = (await catalogue()).filter(p => p.compareAtPrice > p.price && p.stock > 0)
            .sort((a, b) => (b.compareAtPrice - b.price) / b.compareAtPrice - (a.compareAtPrice - a.price) / a.compareAtPrice);
        return {
            reply: products.length ? `${products.length} products are on offer this week. Prices hold until stock runs out or Sunday night.` : 'No deals running right now. Check back on Friday.',
            products: products.slice(0, 6).map(card),
            links: [{ label: 'All deals', to: '/shop?onSale=true' }]
        };
    }
    if (has(text, /\b(recommend|suggest|popular|best ?sellers?|top rated|picks|whats good|what is good|featured|favourites?|favorites?)\b/)) {
        const category = parseCategory(text);
        let products = (await catalogue()).filter(p => p.stock > 0 && (!category || p.category === category));
        products = products.sort((a, b) => (b.featured - a.featured) || (b.rating - a.rating) || (b.numReviews - a.numReviews));
        return {
            reply: category ? `The most loved ${category.toLowerCase()} right now:` : 'This week\'s picks, chosen by our buyers at the mandi:',
            products: products.slice(0, 6).map(card),
            links: [{ label: 'Shop everything', to: category ? `/shop?category=${encodeURIComponent(category)}` : '/shop' }]
        };
    }

    // Adding to basket: "add 2 bananas", "I want a dozen eggs", "buy milk"
    const adding = /\b(add|put|i want|i need|want|need|buy|get me|order|daal do|dal do|chahiye)\b/.test(text);
    const found = await searchProducts(text);

    if (adding && found.products.length) {
        const top = found.products[0];
        const clear = found.products.length === 1 || found.exact;
        if (clear) {
            if (top.stock <= 0) {
                const alt = found.products.filter(p => p.stock > 0 && p._id !== top._id);
                return { reply: `${top.name} is sold out today.${alt.length ? ' These are in stock:' : ' We restock most items every morning.'}`, products: (alt.length ? alt : [top]).slice(0, 4).map(card) };
            }
            const qty = Math.min(parseQuantity(text), top.stock);
            return {
                reply: `Added ${qty} × ${top.name} (${top.unit}) to your basket, ${rs(top.price * qty)}.`,
                products: [card(top)],
                actions: [{ type: 'add_to_cart', productId: top._id, quantity: qty }],
                quickReplies: ["What's in my basket?", 'Checkout', `More ${top.category.toLowerCase()}`]
            };
        }
        return {
            reply: `Which one would you like? Tap Add on the right one.`,
            products: found.products.map(card)
        };
    }

    // "More fruits" style follow-ups
    const more = text.match(/^more (.+)$/);
    const query = more ? more[1] : text;
    const result = more ? await searchProducts(query) : found;

    if (result.products.length) {
        const top = result.products[0];
        const filters = describeFilters(result);
        if (asksAboutProduct && (result.exact || result.products.length === 1)) {
            return {
                reply: top.stock > 0
                    ? `Yes, ${top.name} (${top.unit}) is ${rs(top.price)}${top.compareAtPrice > top.price ? `, down from ${rs(top.compareAtPrice)}` : ''}. ${top.stock <= 5 ? `Only ${top.stock} left.` : 'In stock.'}`
                    : `${top.name} is sold out today. We restock most items every morning.`,
                products: [card(top)],
                quickReplies: top.stock > 0 ? [`Add ${top.name.toLowerCase()}`] : ['Show me alternatives']
            };
        }
        return {
            reply: result.total > result.products.length
                ? `I found ${result.total} products${filters ? ` ${filters}` : ''}. Here are the best matches:`
                : `Here ${result.total === 1 ? 'is what I found' : `are ${result.total} matches`}${filters ? ` ${filters}` : ''}:`,
            products: result.products.map(card),
            links: [{ label: 'See all in the shop', to: `/shop?${new URLSearchParams({
                ...(result.terms.length && { q: result.terms.join(' ') }),
                ...(result.category && { category: result.category }),
                ...(result.price.max && { maxPrice: result.price.max }),
                ...(result.price.min && { minPrice: result.price.min }),
                ...(result.price.cheap && { sort: 'price-asc' })
            }).toString()}` }]
        };
    }

    if (keywords(text).length) {
        return {
            reply: `I could not find "${rawMessage.trim().slice(0, 40)}" in the shop. Try a simpler word like "mango" or "rice", or ask for a category.`,
            quickReplies: ['Fruits', 'Vegetables', 'Pantry', 'Show me deals']
        };
    }
    return { reply: 'I did not quite catch that. You can ask me to find products, show your basket, or track an order.', quickReplies: MENU };
}

// @route POST /api/assistant  { message, cart?: [{ productId, name, price, quantity }] }
const chat = async (req, res) => {
    const message = String(req.body?.message || '').slice(0, 300);
    const cart = Array.isArray(req.body?.cart) ? req.body.cart.slice(0, 50) : [];
    const result = await respond(message, { user: req.user || null, cart });
    res.json(result);
};

module.exports = { chat, respond, _test: { keywords, parsePrice, parseQuantity, searchProducts } };
