import { Router } from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { khqrConfig } from '../config/khqr.js';

const router = Router();

// Simple in-memory processed events cache with 24h TTL (production should use Redis / DB)
const processedEvents = new Map(); // key -> timestamp

function cleanupProcessedEvents() {
  const now = Date.now();
  for (const [key, ts] of processedEvents.entries()) {
    if (now - ts > 24 * 60 * 60 * 1000) {
      processedEvents.delete(key);
    }
  }
}
setInterval(cleanupProcessedEvents, 60 * 60 * 1000);

// Middleware to verify KHQR webhook signature & delivery timestamp
function verifyWebhook(req, res, next) {
  const signatureHeader = req.headers['x-rbk-signature'];
  const deliveryHeader = req.headers['x-rbk-delivery'];

  if (!signatureHeader || !deliveryHeader) {
    return res.status(400).json({ error: 'Missing KHQR webhook headers.' });
  }

  const deliveryMs = parseInt(deliveryHeader, 10);
  if (isNaN(deliveryMs) || Math.abs(Date.now() - deliveryMs) > 5 * 60 * 1000) {
    return res.status(400).json({ error: 'Webhook delivery timestamp invalid or outside 5-minute window.' });
  }

  const secret = khqrConfig.webhookSecret;
  if (!secret) {
    console.error('[webhook] KHQR_WEBHOOK_SECRET is not configured.');
    return res.status(500).json({ error: 'Webhook secret not configured on server.' });
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ error: 'Request body must be a raw buffer.' });
  }

  try {
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    const sigBuffer = Buffer.from(signatureHeader, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (sigBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(sigBuffer, computedBuffer)) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    const payloadStr = req.body.toString('utf8');
    req.webhookPayload = JSON.parse(payloadStr);
    next();
  } catch (err) {
    console.error('[webhook] verification error:', err);
    return res.status(400).json({ error: 'Invalid webhook payload or signature verification failed.' });
  }
}

router.post('/khqr', verifyWebhook, async (req, res) => {
  try {
    const { event, data } = req.webhookPayload || {};
    if (!event || !data || !data.md5) {
      return res.status(400).json({ error: 'Invalid webhook payload structure.' });
    }

    // Idempotency check
    const eventKey = `${event}:${data.md5}:${data.tran_id || ''}`;
    if (processedEvents.has(eventKey)) {
      return res.json({ received: true, duplicate: true });
    }

    const orderRes = await pool.query('SELECT * FROM orders WHERE bakong_md5 = $1', [data.md5]);
    const order = orderRes.rows[0];

    if (event === 'payment.success') {
      if (order) {
        // Re-verify amount server-side against DB record (data.amount vs order.total)
        const paidAmount = Number(data.amount);
        const expectedTotal = Number(order.total);
        if (!isNaN(paidAmount) && Math.abs(paidAmount - expectedTotal) > 0.01) {
          console.error(`[webhook] Amount mismatch for MD5 ${data.md5}: paid ${paidAmount}, expected ${expectedTotal}`);
        }

        await pool.query(
          `UPDATE orders SET payment_status = 'paid', paid_at = NOW(), bakong_tran_id = COALESCE($1, bakong_tran_id) WHERE id = $2`,
          [data.tran_id || null, order.id]
        );
        console.log(`[webhook] payment.success processed for order ID ${order.id} (MD5: ${data.md5})`);
      } else {
        console.warn(`[webhook] payment.success received for unknown MD5: ${data.md5}`);
      }
    } else if (event === 'payment.expired') {
      if (order && order.payment_status === 'pending') {
        await pool.query(`UPDATE orders SET payment_status = 'expired' WHERE id = $1`, [order.id]);
        console.log(`[webhook] payment.expired processed for order ID ${order.id}`);
      }
    } else if (event === 'payment.scanned') {
      console.log(`[webhook] payment.scanned received for MD5: ${data.md5}`);
    }

    processedEvents.set(eventKey, Date.now());
    return res.json({ received: true });
  } catch (err) {
    console.error('[webhook] processing error:', err);
    return res.status(500).json({ error: err.message || 'Internal webhook error' });
  }
});

export default router;
