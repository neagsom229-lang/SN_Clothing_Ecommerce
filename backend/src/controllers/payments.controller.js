import Stripe from 'stripe';
import { db } from '../db.js';
import { priceCart } from '../utils/pricing.js';
import {
  createQrPayment,
  checkTransaction,
  getQrImageUrl,
  KhqrRateLimitError,
  KhqrNetworkError,
  KhqrApiError,
} from '../services/khqrClient.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

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

// POST /api/payments/create-intent
export async function createPaymentIntent(req, res) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: 'Stripe is not configured on the server. Add STRIPE_SECRET_KEY to backend/.env.',
    });
  }

  try {
    const { items, carrier } = req.body || {};
    const priced = priceCart(items, carrier);

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(priced.total * 100),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        carrier: priced.carrier,
        itemCount: String(priced.lines.length),
      },
    });

    res.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      subtotal: priced.subtotal,
      shippingFee: priced.shippingFee,
      total: priced.total,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// POST /api/payments/bakong/create-qr
export async function createBakongQr(req, res) {
  try {
    const body = req.body || {};
    const items = body.items || body.cartItems;
    const carrier = body.carrier || 'jt';
    const currency = body.currency || 'USD';
    const expectedTotal = body.expectedTotal;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty or items missing.' });
    }
    for (const it of items) {
      if (it.id === undefined || it.id === null) {
        return res.status(400).json({ error: `Item missing id: ${JSON.stringify(it)}` });
      }
    }

    const priced = priceCart(items, carrier);

    if (expectedTotal !== undefined && Math.abs(priced.total - Number(expectedTotal)) > 0.001) {
      return res.status(400).json({
        error: `Price mismatch: frontend expected $${expectedTotal}, backend computed $${priced.total}.`,
      });
    }

    const { qr, md5, tranId, checkoutUrl } = await createQrPayment({
      amount: priced.total,
    });

    const orderNumber = genOrderNumber();
    const trackingNumber = genTracking(priced.carrier);
    const userId = req.user?.sub ?? null;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min window
    const qrImageUrl = getQrImageUrl(md5);

    const info = db
      .prepare(
        `INSERT INTO orders
          (order_number, tracking_number, user_id, items_json, shipping_json,
           subtotal, shipping_fee, total, currency, payment_provider, payment_method,
           bakong_md5, bakong_qr_string, bakong_tran_id, payment_status, payment_expires_at)
         VALUES
          (@order_number, @tracking_number, @user_id, @items_json, @shipping_json,
           @subtotal, @shipping_fee, @total, @currency, 'bakong', 'bakong',
           @bakong_md5, @bakong_qr_string, @bakong_tran_id, 'pending', @payment_expires_at)`
      )
      .run({
        order_number: orderNumber,
        tracking_number: trackingNumber,
        user_id: userId,
        items_json: JSON.stringify(priced.lines),
        shipping_json: JSON.stringify({}),
        subtotal: priced.subtotal,
        shipping_fee: priced.shippingFee,
        total: priced.total,
        currency: currency.toLowerCase(),
        bakong_md5: md5,
        bakong_qr_string: qr,
        bakong_tran_id: tranId || null,
        payment_expires_at: expiresAt,
      });

    res.json({
      md5,
      tranId,
      checkoutUrl,
      qrImageUrl,
      qr,
      amount: priced.total,
      currency,
      orderId: info.lastInsertRowid,
      expiresAt,
    });
  } catch (err) {
    console.error('[bakong] createBakongQr error:', err);
    if (err instanceof KhqrRateLimitError) {
      return res.status(429).json({ error: err.message, retryAfterMs: err.retryAfterMs });
    }
    if (err instanceof KhqrNetworkError) {
      return res.status(502).json({ error: err.message || 'Payment gateway network error' });
    }
    if (err instanceof KhqrApiError) {
      return res.status(err.status || 400).json({ error: err.message });
    }
    res.status(400).json({ error: err.message || 'Failed to generate Bakong KHQR' });
  }
}

