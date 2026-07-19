import { db } from '../db.js';
import { priceCart } from '../utils/pricing.js';
import { stripe } from './payments.controller.js';

const CARRIER_PREFIX = {
  'J&T Express': 'JT',
  'Vireak Buntham': 'VB',
  'Mekong Express': 'MK',
};

function genOrderNumber() {
  return `SN-${Math.floor(100000 + Math.random() * 900000)}`;
}

function genTracking(carrierName) {
  const prefix = CARRIER_PREFIX[carrierName] || 'SN';
  return `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`;
}

// POST /api/orders
// Body: { items, carrier, shipping: {fullName, phone, province, addressLine}, paymentIntentId }
// Re-checks the PaymentIntent with Stripe (server-to-server) before writing the
// order, so a request that skipped payment (or paid the wrong amount) cannot
// create a "paid" order just by calling this endpoint.
export async function createOrder(req, res) {
  try {
    const { items, carrier, shipping, paymentIntentId } = req.body || {};

    if (!shipping?.fullName || !shipping?.phone || !shipping?.province || !shipping?.addressLine) {
      return res.status(400).json({ error: 'Shipping details are incomplete.' });
    }
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing paymentIntentId.' });
    }

    const priced = priceCart(items, carrier);

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      return res.status(402).json({ error: `Payment not completed (status: ${intent.status}).` });
    }
    const expectedCents = Math.round(priced.total * 100);
    if (intent.amount !== expectedCents) {
      return res.status(400).json({ error: 'Paid amount does not match the cart total.' });
    }

    const orderNumber = genOrderNumber();
    const trackingNumber = genTracking(priced.carrier);
    const userId = req.user?.sub ?? null;

    const info = db
      .prepare(
        `INSERT INTO orders
          (order_number, tracking_number, user_id, items_json, shipping_json,
           subtotal, shipping_fee, total, currency, payment_provider,
           payment_intent_id, payment_status, status_index)
         VALUES (@order_number, @tracking_number, @user_id, @items_json, @shipping_json,
           @subtotal, @shipping_fee, @total, 'usd', 'stripe',
           @payment_intent_id, 'paid', 1)`
      )
      .run({
        order_number: orderNumber,
        tracking_number: trackingNumber,
        user_id: userId,
        items_json: JSON.stringify(priced.lines),
        shipping_json: JSON.stringify(shipping),
        subtotal: priced.subtotal,
        shipping_fee: priced.shippingFee,
        total: priced.total,
        payment_intent_id: paymentIntentId,
      });

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ order: serialize(order) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// GET /api/orders/mine  (requires login)
export function listMyOrders(req, res) {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.sub);
  res.json({ orders: rows.map(serialize) });
}

// GET /api/orders/:id  (guest checkout can look up by order id; logged-in users
// are restricted to their own orders)
export function getOrder(req, res) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Order not found.' });
  if (row.user_id && req.user?.sub !== row.user_id) {
    return res.status(403).json({ error: 'Not your order.' });
  }
  res.json({ order: serialize(row) });
}

function serialize(row) {
  return {
    ...row,
    items: JSON.parse(row.items_json),
    shipping: JSON.parse(row.shipping_json),
    items_json: undefined,
    shipping_json: undefined,
  };
}
