// Mirrors LOW_STOCK_THRESHOLD in backend/config/store.js
export const LOW_STOCK = 10;

// Primary action label for moving an order to the next step
export const NEXT_ACTION = {
  processing: { status: 'confirmed', label: 'Confirm order', icon: 'fa-check' },
  confirmed: { status: 'shipped', label: 'Send out for delivery', icon: 'fa-truck-fast' },
  shipped: { status: 'delivered', label: 'Mark as delivered', icon: 'fa-box-open' }
};
