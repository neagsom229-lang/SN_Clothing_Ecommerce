# SN Clothing — Backend API

A small Node.js + Express backend for the SN Clothing store: products, accounts,
orders, and a **real Stripe payment checkout running in test mode** (no real
money moves, ever — that's what "test mode" means), plus **Bakong KHQR Payments**.

## Stack
- Express — HTTP API
- PostgreSQL (Supabase hosted via `pg` connection pooler)
- jsonwebtoken + bcryptjs — accounts and login sessions
- stripe — official Stripe SDK, test-mode payments
- bakong-khqr — official NBC Bakong KHQR generator & validation SDK

**Node.js 18+ or newer required.** Check with `node -v`.

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure Stripe & Bakong KHQR

1. **Stripe (optional for card payments):**
   - Create a free account at https://dashboard.stripe.com/register
   - Copy `.env.example` to `.env` and configure `STRIPE_SECRET_KEY=sk_test_...`.

2. **Bakong KHQR (Cambodia payments):**
   - Register for a developer token at https://api-bakong.nbc.gov.kh/register
   - Note on network requirements: NBC Bakong API endpoints require a **Cambodian IP address**. If hosting your backend outside Cambodia (e.g., Vercel, AWS US regions), use the **KHQR.dev relay** alternative.
   - Add to `backend/.env`:
     ```env
     BAKONG_API_TOKEN=your_token_here
     BAKONG_ACCOUNT_ID=your_account@aba
     BAKONG_MERCHANT_NAME=SN Clothing
     BAKONG_MERCHANT_CITY=Phnom Penh
     BAKONG_API_BASE=https://api-bakong.nbc.gov.kh/v1
     # Or if hosted outside Cambodia:
     # BAKONG_API_BASE=https://api.khqr.dev/v1
     ```

## 3. Run it

```bash
npm run dev
```

The API starts on `http://localhost:5000`. First run automatically initializes the PostgreSQL schema and seeds products if the database is empty.

## API overview

| Method | Path | Auth | Purpose |
|--------|-----------------------------------|----------|---------|
| POST | /api/auth/register | — | Create an account |
| POST | /api/auth/login | — | Log in, get a JWT |
| GET | /api/auth/me | required | Current user |
| GET | /api/products | — | List products (`?category=men`) |
| GET | /api/products/:id | — | One product |
| POST | /api/payments/create-intent | — | Start a Stripe payment for the cart |
| POST | /api/payments/bakong/create-qr | optional | Generate Bakong KHQR and pending order |
| GET | /api/payments/bakong/check/:md5 | optional | Poll Bakong transaction status by MD5 |
| POST | /api/orders | optional | Save the order (verified via Stripe or Bakong MD5) |
| GET | /api/orders/mine | required | My past orders |
| GET | /api/orders/:id | optional | One order |
| POST | /api/payments/webhook | — | Stripe server payment confirmation |

## Bakong KHQR Payments & End-to-End Flow

1. **Create QR:** When the customer selects Bakong KHQR at checkout and provides delivery details, the frontend calls `POST /api/payments/bakong/create-qr`. The server recomputes cart totals from the database, generates a dynamic KHQR string (with 15-minute expiration) using `bakong-khqr`, and creates a pending order in SQLite.
2. **Scan & Pay:** The customer scans the displayed QR code using any Bakong-enabled mobile banking app (e.g. **ABA Mobile**, **ACLEDA**, **Wing**) and completes payment (e.g. test with $0.10).
3. **Poll Status:** The frontend polls `GET /api/payments/bakong/check/:md5` every 4 seconds. The backend queries Bakong API (`check_transaction_by_md5`). Once paid (`responseCode === 0`), the order status is updated to `paid`.
4. **Finalize Order:** Upon receiving payment success, the frontend calls `POST /api/orders` with `{ paymentMethod: 'bakong', md5 }`. The backend re-verifies transaction status and cart totals before finalizing and returning the order.

## How the payment is verified

Two independent checks protect the checkout, not just one:

1. **Price Recomputation:** Cart totals are always recomputed server-side from the database (`priceCart`), never trusting client-submitted prices.
2. **Server-to-Server Verification:** Both Stripe PaymentIntents and Bakong MD5 transactions are queried and verified directly against the payment gateway API before an order is marked as paid and saved.

## Test notes

- Use a real Bakong-enabled mobile banking app (ABA, ACLEDA, Wing) to scan and pay small amounts ($0.10).
- Passwords are hashed with bcrypt before they're stored — never stored in plain text.
