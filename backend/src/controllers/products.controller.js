import { db } from '../db.js';

export function listProducts(req, res) {
  const { category } = req.query;
  const rows = category
    ? db.prepare('SELECT * FROM products WHERE category = ?').all(category)
    : db.prepare('SELECT * FROM products').all();
  res.json({ products: rows });
}

export function getProduct(req, res) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found.' });
  res.json({ product: row });
}
