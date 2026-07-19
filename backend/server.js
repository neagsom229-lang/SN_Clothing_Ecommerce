import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import DB (this runs the connection)
import './src/db.js';
import { isProduction } from './src/db.js';

import { stripeWebhook } from './src/controllers/payments.controller.js';
import authRoutes from './src/routes/auth.routes.js';
import productsRoutes from './src/routes/products.routes.js';
import ordersRoutes from './src/routes/orders.routes.js';
import paymentsRoutes from './src/routes/payments.routes.js';

const app = express();

// CORS
app.use(cors({ 
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true 
}));

// Stripe webhook needs RAW body
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// JSON middleware for all other routes
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    ok: true, 
    environment: isProduction ? 'production' : 'development',
    database: isProduction ? 'MongoDB' : 'SQLite'
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

// =============================================
// ✅ FIXED: Export at TOP LEVEL for Vercel
// =============================================

// For local development, start the server
if (!isProduction) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 SN Clothing backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: development (SQLite)`);
  });
}

// ✅ EXPORT at top level (not inside conditional)
export default app;