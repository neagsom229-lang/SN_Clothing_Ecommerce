import { pool } from '../db.js';

export async function listProducts(req, res) {
  try {
    const { category } = req.query;
    const query = category
      ? 'SELECT id, name, brand, category, price, compareatprice AS "compareAtPrice", rating, stock, description, image FROM products WHERE category = $1'
      : 'SELECT id, name, brand, category, price, compareatprice AS "compareAtPrice", rating, stock, description, image FROM products';
    const params = category ? [category] : [];
    const result = await pool.query(query, params);
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProduct(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, name, brand, category, price, compareatprice AS "compareAtPrice", rating, stock, description, image FROM products WHERE id = $1',
      [req.params.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
