# NovaCart

An online grocery store for Pakistan, built with the MERN stack: React 19 + Vite on the front, Express 5 + MongoDB (Mongoose 9) behind it. Customers browse a real catalogue, fill a basket, pick a three-hour delivery window and pay cash on delivery. Staff run the store from an admin with sales analytics, product and SEO management, order fulfilment, customers and an inbox.

## Quick start

You need Node 20+ and MongoDB (local `mongod`, Docker, or a MongoDB Atlas URI).

```bash
# 1. API
cd backend
cp .env.example .env          # set MONGO_URI and a long JWT_SECRET
npm install
npm run seed                  # 52 products with photos, customers, 30 days of orders, reviews
npm run dev                   # http://localhost:5000

# 2. Storefront (new terminal)
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies `/api`, `/uploads` and `/sitemap.xml` to the API, so no CORS setup is needed in development.

To check the API end to end (73 checks covering auth, pricing, stock, orders, reviews and admin access), run `npm run test:api` in `backend/` while the server is running against a freshly seeded database.

### Demo accounts (created by `npm run seed`)

| Role     | Email                        | Password       |
|----------|------------------------------|----------------|
| Admin    | `admin@novacart.pk`          | `Admin@123`    |
| Customer | `hira.siddiqui@example.pk`   | `Customer@123` |

Admin sign-in lives at `/admin/login`. To promote any other account: `npm run make-admin -- someone@example.com`.

## Features

**Storefront**
- Home with seasonal picks, weekly deals, category aisles and how delivery works
- Shop with search, category / price / in-stock / on-sale filters, sorting and pagination, all kept in the URL so results can be shared
- Live search suggestions in the header (keyboard accessible combobox)
- Product pages with stock state, quantity, delivery info, reviews with verified-purchase badges, related products
- Slide-over basket with free-delivery progress, guest basket that merges into the account on sign-in
- Checkout with saved address, delivery day and window picker, notes for the rider, cash on delivery
- Order history, live tracking timeline, cancel (until it ships), order again, printable receipt
- Saved items, account details, address book and password change
- Help centre, contact form, about, privacy and terms pages, branded 404
- Light and dark themes (follows the device, or pick one), reduced-motion support, responsive down to 375 px

**Admin** (`/admin`)
- Overview: revenue and orders vs the previous period, revenue chart, orders by status, best sellers, low stock, latest orders
- Products: search and filter, create / edit with image upload, compare-at (sale) price, featured flag, SEO fields with a live Google result preview
- Orders: status tabs, search by order number, name, phone or city, detail drawer with status updates and history
- Customers: order count and lifetime spend, role management
- Messages: contact form inbox with read state

**SEO**
- Per-product meta title, description, keywords and clean slugs (`/product/chaunsa-mangoes`)
- Open Graph and Twitter tags, canonical URLs
- JSON-LD: `Organization` and `WebSite` search on the home page, `Product` with offers and ratings, `BreadcrumbList`, `FAQPage`
- `GET /sitemap.xml` generated from the catalogue, `robots.txt`

## How the money and stock stay correct

The client never decides what an order costs. `POST /api/orders` takes only product ids and quantities. The server loads current prices, works out the subtotal and the delivery fee (Rs 150, free over Rs 3,000) and reserves stock atomically, rolling back if any line cannot be filled. Cancelling an order, by the customer or by an admin, puts the stock back exactly once.

## Security notes

- Passwords hashed with bcrypt; JWT (7 days) sent as a Bearer token
- Registration ignores any `role` in the request body, so admins are only created by the seed or `make-admin`
- `protect` and `adminOnly` middleware on every private route; customers can only read their own orders
- Failed sign-in attempts are rate limited per IP
- Uploads limited to images up to 5 MB, stored under generated file names
- Central error handler returns plain-language JSON (validation, duplicate keys, bad ids, malformed JSON)

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Products | `GET /api/products?q&category&minPrice&maxPrice&inStock&onSale&featured&sort&page&limit`, `GET /api/products/categories`, `GET /api/products/slug/:slug`, `POST/PUT/DELETE /api/products/:id` (admin), `POST/DELETE /api/products/:id/reviews` |
| Basket and saved items | `GET/POST/DELETE /api/users/cart`, `POST /api/users/cart/merge`, `PUT/DELETE /api/users/cart/:productId`, `GET/POST /api/users/wishlist` |
| Profile | `GET/PUT /api/users/profile`, `PUT /api/users/profile/password` |
| Orders | `POST /api/orders`, `GET /api/orders/mine`, `GET /api/orders/:id`, `PUT /api/orders/:id/cancel`, `GET /api/orders` (admin), `PUT /api/orders/:id/status` (admin) |
| Admin | `GET /api/admin/stats?days=14`, `GET /api/users`, `PUT /api/users/:id/role` |
| Contact | `POST /api/contact`, `GET/PATCH/DELETE /api/contact/:id` (admin), `POST /api/newsletter` |
| Other | `GET /api/health`, `GET /api/store`, `GET /sitemap.xml` |

## Project structure

```
backend/
  config/        store rules (fees, windows, statuses), upload path
  controllers/   auth, products, orders, users, admin stats, contact
  middleware/    auth, errors, rate limit
  models/        User, Product (+ reviews), Order (+ history), Message, Subscriber
  routes/
  seed/          catalogue data, product photos, seed and make-admin scripts
frontend/
  public/images  lifestyle and category photography
  src/
    styles/      design tokens (light + dark), base, components, layout
    lib/         API client, formatting, store rules
    context/     auth, basket, saved items, toasts, theme
    components/  layout (header, search, basket drawer, footer), ui kit, admin
    pages/       storefront, account, content and admin pages
```

## Production

```bash
cd frontend && npm run build
cd ../backend && SERVE_FRONTEND=true NODE_ENV=production npm start
```

With `SERVE_FRONTEND=true` the API also serves `frontend/dist`, so the whole store runs as one process. Set `CLIENT_URL` to your domain for CORS and sitemap links, and update the `Sitemap:` line in `frontend/public/robots.txt`.

## Credits

Product and lifestyle photography from [Unsplash](https://unsplash.com) under the Unsplash License. Icons by Font Awesome. Typefaces: Fraunces and Figtree (Google Fonts).
