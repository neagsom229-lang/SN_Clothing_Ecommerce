import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import './src/db.js'; // opens the DB and seeds products on first run
import { stripeWebhook } from './src/controllers/payments.controller.js';
import authRoutes from './src/routes/auth.routes.js';
import productsRoutes from './src/routes/products.routes.js';
import ordersRoutes from './src/routes/orders.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

// Stripe webhook needs the RAW request body to verify the signature, so it
// must be registered before express.json() below.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SN Clothing backend running on http://localhost:${PORT}`);
});
