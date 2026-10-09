import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
  max: 10,
});

function loadSeedProducts() {
  const seedPath = path.join(__dirname, 'data', 'products.seed.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('⚠️ products.seed.json not found, skipping seed');
    return [];
  }
  const data = fs.readFileSync(seedPath, 'utf8');
  return JSON.parse(data);
}

export async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
    }

    const countRes = await pool.query('SELECT COUNT(*) AS n FROM products');
    const count = parseInt(countRes.rows[0].n, 10);
    if (count === 0) {
      const items = loadSeedProducts();
      if (items.length > 0) {
        for (const row of items) {
          await pool.query(
            `INSERT INTO products (id, name, brand, category, price, compareatprice, rating, stock, description, image)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [
              row.id,
              row.name,
              row.brand ?? null,
              row.category ?? null,
              row.price,
              row.compareAtPrice ?? null,
              row.rating ?? null,
              row.stock ?? 0,
              row.description ?? null,
              row.image ?? null,
            ]
          );
        }
        console.log(`[db] seeded ${items.length} products to PostgreSQL`);
      }
    }

    console.log('✅ PostgreSQL database initialized and connected (Supabase)');
  } catch (err) {
    console.error('❌ PostgreSQL initialization error:', err);
    throw err;
  }
}

export { isProduction };
