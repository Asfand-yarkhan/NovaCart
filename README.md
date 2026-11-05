# NovaCart

An online grocery store for Pakistan, built with the MERN stack: React 19 + Vite on the front, Express 5 + MongoDB (Mongoose 9) behind it. Customers browse a real catalogue, fill a basket, pick a three-hour delivery window and pay cash on delivery. Staff run the store from an admin with sales analytics, product and SEO management, order fulfilment, customers and an inbox.

## Quick start

You need Node 20+ and MongoDB: a free MongoDB Atlas cluster (see [MongoDB Atlas setup](#mongodb-atlas-setup)), Docker, or a local `mongod`.

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

To check the API end to end (81 checks covering auth, pricing, stock, orders, reviews, admin access and the shopping assistant), run `npm run test:api` in `backend/` while the server is running against a freshly seeded database.

### Accounts

`npm run seed` creates an admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`, plus demo customers. It prints the sign-in details when it finishes.

Admin sign-in lives at `/admin/login`. To promote any other account: `npm run make-admin -- someone@example.com`.

**Do not run `npm run seed` against a live database.** It deletes all products, users and orders, and resets the admin password to the value in `.env`.

### Sign-in with Firebase (email confirmation and Google)

Accounts use Firebase Authentication (project `novacart-9b618`) for identity, and NovaCart's own session for everything else.

- **Email sign-up:** Firebase creates the account and emails a confirmation link. The person cannot sign in until they click it. The sign-up page shows "Check your inbox" with a resend button (30 second cooldown), and the link brings them back to `/login?verified=1`.
- **Email sign-in:** Firebase checks the password and that the email is confirmed. Unconfirmed accounts see a resend prompt instead of a session. "Forgot password?" sends a Firebase reset email.
- **Google:** "Continue with Google" on the sign-in, sign-up and admin pages.
- **Exchange:** the browser sends the Firebase ID token to `POST /api/auth/firebase`. The API verifies its signature against Google's public keys, plus issuer, audience and verified email (`backend/utils/firebaseAuth.js`, no service-account key needed). It then finds the account by Firebase uid, links an existing account with the same verified email, or creates a customer, and returns the normal NovaCart token. Baskets, orders and admin roles work the same for every sign-in method.
- **Older accounts:** accounts that only exist in MongoDB (such as the seeded demo accounts) still sign in. If Firebase does not know the email, the sign-in falls back to the API password.

Setup:
- `frontend/.env` holds the Firebase web config (copy `frontend/.env.example`). These values are public identifiers, not secrets.
- `backend/.env` sets `FIREBASE_PROJECT_ID=novacart-9b618`.
- Firebase console, **Authentication → Sign-in method**: enable **Email/Password** and **Google**.
- Firebase console, **Authentication → Settings → Authorized domains**: add every domain you deploy to (`localhost` is there by default).
- Optional, **Authentication → Templates**: edit the sender name and wording of the confirmation and password reset emails, for example "NovaCart" and your support address.

### MongoDB Atlas setup

1. Sign in at [cloud.mongodb.com](https://cloud.mongodb.com) and create a project, for example `NovaCart`.
2. **Create a cluster:** choose the free **M0** tier, provider AWS, and a nearby region (Mumbai `ap-south-1` is closest to Pakistan).
3. **Database user:** Security → Database Access → Add New Database User. Choose password authentication, a username such as `novacart_app`, a generated password, and the role **Read and write to any database**. Save the password.
4. **Network access:** Security → Network Access → Add IP Address. For development choose **Add current IP address**. For a hosted backend (Render, Railway and similar) add `0.0.0.0/0`, or that host's fixed outbound IPs if it has them.
5. **Connection string:** Database → Connect → Drivers → Node.js. Copy the `mongodb+srv://` string, replace `<password>` with the user's password (URL-encode characters like `@` or `#`), and add the database name before the `?`:
   ```
   MONGO_URI=mongodb+srv://novacart_app:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/novacart?retryWrites=true&w=majority&appName=Cluster0
   ```
6. Put that line in `backend/.env`, then run `npm run seed` once to load the catalogue, demo accounts and orders, and `npm run dev`. The API logs `Connected to MongoDB (novacart)`.
7. Check the data in Atlas under Database → Browse Collections: `products`, `users`, `orders`, `messages`, `subscribers`.

If it does not connect: `bad auth` means the username or password is wrong (or not URL-encoded); a timeout usually means your IP is missing from Network Access.

### Shopping assistant

The chat button on every storefront page talks to `POST /api/assistant` (`backend/controllers/assistantController.js`). It is a rule-based engine over the live catalogue and the shopper's own orders, so it needs no external AI service or API key. It understands:

- **Search:** "fruit under 400", "cheap vegetables", "do you have salmon?", "is broccoli available". It copes with typos ("tomatos") and Urdu names (aloo, pyaz, doodh, anday, chawal, chai, dahi).
- **Basket:** "add 2 dozen eggs", "aloo chahiye", "remove bananas", "what's in my basket?", "checkout".
- **Orders (signed in):** "where is my order", "track NC-261104-4821", "cancel my order" (asks for confirmation first), "order again".
- **Store questions:** delivery areas and slots, payment, returns and refunds, contact, opening hours, sourcing.

Product suggestions appear as cards with Add buttons that use the same basket as the rest of the site.

## Features

**Storefront**
- Home with seasonal picks, weekly deals, category aisles and how delivery works
- Shop with search, category / price / in-stock / on-sale filters, sorting and pagination, all kept in the URL so results can be shared
- Live search suggestions in the header (keyboard accessible combobox)
- Product pages with stock state, quantity, delivery info, reviews with verified-purchase badges, related products
- Slide-over basket with free-delivery progress, guest basket that merges into the account on sign-in
- Checkout with saved address, delivery day and window picker, notes for the rider, cash on delivery
- Order history, live tracking timeline, cancel (until it ships), order again, printable receipt
- Shopping assistant chat on every page: finds products (understands Urdu names like aloo, doodh, anday), adds to the basket, tracks and cancels orders, answers delivery, payment and returns questions
- Email sign-up with a confirmation link, Google sign-in, and password reset by email (Firebase Authentication)
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
- Google sign-in tokens are verified server-side (signature, issuer, audience, verified email) before an account is created or linked
- Registration ignores any `role` in the request body, so admins are only created by the seed or `make-admin`
- `protect` and `adminOnly` middleware on every private route; customers can only read their own orders
- Failed sign-in attempts are rate limited per IP
- Uploads limited to images up to 5 MB, stored under generated file names
- Central error handler returns plain-language JSON (validation, duplicate keys, bad ids, malformed JSON)

## API overview

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/firebase` (Firebase ID token), `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| Assistant | `POST /api/assistant` `{ message, cart }` |
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
