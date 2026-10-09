import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

const rawUrl = process.env.DATABASE_URL || '';
const sanitizedUrl = rawUrl
  .replace(/([?&])sslmode=[^&]*/g, '$1')
  .replace(/[?&]+$/, '');

let urlObj;
try {
  urlObj = new URL(sanitizedUrl);
  console.log(`[db] Connecting to ${urlObj.hostname}:${urlObj.port}...`);
} catch (e) {
  console.warn('[db] Could not parse DATABASE_URL with URL constructor:', e.message);
}

const isLocal = urlObj ? (urlObj.hostname.includes('localhost') || urlObj.hostname.includes('127.0.0.1')) : false;

export const pool = new Pool({
  connectionString: sanitizedUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  allowExitOnIdle: false,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected pg pool error:', err.message);
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
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    // Run schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('✅ Schema initialized');
    }

    // Seed products if empty
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
        console.log(`📦 Seeded ${items.length} products`);
      }
    }
  } catch (err) {
    console.error('❌ PostgreSQL initialization error:', err.message);
    throw err;
  }
}

export { isProduction };
