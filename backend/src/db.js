import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =============================================
// Environment Detection
// =============================================
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

// =============================================
// SQLite Setup (Development Only)
// =============================================
let db = null;

if (!isProduction) {
  const dbPath = path.join(__dirname, '..', 'sn_clothing.sqlite');
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  // Create SQLite tables
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
      items_json        TEXT NOT NULL,
      shipping_json     TEXT NOT NULL,
      subtotal          REAL NOT NULL,
      shipping_fee      REAL NOT NULL,
      total             REAL NOT NULL,
      currency          TEXT NOT NULL DEFAULT 'usd',
      payment_provider  TEXT NOT NULL DEFAULT 'stripe',
      payment_intent_id TEXT,
      payment_status    TEXT NOT NULL DEFAULT 'pending',
      status_index      INTEGER NOT NULL DEFAULT 1,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed SQLite
  await seedProductsSQLite();
  console.log('✅ SQLite database initialized (Development)');
} else {
  // =============================================
  // MongoDB Setup (Production)
  // =============================================
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully (Production)');
    
    // Seed MongoDB
    await seedProductsMongo();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// =============================================
// Seed Functions
// =============================================

// Load products from seed file
function loadSeedProducts() {
  const seedPath = path.join(__dirname, 'data', 'products.seed.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('⚠️  products.seed.json not found, skipping seed');
    return [];
  }
  const data = fs.readFileSync(seedPath, 'utf8');
  return JSON.parse(data);
}

// SQLite Seed
async function seedProductsSQLite() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
  if (count > 0) return;

  const items = loadSeedProducts();
  if (items.length === 0) return;

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
    console.log(`[db] seeded ${items.length} products to SQLite`);
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

// MongoDB Seed
async function seedProductsMongo() {
  // Define Product model if not already defined
  let Product;
  try {
    Product = mongoose.model('Product');
  } catch {
    const productSchema = new mongoose.Schema({
      id: { type: Number, unique: true },
      name: { type: String, required: true },
      brand: String,
      category: String,
      price: { type: Number, required: true },
      compareAtPrice: Number,
      rating: Number,
      stock: { type: Number, default: 0 },
      description: String,
      image: String,
    }, { timestamps: true });
    Product = mongoose.model('Product', productSchema);
  }

  const count = await Product.countDocuments();
  if (count > 0) return;

  const items = loadSeedProducts();
  if (items.length === 0) return;

  await Product.insertMany(items);
  console.log(`[db] seeded ${items.length} products to MongoDB`);
}

// =============================================
// Exports
// =============================================
export { db, isProduction };