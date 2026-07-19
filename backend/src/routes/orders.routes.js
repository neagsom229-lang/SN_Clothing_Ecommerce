import { Router } from 'express';
import { createOrder, listMyOrders, getOrder } from '../controllers/orders.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, createOrder);
router.get('/mine', requireAuth, listMyOrders);
router.get('/:id', optionalAuth, getOrder);

export default router;
