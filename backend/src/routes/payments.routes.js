import { Router } from 'express';
import { createPaymentIntent, createBakongQr, checkBakongPayment } from '../controllers/payments.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Stripe
router.post('/create-intent', createPaymentIntent);

// Bakong KHQR
router.post('/bakong/create-qr', optionalAuth, createBakongQr);
router.get('/bakong/check/:md5', optionalAuth, checkBakongPayment);

export default router;
