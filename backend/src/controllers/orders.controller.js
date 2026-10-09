import { pool } from '../db.js';
import { priceCart } from '../utils/pricing.js';
import { stripe } from './payments.controller.js';
import { checkTransaction } from '../services/khqrClient.js';

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
// Body: { items, carrier, shipping: {fullName, phone, province, addressLine}, paymentIntentId, paymentMethod, md5 }
export async function createOrder(req, res) {
  try {
    const { items, carrier, shipping, paymentIntentId, paymentMethod, md5 } = req.body || {};

    if (!shipping?.fullName || !shipping?.phone || !shipping?.province || !shipping?.addressLine) {
      return res.status(400).json({ error: 'Shipping details are incomplete.' });
    }

    const priced = await priceCart(items, carrier);

    // Bakong KHQR Flow
    if (paymentMethod === 'bakong' || md5) {
      if (!md5) {
        return res.status(400).json({ error: 'Missing Bakong MD5 hash.' });
      }

      const orderRes = await pool.query('SELECT * FROM orders WHERE bakong_md5 = $1', [md5]);
      const order = orderRes.rows[0];
      if (!order) {
        return res.status(404).json({ error: 'Order not found for this KHQR transaction.' });
      }

      // Belt-and-suspenders re-verification
      if (order.payment_status !== 'paid') {
        const checkResult = await checkTransaction(md5);
        if (checkResult.status !== 'paid') {
          return res.status(402).json({ error: 'Payment not completed or verified.' });
        }
        await pool.query(
          `UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = $1`,
          [order.id]
        );
      } else {
        // Also call checkTransaction as belt-and-suspenders
        const checkResult = await checkTransaction(md5);
        if (checkResult.status !== 'paid') {
          return res.status(402).json({ error: 'Payment verification failed.' });
        }
      }

      const expectedTotal = priced.total;
      if (Math.abs(order.total - expectedTotal) > 0.01) {
        return res.status(400).json({ error: 'Paid amount does not match the cart total.' });
      }

      const userId = req.user?.sub ?? order.user_id ?? null;
      await pool.query(
        `UPDATE orders
         SET shipping_json = $1, payment_method = 'bakong', user_id = $2
         WHERE id = $3`,
        [JSON.stringify(shipping), userId, order.id]
      );

      const finalizedRes = await pool.query('SELECT * FROM orders WHERE id = $1', [order.id]);
      return res.status(201).json({ order: serialize(finalizedRes.rows[0]) });
    }

    // Stripe Flow
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Missing paymentIntentId.' });
    }

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

    const insertRes = await pool.query(
      `INSERT INTO orders
        (order_number, tracking_number, user_id, items_json, shipping_json,
         subtotal, shipping_fee, total, currency, payment_provider, payment_method,
         payment_intent_id, payment_status, status_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'usd', 'stripe', 'stripe',
         $9, 'paid', 1)
       RETURNING id`,
      [
        orderNumber,
        trackingNumber,
        userId,
        JSON.stringify(priced.lines),
        JSON.stringify(shipping),
        priced.subtotal,
        priced.shippingFee,
        priced.total,
        paymentIntentId,
      ]
    );

    const newOrderId = insertRes.rows[0].id;
    const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [newOrderId]);
    res.status(201).json({ order: serialize(orderRes.rows[0]) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// GET /api/orders/mine  (requires login)
export async function listMyOrders(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.sub]
    );
    res.json({ orders: result.rows.map(serialize) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/orders/:id
export async function getOrder(req, res) {
  try {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Order not found.' });
    if (row.user_id && req.user?.sub !== row.user_id) {
      return res.status(403).json({ error: 'Not your order.' });
    }
    res.json({ order: serialize(row) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function serialize(row) {
  return {
    ...row,
    items: typeof row.items_json === 'string' ? JSON.parse(row.items_json) : row.items_json,
    shipping: typeof row.shipping_json === 'string' ? JSON.parse(row.shipping_json) : row.shipping_json,
    items_json: undefined,
    shipping_json: undefined,
  };
}
