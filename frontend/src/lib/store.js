// Store rules. These mirror backend/config/store.js; the server is the source of truth
// for prices and totals, these are only used to show estimates in the UI.
export const STORE_NAME = 'NovaCart';
export const DELIVERY_FEE = 150;
export const FREE_DELIVERY_THRESHOLD = 3000;
export const MAX_QTY_PER_ITEM = 20;
export const DELIVERY_WINDOWS = ['09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', '18:00 - 21:00'];
export const ORDER_FLOW = ['processing', 'confirmed', 'shipped', 'delivered'];
export const CANCELLABLE = ['processing', 'confirmed'];
export const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad'];
export const SUPPORT_PHONE = '+92 42 3578 1190';
export const SUPPORT_EMAIL = 'help@novacart.pk';
export const SUPPORT_WHATSAPP = '+92 321 4478 190';

export const deliveryFeeFor = (subtotal) => (subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE);

// Category metadata used for navigation and imagery. Names match product.category in the DB.
export const CATEGORIES = [
  { name: 'Fruits', slug: 'fruits', icon: 'fa-apple-whole', image: '/images/cat-fruits.jpg', blurb: 'Seasonal fruit from Swat, Sargodha and Multan orchards.' },
  { name: 'Vegetables', slug: 'vegetables', icon: 'fa-carrot', image: '/images/cat-vegetables.jpg', blurb: 'Picked at dawn, at your door the same day.' },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: 'fa-egg', image: '/images/cat-dairy-eggs.jpg', blurb: 'Full-cream milk, farm eggs and proper cheese.' },
  { name: 'Meat & Seafood', slug: 'meat-seafood', icon: 'fa-fish', image: '/images/cat-meat-seafood.jpg', blurb: 'Halal cuts and fish from the morning catch.' },
  { name: 'Bakery', slug: 'bakery', icon: 'fa-bread-slice', image: '/images/cat-bakery.jpg', blurb: 'Baked overnight, delivered soft.' },
  { name: 'Pantry', slug: 'pantry', icon: 'fa-jar', image: '/images/cat-pantry.jpg', blurb: 'Rice, atta, spices and the jars you always run out of.' },
  { name: 'Beverages', slug: 'beverages', icon: 'fa-mug-hot', image: '/images/cat-beverages.jpg', blurb: 'Tea, coffee, juice and water by the case.' },
  { name: 'Snacks', slug: 'snacks', icon: 'fa-cookie', image: '/images/cat-snacks.jpg', blurb: 'Cookies, chocolate and nuts for the 4 pm slump.' }
];

export const categoryBySlug = (slug) => CATEGORIES.find(c => c.slug === slug);
export const categoryByName = (name) => CATEGORIES.find(c => c.name === name);

// Next 4 delivery days, starting today if it is before 6 pm.
export const deliveryDays = (now = new Date()) => {
  const start = new Date(now);
  if (now.getHours() >= 18) start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 4 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

// Windows still bookable for a given day (at least 2 hours ahead).
export const windowsFor = (day, now = new Date()) =>
  DELIVERY_WINDOWS.filter(w => {
    const startHour = parseInt(w.slice(0, 2), 10);
    const slot = new Date(day);
    slot.setHours(startHour, 0, 0, 0);
    return slot.getTime() - now.getTime() >= 2 * 3600 * 1000;
  });
