# SN Clothing — Backend API

A small Node.js + Express backend for the SN Clothing store: products, accounts,
orders, and a **real Stripe payment checkout running in test mode** (no real
money moves, ever — that's what "test mode" means).

## Stack
- Express — HTTP API
- Node's built-in `node:sqlite` — a real embedded SQL database (one file, zero
  extra install — it ships inside Node itself, no compiler needed)
- jsonwebtoken + bcryptjs — accounts and login sessions
- stripe — official Stripe SDK, test-mode payments

**Requires Node.js 22.5 or newer** (for `node:sqlite`). Check with `node -v`.
If you're on an older version, install the current LTS from
https://nodejs.org first.

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure Stripe (free, ~2 minutes)

1. Create a free account at https://dashboard.stripe.com/register
2. Make sure you're in **Test mode** (toggle top-right of the dashboard).
3. Go to https://dashboard.stripe.com/test/apikeys and copy the **Secret key** (`sk_test_...`).
4. Copy `.env.example` to `.env` and paste your key in:

```bash
cp .env.example .env
```

```
STRIPE_SECRET_KEY=sk_test_your_key_here
JWT_SECRET=any-long-random-string
```

You'll also need the matching **Publishable key** (`pk_test_...`) for the
frontend — see the frontend README/`.env.example` for where that goes.

## 3. Run it

```bash
npm run dev
```

The API starts on `http://localhost:5000`. First run auto-creates
`sn_clothing.sqlite` and seeds it with the same 35 products the React site
already shows.

## API overview

| Method | Path                      | Auth       | Purpose |
|--------|---------------------------|------------|---------|
| POST   | /api/auth/register        | —          | Create an account |
| POST   | /api/auth/login           | —          | Log in, get a JWT |
| GET    | /api/auth/me              | required   | Current user |
| GET    | /api/products             | —          | List products (`?category=men`) |
| GET    | /api/products/:id         | —          | One product |
| POST   | /api/payments/create-intent | —        | Start a Stripe payment for the cart |
| POST   | /api/orders               | optional   | Save the order (only after Stripe confirms payment) |
| GET    | /api/orders/mine          | required   | My past orders |
| GET    | /api/orders/:id           | optional   | One order |
| POST   | /api/payments/webhook     | —          | Stripe → server payment confirmation (optional, see below) |

## How the payment is actually verified

Two independent checks protect the checkout, not just one:

1. **`create-intent`** recomputes the cart total from the database (never
   from numbers the browser sends) and creates a Stripe PaymentIntent for that
   exact amount.
2. **`POST /api/orders`** re-fetches that PaymentIntent from Stripe itself and
   only saves the order if Stripe says `status: "succeeded"` and the paid
   amount matches the recomputed total. A request that skips payment, or
   tries to fake a `paymentIntentId`, is rejected.

The `/api/payments/webhook` route is there for the more "production" pattern
(Stripe notifies your server directly, independent of the browser). It's
optional for a class demo — to test it locally you'd run the Stripe CLI:

```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```

## Test card numbers (test mode — never real money)

| Number              | Result |
|---------------------|--------|
| 4242 4242 4242 4242  | Succeeds |
| 4000 0000 0000 9995  | Declined (insufficient funds) |
| 4000 0025 0000 3155  | Requires authentication (3D Secure) |

Use any future expiry date, any 3-digit CVC, and any postal code.
Full list: https://docs.stripe.com/testing

## Notes

- Login/Register on the React frontend still use the browser's localStorage
  demo accounts — this backend's `/api/auth` is separate and ready to use, but
  wiring the existing Login/Register pages to it is a follow-up step (say the
  word and it can be done next).
- Passwords are hashed with bcrypt before they're stored — never stored in
  plain text.
