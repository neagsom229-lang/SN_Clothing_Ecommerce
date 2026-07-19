import Stripe from 'stripe';
import { db } from '../db.js';
import { priceCart } from '../utils/pricing.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// POST /api/payments/create-intent
// Body: { items: [{ id, qty, size }], carrier: 'jt' | 'virak' | 'mekong' }
// Prices are recomputed here from the database — the client never sets the
// amount that gets charged.
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
      amount: Math.round(priced.total * 100), // Stripe expects the smallest currency unit (cents)
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

// POST /api/payments/webhook
// Stripe calls this directly (not the browser). Requires the raw request body,
// see server.js for why this route is mounted before the JSON body parser.
// Optional for local testing — the /api/orders endpoint already re-verifies the
// PaymentIntent status with Stripe before saving an order.
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