// GET /api/payments/bakong/check/:md5
export async function checkBakongPayment(req, res) {
  try {
    const { md5 } = req.params;
    if (!md5) {
      return res.status(400).json({ error: 'Missing MD5 hash.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE bakong_md5 = ?').get(md5);
    if (!order) {
      // Check KHQR.dev relay directly for orphaned payments
      const checkResult = await checkTransaction(md5);
      if (checkResult.status === 'paid') {
        const txData = checkResult.data || {};
        const amount = Number(txData.amount) || 0.10;
        const tranId = txData.tran_id || 'RECOVERY_' + Date.now();
        const orderNumber = `SN-REC-${Math.floor(100000 + Math.random() * 900000)}`;

        const info = db.prepare(`
          INSERT INTO orders
            (order_number, tracking_number, user_id, items_json, shipping_json,
             subtotal, shipping_fee, total, currency, payment_provider, payment_method,
             bakong_md5, bakong_tran_id, payment_status, paid_at, status_index, is_recovery)
          VALUES
            (@order_number, 'REC000000', @user_id, @items_json, @shipping_json,
             @subtotal, 0, @total, 'usd', 'bakong', 'bakong',
             @bakong_md5, @bakong_tran_id, 'paid', datetime('now'), 1, 1)
        `).run({
          order_number: orderNumber,
          user_id: req.user?.sub ?? null,
          items_json: JSON.stringify([{ productId: 0, name: 'Recovered Item (Orphaned Payment)', price: amount, qty: 1, lineTotal: amount }]),
          shipping_json: JSON.stringify({ fullName: 'Recovered Customer', phone: '012345678', province: 'Phnom Penh', addressLine: 'Recovered Address' }),
          subtotal: amount,
          total: amount,
          bakong_md5: md5,
          bakong_tran_id: tranId,
        });

        console.warn(`[CRITICAL] Recovered orphaned payment md5=${md5} amount=${amount} tranId=${tranId}, created order ID ${info.lastInsertRowid}`);
        return res.json({ paid: true, orderId: info.lastInsertRowid, orphaned: true });
      }

      return res.status(404).json({ paid: false, error: 'order_not_found' });
    }

    if (order.payment_status === 'paid') {
      return res.json({ paid: true, orderId: order.id });
    }

    if (order.payment_status === 'expired') {
      return res.json({ paid: false, status: 'expired' });
    }

    // Check expiration locally
    if (order.payment_expires_at && new Date(order.payment_expires_at) < new Date()) {
      db.prepare(`UPDATE orders SET payment_status = 'expired' WHERE id = ?`).run(order.id);
      return res.json({ paid: false, status: 'expired' });
    }

    // Check with KHQR.dev relay
    const checkResult = await checkTransaction(md5);
    if (checkResult.status === 'paid') {
      db.prepare(
        `UPDATE orders SET payment_status = 'paid', paid_at = datetime('now') WHERE id = ?`
      ).run(order.id);
      return res.json({ paid: true, orderId: order.id });
    }

    if (checkResult.status === 'expired') {
      db.prepare(`UPDATE orders SET payment_status = 'expired' WHERE id = ?`).run(order.id);
      return res.json({ paid: false, status: 'expired' });
    }

    return res.json({ paid: false, status: checkResult.status || order.payment_status });
  } catch (err) {
    console.error('[bakong] checkBakongPayment error:', err);
    res.status(500).json({ paid: false, error: err.message });
  }
}

// POST /api/payments/webhook
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = secret
      ? stripe.webhooks.constructEvent(req.body, sig, secret)
      : JSON.parse(req.body.toString());
  } catch (err) {
    console.error('[stripe webhook] signature check failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    db.prepare(
      `UPDATE orders SET payment_status = 'paid' WHERE payment_intent_id = ?`
    ).run(intent.id);
    console.log(`[stripe webhook] payment_intent.succeeded for ${intent.id}`);
  }

  res.json({ received: true });
}

export { stripe };
