import { Router } from 'express';
import { createPaymentIntent } from '../controllers/payments.controller.js';

const router = Router();

// The webhook route is mounted separately in server.js (needs the raw body).
router.post('/create-intent', createPaymentIntent);

export default router;
