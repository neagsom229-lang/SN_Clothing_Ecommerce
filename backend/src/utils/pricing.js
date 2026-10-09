import { pool } from '../db.js';

// Mirrors src/data/checkout.js EXPRESS_CARRIERS on the frontend.
// Kept server-side too so a client can never alter the shipping fee.
export const CARRIERS = {
  jt: { carrier: 'J&T Express', fee: 1.25 },
  virak: { carrier: 'Vireak Buntham', fee: 2.0 },
  mekong: { carrier: 'Mekong Express', fee: 1.75 },
  pickup: { carrier: 'Store Pickup', fee: 0 },
};

// Recomputes the order total from the database, never from client-sent prices.
// Returns { lines, subtotal, shippingFee, total } or throws with a message.
export async function priceCart(items, carrierKey) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty.');
  }
  const carrier = CARRIERS[carrierKey];
  if (!carrier) throw new Error('Choose a valid delivery carrier.');

  const lines = [];
  for (const item of items) {
    const safeId = Number(item.id);
    const res = await pool.query('SELECT * FROM products WHERE id = $1', [safeId]);
    const product = res.rows[0];
    if (!product) throw new Error(`Product ${item.id} does not exist.`);
    const safeQty = Math.max(1, Number(item.qty) || 1);
    lines.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: safeQty,
      size: item.size || null,
      lineTotal: Math.round(product.price * safeQty * 100) / 100,
    });
  }

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const shippingFee = carrier.fee;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  return { lines, subtotal, shippingFee, total, carrier: carrier.carrier };
}
