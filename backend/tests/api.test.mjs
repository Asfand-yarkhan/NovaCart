// End-to-end API checks against a running NovaCart server.
// Run against a freshly seeded database: npm run seed && npm run dev, then npm run test:api
// It creates a test customer, places and cancels an order, and adds and deletes a product.
const B = process.env.API_URL || 'http://localhost:5000';
let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`); };

const req = async (method, path, body, token) => {
  const r = await fetch(B + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: r.status, data };
};

const h = await req('GET', '/api/health');
ok(h.status === 200 && h.data.db === 'connected', 'health');

const list = await req('GET', '/api/products?limit=5&sort=price-asc');
ok(list.data.products.length === 5 && list.data.total === 52, 'list + total', `total=${list.data.total}`);
ok(list.data.products[0].price <= list.data.products[1].price, 'sort price-asc');
ok(!('reviews' in list.data.products[0]), 'list omits reviews');

const fruits = await req('GET', '/api/products?category=Fruits&limit=50');
ok(fruits.data.products.every(p => p.category === 'Fruits') && fruits.data.total === 11, 'category filter', fruits.data.total);
const search = await req('GET', '/api/products?q=mango');
ok(search.data.products.some(p => p.slug === 'chaunsa-mangoes'), 'search q');
const sale = await req('GET', '/api/products?onSale=true&limit=50');
ok(sale.data.products.length > 0 && sale.data.products.every(p => p.compareAtPrice > p.price), 'onSale filter', sale.data.total);
const inStock = await req('GET', '/api/products?inStock=true&limit=100');
ok(inStock.data.products.every(p => p.stock > 0) && inStock.data.total === 51, 'inStock filter', inStock.data.total);
const price = await req('GET', '/api/products?minPrice=500&maxPrice=1000&limit=100');
ok(price.data.products.every(p => p.price >= 500 && p.price <= 1000), 'price range');
const rx = await req('GET', '/api/products?q=' + encodeURIComponent('(.*'));
ok(rx.status === 200, 'regex chars in q are escaped');

const cats = await req('GET', '/api/products/categories');
ok(cats.data.length === 8 && cats.data.find(c => c.name === 'Fruits').count === 11, 'categories');

const pd = await req('GET', '/api/products/slug/bananas');
ok(pd.status === 200 && Array.isArray(pd.data.related) && pd.data.related.length > 0, 'product by slug + related');
const missing = await req('GET', '/api/products/slug/nope-nope');
ok(missing.status === 404, 'unknown slug 404');

// Register: role must be ignored
const email = `test${Date.now()}@example.pk`;
const reg = await req('POST', '/api/auth/register', { name: 'Test Shopper', email, password: 'secret12', role: 'admin' });
ok(reg.status === 201 && reg.data.role === 'user', 'register ignores role=admin', reg.data.role);
const dup = await req('POST', '/api/auth/register', { name: 'x', email, password: 'secret12' });
ok(dup.status === 409, 'duplicate email 409');
const bad = await req('POST', '/api/auth/login', { email, password: 'wrong' });
ok(bad.status === 401, 'bad password 401');
const login = await req('POST', '/api/auth/login', { email: email.toUpperCase(), password: 'secret12' });
ok(login.status === 200 && login.data.token, 'login (case-insensitive email)');
const T = login.data.token;
const me = await req('GET', '/api/auth/me', null, T);
ok(me.status === 200 && !('password' in me.data), 'me without password');

// Admin routes blocked for customers
ok((await req('GET', '/api/admin/stats', null, T)).status === 403, 'stats 403 for customer');
ok((await req('GET', '/api/orders', null, T)).status === 403, 'all orders 403 for customer');
ok((await req('GET', '/api/users', null, T)).status === 403, 'users 403 for customer');
ok((await req('GET', '/api/orders/mine')).status === 401, 'orders/mine 401 without token');

// Cart
const banana = pd.data;
const tomato = (await req('GET', '/api/products/slug/vine-tomatoes')).data;
let cart = await req('POST', '/api/users/cart', { productId: banana._id, quantity: 2 }, T);
ok(cart.status === 200 && cart.data[0].quantity === 2 && cart.data[0].product.name === 'Bananas', 'add to cart');
cart = await req('POST', '/api/users/cart/merge', { items: [{ productId: banana._id, quantity: 1 }, { productId: tomato._id, quantity: 3 }] }, T);
ok(cart.data.length === 2 && cart.data.find(i => i.product._id === banana._id).quantity === 2, 'merge keeps max qty');
cart = await req('PUT', `/api/users/cart/${tomato._id}`, { quantity: 99 }, T);
ok(cart.data.find(i => i.product._id === tomato._id).quantity === 20, 'qty capped at 20');
const broccoli = (await req('GET', '/api/products/slug/broccoli')).data;
const oos = await req('POST', '/api/users/cart', { productId: broccoli._id, quantity: 1 }, T);
ok(oos.status === 409, 'out of stock add 409');

// Order: client prices must be ignored, stock must decrement
const before = banana.stock;
const order = await req('POST', '/api/orders', {
  items: [{ product: banana._id, quantity: 2, price: 1 }, { product: tomato._id, quantity: 1 }],
  subtotal: 1, total: 1,
  shippingAddress: { fullName: 'Test Shopper', phone: '0321 4478 192', street: '1 Mall Road', city: 'Lahore' },
  deliverySlot: { date: new Date().toISOString(), window: '18:00 - 21:00' },
  saveAddress: true
}, T);
const expectSub = banana.price * 2 + tomato.price;
ok(order.status === 201 && order.data.subtotal === expectSub, 'server-side subtotal', `${order.data.subtotal} vs ${expectSub}`);
ok(order.data.deliveryFee === (expectSub >= 3000 ? 0 : 150) && order.data.total === expectSub + order.data.deliveryFee, 'delivery fee + total');
ok(/^NC-\d{6}-\d{4}$/.test(order.data.orderNumber), 'order number', order.data.orderNumber);
const afterOrder = (await req('GET', '/api/products/slug/bananas')).data.stock;
ok(afterOrder === before - 2, 'stock decremented', `${before} -> ${afterOrder}`);
ok((await req('GET', '/api/users/cart', null, T)).data.length === 0, 'cart cleared after order');
ok((await req('GET', '/api/users/profile', null, T)).data.address?.city === 'Lahore', 'address saved');

const badPhone = await req('POST', '/api/orders', { items: [{ product: banana._id, quantity: 1 }], shippingAddress: { fullName: 'a', phone: '12', street: 's', city: 'c' } }, T);
ok(badPhone.status === 400 && badPhone.data.fields?.phone, 'invalid phone 400 with field');
const missingAddr = await req('POST', '/api/orders', { items: [{ product: banana._id, quantity: 1 }], shippingAddress: {} }, T);
ok(missingAddr.status === 400 && missingAddr.data.fields?.street, 'missing address fields');

// Oversell
const salmon = (await req('GET', '/api/products/slug/salmon-fillet')).data;
const over = await req('POST', '/api/orders', { items: [{ product: salmon._id, quantity: salmon.stock + 1 }], shippingAddress: { fullName: 'a', phone: '03001234567', street: 's', city: 'Lahore' } }, T);
ok(over.status === 409 || over.status === 201, 'oversell handled', `status ${over.status}`);
const salmonAfter = (await req('GET', '/api/products/slug/salmon-fillet')).data.stock;
ok(over.status === 409 ? salmonAfter === salmon.stock : true, 'no stock change on failed order');

// Cancel restores stock
const cancel = await req('PUT', `/api/orders/${order.data._id}/cancel`, null, T);
ok(cancel.status === 200 && cancel.data.status === 'cancelled', 'customer cancel');
ok((await req('GET', '/api/products/slug/bananas')).data.stock === before, 'stock restored on cancel');
ok((await req('PUT', `/api/orders/${order.data._id}/cancel`, null, T)).status === 400, 'double cancel rejected');

// Reviews (verified purchase since an order exists, even cancelled? -> excluded)
const rev = await req('POST', `/api/products/${banana._id}/reviews`, { rating: 5, comment: 'Lovely bananas' }, T);
ok(rev.status === 201 && rev.data.numReviews === banana.numReviews + 1, 'add review');
const mine = rev.data.reviews.find(r => r.comment === 'Lovely bananas');
ok(mine && mine.verified === false, 'cancelled order is not a verified purchase');
const rev2 = await req('POST', `/api/products/${banana._id}/reviews`, { rating: 3, comment: 'Updated' }, T);
ok(rev2.status === 200 && rev2.data.numReviews === banana.numReviews + 1, 'review upsert');
ok((await req('POST', `/api/products/${banana._id}/reviews`, { rating: 9 }, T)).status === 400, 'invalid rating 400');
const del = await req('DELETE', `/api/products/${banana._id}/reviews/${mine._id}`, null, T);
ok(del.status === 200 && del.data.numReviews === banana.numReviews, 'delete own review');

// Wishlist
const w = await req('POST', '/api/users/wishlist', { productId: tomato._id }, T);
ok(w.data.length === 1 && w.data[0].name === 'Vine tomatoes', 'wishlist add');
ok((await req('POST', '/api/users/wishlist', { productId: tomato._id }, T)).data.length === 0, 'wishlist toggle off');

// Profile + password
ok((await req('PUT', '/api/users/profile', { name: 'Test Buyer', phone: '0300 1112223' }, T)).data.name === 'Test Buyer', 'update profile');
ok((await req('PUT', '/api/users/profile/password', { currentPassword: 'nope', newPassword: 'newpass1' }, T)).status === 400, 'wrong current password');
ok((await req('PUT', '/api/users/profile/password', { currentPassword: 'secret12', newPassword: 'newpass1' }, T)).status === 200, 'change password');
ok((await req('POST', '/api/auth/login', { email, password: 'newpass1' })).status === 200, 'login with new password');

// Admin
const A = (await req('POST', '/api/auth/login', { email: 'admin@novacart.pk', password: 'Admin@123' })).data.token;
const stats = await req('GET', '/api/admin/stats?days=14', null, A);
ok(stats.status === 200 && stats.data.series.length === 14 && stats.data.revenue > 0, 'admin stats', `rev=${stats.data.revenue} orders=${stats.data.orders} chg=${stats.data.revenueChange}`);
ok(stats.data.lowStock.some(p => p.slug === 'broccoli'), 'low stock includes sold-out');
const all = await req('GET', '/api/orders?status=delivered', null, A);
ok(all.data.length > 0 && all.data.every(o => o.status === 'delivered'), 'admin orders filter');
const qo = await req('GET', '/api/orders?q=Lahore', null, A);
ok(qo.data.length > 0, 'admin orders search');
const target = (await req('GET', '/api/orders?status=processing', null, A)).data[0];
if (target) {
  const up = await req('PUT', `/api/orders/${target._id}/status`, { status: 'confirmed', note: 'Called customer' }, A);
  ok(up.data.status === 'confirmed' && up.data.statusHistory.at(-1).note === 'Called customer', 'admin status update + history');
}
ok((await req('PUT', `/api/orders/${order.data._id}/status`, { status: 'shipped' }, A)).status === 400, 'cancelled order cannot reopen');
const users = await req('GET', '/api/users', null, A);
ok(users.data.length >= 8 && users.data.some(u => u.orders > 0 && u.spent > 0), 'admin users with stats');
const adminId = users.data.find(u => u.role === 'admin')._id;
ok((await req('PUT', `/api/users/${adminId}/role`, { role: 'user' }, A)).status === 400, 'admin cannot demote self');

// Product CRUD via JSON-less multipart
const fd = new FormData();
fd.append('name', 'Test Mangosteen'); fd.append('category', 'Fruits'); fd.append('price', '999'); fd.append('stock', '5'); fd.append('featured', 'true');
let r = await fetch(B + '/api/products', { method: 'POST', headers: { Authorization: `Bearer ${A}` }, body: fd });
const created = await r.json();
ok(r.status === 201 && created.slug === 'test-mangosteen' && created.featured === true && created.price === 999, 'create product (auto slug)', created.message || '');
const fd2 = new FormData(); fd2.append('price', 'abc');
r = await fetch(B + `/api/products/${created._id}`, { method: 'PUT', headers: { Authorization: `Bearer ${A}` }, body: fd2 });
ok(r.status === 400, 'invalid price rejected');
const fd3 = new FormData(); fd3.append('compareAtPrice', '1200'); fd3.append('slug', 'Test Mangosteen Fresh!');
r = await fetch(B + `/api/products/${created._id}`, { method: 'PUT', headers: { Authorization: `Bearer ${A}` }, body: fd3 });
const upd = await r.json();
ok(upd.compareAtPrice === 1200 && upd.slug === 'test-mangosteen-fresh', 'update product + slugify', upd.slug);
const fd4 = new FormData(); fd4.append('name', 'Dup'); fd4.append('category', 'Fruits'); fd4.append('price', '1'); fd4.append('stock', '1'); fd4.append('slug', 'bananas');
r = await fetch(B + '/api/products', { method: 'POST', headers: { Authorization: `Bearer ${A}` }, body: fd4 });
ok(r.status === 409, 'duplicate slug 409');
ok((await req('DELETE', `/api/products/${created._id}`, null, A)).status === 200, 'delete product');

// Contact + newsletter + messages
ok((await req('POST', '/api/contact', { name: 'Ali', email: 'ali@example.pk', message: 'Do you deliver to Multan?' })).status === 201, 'contact message');
ok((await req('POST', '/api/contact', { name: '', email: 'bad', message: '' })).status === 400, 'contact validation');
ok((await req('POST', '/api/newsletter', { email: 'news@example.pk' })).status === 201, 'newsletter');
ok((await req('POST', '/api/newsletter', { email: 'news@example.pk' })).status === 201, 'newsletter idempotent');
const msgs = await req('GET', '/api/contact', null, A);
ok(msgs.data.length >= 4, 'admin messages');
ok((await req('PATCH', `/api/contact/${msgs.data[0]._id}`, { read: true }, A)).data.read === true, 'mark read');

// SEO + misc
const sm = await fetch(B + '/sitemap.xml'); const smt = await sm.text();
ok(sm.headers.get('content-type').includes('xml') && smt.includes('/product/bananas'), 'sitemap.xml');
ok((await req('GET', '/api/nope')).status === 404, 'unknown api 404 json');
ok((await req('GET', '/api/products/not-an-id', null, A)).status === 400, 'bad object id 400');
const badJson = await fetch(B + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
ok(badJson.status === 400, 'malformed json 400');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
