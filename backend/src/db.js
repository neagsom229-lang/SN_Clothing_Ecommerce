import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Uses Node's own built-in SQLite (node:sqlite) instead of a native npm
// package like better-sqlite3. Node ships this itself — no compiler, no
// Visual Studio / Xcode / build-essential needed on any OS, it just works
// out of the box with the Node.js installer.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'sn_clothing.sqlite');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// ---------------------------------------------------------------- schema --
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    brand           TEXT,
    category        TEXT,
    price           REAL NOT NULL,
    compareAtPrice  REAL,
    rating          REAL,
    stock           INTEGER DEFAULT 0,
    description     TEXT,
    image           TEXT
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number      TEXT NOT NULL UNIQUE,
    tracking_number   TEXT,
    user_id           INTEGER REFERENCES users(id),
    items_json        TEXT NOT NULL,       -- [{productId, name, price, qty, size, lineTotal}]
    shipping_json     TEXT NOT NULL,       -- {fullName, phone, province, addressLine, carrier}
    subtotal          REAL NOT NULL,
    shipping_fee      REAL NOT NULL,
    total             REAL NOT NULL,
    currency          TEXT NOT NULL DEFAULT 'usd',
    payment_provider  TEXT NOT NULL DEFAULT 'stripe',
    payment_intent_id TEXT,
    payment_status    TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed
    status_index      INTEGER NOT NULL DEFAULT 1,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------------------------------------------------------------- seed ----
// Load the same 35 products the React frontend ships with (src/data/catalog.js)
// so the backend can independently verify prices instead of trusting the client.
function seedProducts() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count > 0) return;

  const seedPath = path.join(__dirname, 'data', 'products.seed.json');
  const items = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

  const insert = db.prepare(`
    INSERT INTO products (id, name, brand, category, price, compareAtPrice, rating, stock, description, image)
    VALUES (@id, @name, @brand, @category, @price, @compareAtPrice, @rating, @stock, @description, @image)
  `);

  db.exec('BEGIN');
  try {
    for (const row of items) {
      insert.run({
        id: row.id,
        name: row.name,
        brand: row.brand ?? null,
        category: row.category ?? null,
        price: row.price,
        compareAtPrice: row.compareAtPrice ?? null,
        rating: row.rating ?? null,
        stock: row.stock ?? 0,
        description: row.description ?? null,
        image: row.image ?? null,
      });
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log(`[db] seeded ${items.length} products`);
}

seedProducts();
