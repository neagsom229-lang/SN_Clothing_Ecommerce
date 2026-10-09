import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import DB and initDb
import { isProduction, initDb, pool } from './src/db.js';

import { stripeWebhook } from './src/controllers/payments.controller.js';
import authRoutes from './src/routes/auth.routes.js';
import productsRoutes from './src/routes/products.routes.js';
import ordersRoutes from './src/routes/orders.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';
import webhooksRouter from './src/routes/webhooks.routes.js';

const app = express();

// CORS
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true 
}));

// CSP Headers allowing KHQR.dev (environment-aware for Vite dev server & production)
app.use((_req, res, next) => {
  const csp = isProduction
    ? "default-src 'self'; connect-src 'self' https://api.khqr.dev https://checkout.khqr.dev wss://checkout.khqr.dev; frame-src https://checkout.khqr.dev; script-src 'self' https://checkout.khqr.dev; img-src 'self' data: https://api.khqr.dev; style-src 'self' 'unsafe-inline';"
    : "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' ws://localhost:5173 wss://localhost:5173 ws://127.0.0.1:5173 wss://127.0.0.1:5173 http://localhost:5000 https://api.khqr.dev https://checkout.khqr.dev; frame-src https://checkout.khqr.dev; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.khqr.dev; img-src 'self' data: https://api.khqr.dev; style-src 'self' 'unsafe-inline';";

  res.setHeader('Content-Security-Policy', csp);
  next();
});

// KHQR Webhook needs RAW body (mounted BEFORE express.json())
app.use('/api/webhooks', express.raw({ type: 'application/json', limit: '1mb' }), webhooksRouter);

// Stripe webhook needs RAW body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// JSON middleware for all other routes
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    environment: isProduction ? 'production' : 'development',
    database: 'PostgreSQL (Supabase)'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Initialize DB
try {
  await initDb();
} catch (err) {
  console.error('❌ Failed to initialize database:', err.message);
  process.exit(1);
}

// For local development, start the server
if (!isProduction) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 SN Clothing backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: development (PostgreSQL / Supabase)`);
  });

  // Auto-expire stale pending orders older than 15 minutes
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const result = await pool.query(
        `UPDATE orders SET payment_status = 'expired'
         WHERE payment_status = 'pending'
         AND payment_method = 'bakong'
         AND payment_expires_at < $1`,
        [cutoff]
      );
      if (result.rowCount > 0) {
        console.log(`[cleanup] Expired ${result.rowCount} stale pending orders`);
      }
    } catch (err) {
      console.error('[cleanup] error expiring pending orders:', err);
    }
  }, 5 * 60 * 1000);
}

export default app;
