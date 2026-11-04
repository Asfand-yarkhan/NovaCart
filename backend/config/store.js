// Store-wide business rules. Kept in one place so the API and the frontend agree.
module.exports = {
    CURRENCY: 'PKR',
    DELIVERY_FEE: 150,
    FREE_DELIVERY_THRESHOLD: 3000,
    MAX_QTY_PER_ITEM: 20,
    LOW_STOCK_THRESHOLD: 10,
    DELIVERY_WINDOWS: ['09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', '18:00 - 21:00'],
    ORDER_STATUSES: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    CANCELLABLE_BY_CUSTOMER: ['processing', 'confirmed']
};
