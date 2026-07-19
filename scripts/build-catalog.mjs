import fs from 'fs/promises';
import path from 'path';

const ROOT = process.argv[2]; // project root passed in
const OUT_DIR = path.join(ROOT, 'public', 'products');
await fs.mkdir(OUT_DIR, { recursive: true });

const UA = { 'User-Agent': 'website401-catalog-builder/1.0 (student project)' };

function extFromUrl(url, fallback = 'jpg') {
  const m = url.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : fallback;
}

async function download(url, slug) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error(`too small (${buf.length}b) ${url}`);
  const ext = extFromUrl(url, 'jpg');
  const file = `${slug}.${ext}`;
  await fs.writeFile(path.join(OUT_DIR, file), buf);
  return { path: `/products/${file}`, bytes: buf.length };
}

// Resolve a subject-correct image URL from Wikimedia Commons search.
async function commonsImage(query, w = 800) {
  const api =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8` +
    `&prop=imageinfo&iiprop=url|mime&iiurlwidth=${w}&format=json`;
  const res = await fetch(api, { headers: UA });
  const json = await res.json();
  const pages = Object.values(json.query?.pages || {});
  pages.sort((a, b) => (a.index ?? 99) - (b.index ?? 99));
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (ii?.thumburl && /image\/(jpeg|png)/i.test(ii.mime || '')) {
      return ii.thumburl;
    }
  }
  throw new Error(`no commons image for "${query}"`);
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const catalog = [];
let nextId = 1;
const push = (p) => catalog.push({ id: nextId++, ...p });

// ---------------------------------------------------------------------------
// GAMING — real photos via Wikimedia Commons (subject-verified search)
// ---------------------------------------------------------------------------
const gaming = [
  { name: 'PlayStation 5 Console', brand: 'PlayStation', price: 499.99, rating: 4.9, stock: 12,
    description: 'Next-gen 4K console with ultra-fast SSD, ray tracing, and 3D audio.',
    query: 'Sony PlayStation 5 console' },
  { name: 'DualSense Wireless Controller', brand: 'PlayStation', price: 69.99, rating: 4.7, stock: 40,
    description: 'Haptic feedback and adaptive triggers for deeper immersion.',
    query: 'DualSense controller' },
  { name: 'Xbox Series X', brand: 'Xbox', price: 499.0, rating: 4.8, stock: 9,
    description: 'The fastest, most powerful Xbox with 1TB SSD and 4K/120fps.',
    query: 'Xbox Series X console' },
  { name: 'Xbox Wireless Controller', brand: 'Xbox', price: 59.99, rating: 4.6, stock: 55,
    description: 'Textured grip, hybrid D-pad, and dedicated share button.',
    query: 'Xbox wireless controller' },
  { name: 'Nintendo Switch OLED', brand: 'Nintendo', price: 349.99, rating: 4.8, stock: 20,
    description: 'Vibrant 7" OLED screen — play at home or on the go.',
    query: 'Nintendo Switch console' },
  { name: 'Meta Quest 3 VR Headset', brand: 'Meta', price: 499.0, rating: 4.5, stock: 15,
    description: 'Breakthrough mixed reality with 4K+ Infinite Display.',
    query: 'Meta Quest VR headset' },
  { name: 'Wireless Gaming Headset', brand: 'Razer', price: 129.99, rating: 4.4, stock: 30,
    description: 'Surround-sound gaming headset with a noise-cancelling mic.',
    query: 'gaming headset' },
];

for (const g of gaming) {
  const slug = `gaming-${slugify(g.name)}`;
  let image = null;
  try {
    const url = await commonsImage(g.query);
    const dl = await download(url, slug);
    image = dl.path;
    console.log(`OK   gaming  ${g.name}  <- ${dl.bytes}b`);
  } catch (e) {
    console.log(`MISS gaming  ${g.name}  (${e.message})`);
  }
  const { query, ...rest } = g;
  void query;
  push({ ...rest, category: 'gaming', image });
}

// ---------------------------------------------------------------------------
// LAPTOPS + ACCESSORIES — real photos from dummyjson (real product renders)
// ---------------------------------------------------------------------------
async function dummy(category) {
  const url = `https://dummyjson.com/products/category/${category}?limit=40&select=id,title,brand,price,description,rating,stock,thumbnail`;
  const res = await fetch(url, { headers: UA });
  return (await res.json()).products;
}

const laptops = await dummy('laptops');
for (const p of laptops) {
  const slug = `laptop-${slugify(p.title)}`;
  let image = null;
  try {
    const dl = await download(p.thumbnail, slug);
    image = dl.path;
    console.log(`OK   laptop  ${p.title}  <- ${dl.bytes}b`);
  } catch (e) {
    console.log(`MISS laptop  ${p.title}  (${e.message})`);
  }
  push({
    name: p.title,
    brand: p.brand || 'Generic',
    category: 'laptop',
    price: Math.round(p.price * 100) / 100,
    rating: Math.round(p.rating * 10) / 10,
    stock: p.stock,
    description: p.description,
    image,
  });
}

const accWanted = new Set([99, 100, 101, 103, 104, 105, 106, 107]);
const acc = (await dummy('mobile-accessories')).filter((p) => accWanted.has(p.id));
for (const p of acc) {
  const slug = `acc-${slugify(p.title)}`;
  let image = null;
  try {
    const dl = await download(p.thumbnail, slug);
    image = dl.path;
    console.log(`OK   acc     ${p.title}  <- ${dl.bytes}b`);
  } catch (e) {
    console.log(`MISS acc     ${p.title}  (${e.message})`);
  }
  push({
    name: p.title,
    brand: p.brand || 'Generic',
    category: 'accessory',
    price: Math.round(p.price * 100) / 100,
    rating: Math.round(p.rating * 10) / 10,
    stock: p.stock,
    description: p.description,
    image,
  });
}

// ---------------------------------------------------------------------------
// Emit catalog module
// ---------------------------------------------------------------------------
const body =
  `// AUTO-GENERATED by scripts/build-catalog.mjs — real product data + local images.\n` +
  `// Images live in /public/products and are served from /products/*.\n` +
  `export const CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;

await fs.writeFile(path.join(ROOT, 'src', 'data', 'catalog.js'), body);

const missing = catalog.filter((p) => !p.image).length;
console.log(`\nWrote src/data/catalog.js — ${catalog.length} products, ${missing} without image.`);
