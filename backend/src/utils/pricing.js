import { db } from '../db.js';

// Mirrors src/data/checkout.js EXPRESS_CARRIERS on the frontend.
// Kept server-side too so a client can never alter the shipping fee.
export const CARRIERS = {
  jt: { carrier: 'J&T Express', fee: 1.25 },
  virak: { carrier: 'Vireak Buntham', fee: 2.0 },
  mekong: { carrier: 'Mekong Express', fee: 1.75 },
};

// Recomputes the order total from the database, never from client-sent prices.
// Returns { lines, subtotal, shippingFee, total } or throws with a message.
export function priceCart(items, carrierKey) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Cart is empty.');
  }
  const carrier = CARRIERS[carrierKey];
  if (!carrier) throw new Error('Choose a valid delivery carrier.');

  const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
  const lines = items.map(({ id, qty, size }) => {
    const product = stmt.get(id);
    if (!product) throw new Error(`Product ${id} does not exist.`);
    const safeQty = Math.max(1, Number(qty) || 1);
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      qty: safeQty,
      size: size || null,
      lineTotal: Math.round(product.price * safeQty * 100) / 100,
    };
  });

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;
  const shippingFee = carrier.fee;
  const total = Math.round((subtotal + shippingFee) * 100) / 100;

  return { lines, subtotal, shippingFee, total, carrier: carrier.carrier };
}
