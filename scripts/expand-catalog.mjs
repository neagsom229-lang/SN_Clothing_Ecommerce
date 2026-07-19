import fs from 'fs/promises';
import path from 'path';

const ROOT = process.argv[2];
const OUT_DIR = path.join(ROOT, 'public', 'products');
await fs.mkdir(OUT_DIR, { recursive: true });
const UA = { 'User-Agent': 'website401-catalog-builder/1.0 (student project; contact krysaven@gmail.com)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const extFromUrl = (url, fb = 'jpg') => {
  const m = url.split('?')[0].match(/\.(jpg|jpeg|png|webp)$/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : fb;
};

async function download(url, slug, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 429) { await sleep(4000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 3000) throw new Error('too small');
    const file = `${slug}.${extFromUrl(url)}`;
    await fs.writeFile(path.join(OUT_DIR, file), buf);
    return { path: `/products/${file}`, bytes: buf.length, title: decodeURIComponent(url.split('/').pop()) };
  }
  throw new Error('rate-limited');
}
async function commonsImage(query, w = 700) {
  const api =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10` +
    `&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=${w}&format=json`;
  const json = await (await fetch(api, { headers: UA })).json();
  const pages = Object.values(json.query?.pages || {}).sort(
    (a, b) => (a.index ?? 99) - (b.index ?? 99)
  );
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    if (ii?.thumburl && /image\/(jpeg|png)/i.test(ii.mime || '') && (ii.thumbwidth || ii.width || 0) >= 300) {
      return ii.thumburl;
    }
  }
  throw new Error(`no image for "${query}"`);
}

// New items to enrich each brand. category/brand/price/rating/stock/description/query.
const NEW = [
  // Gaming
  { name: 'PlayStation VR2', brand: 'PlayStation', category: 'gaming', price: 549.99, rating: 4.6, stock: 14, description: 'PSVR2 headset with 4K HDR, eye tracking, and haptic feedback.', query: 'PlayStation VR2' },
  { name: 'Xbox Series S', brand: 'Xbox', category: 'gaming', price: 299.0, rating: 4.7, stock: 25, description: 'Compact all-digital next-gen console, 1440p gaming at 120fps.', query: 'Xbox Series S' },
  { name: 'Nintendo Switch Lite', brand: 'Nintendo', category: 'gaming', price: 199.99, rating: 4.6, stock: 33, description: 'Dedicated handheld Switch — lightweight and pocketable.', query: 'Nintendo Switch Lite' },
  { name: 'Meta Quest 2', brand: 'Meta', category: 'gaming', price: 249.0, rating: 4.4, stock: 21, description: 'All-in-one VR headset with a huge library of games and apps.', query: 'Oculus Quest 2' },
  // Laptops
  { name: 'Apple MacBook Air 13"', brand: 'Apple', category: 'laptop', price: 1099.0, rating: 4.9, stock: 19, description: 'Strikingly thin, silent, and fast — up to 18 hours of battery.', query: 'MacBook Air laptop' },
  { name: 'Asus ROG Strix Gaming Laptop', brand: 'Asus', category: 'laptop', price: 1699.0, rating: 4.7, stock: 8, description: 'High-refresh gaming laptop with RGB and powerful cooling.', query: 'Asus ROG laptop' },
  { name: 'Dell XPS 15', brand: 'Dell', category: 'laptop', price: 1799.0, rating: 4.6, stock: 10, description: '15.6" InfinityEdge display, creator-grade performance.', query: 'Dell XPS 15 laptop' },
  { name: 'Lenovo ThinkPad X1 Carbon', brand: 'Lenovo', category: 'laptop', price: 1549.0, rating: 4.7, stock: 12, description: 'Business-class durability with a legendary keyboard.', query: 'Lenovo ThinkPad X1 Carbon' },
  { name: 'HP Spectre x360', brand: 'HP', category: 'laptop', price: 1249.0, rating: 4.5, stock: 15, description: 'Convertible 2-in-1 with a gem-cut design and OLED touch.', query: 'HP Spectre x360 laptop' },
  { name: 'Huawei MateBook D 16', brand: 'Huawei', category: 'laptop', price: 899.0, rating: 4.3, stock: 17, description: 'Slim all-metal everyday laptop with a big 16" display.', query: 'Huawei MateBook laptop' },
  // Accessories
  { name: 'Sony WH-1000XM4 Headphones', brand: 'Sony', category: 'accessory', price: 279.99, rating: 4.8, stock: 26, description: 'Industry-leading noise cancelling with 30-hour battery.', query: 'Sony WH-1000XM4 headphones' },
  { name: 'Logitech MX Master 3 Mouse', brand: 'Logitech', category: 'accessory', price: 99.99, rating: 4.8, stock: 40, description: 'Precision wireless mouse with MagSpeed scrolling.', query: 'Logitech MX Master mouse' },
  { name: 'Logitech MX Keys Keyboard', brand: 'Logitech', category: 'accessory', price: 119.99, rating: 4.6, stock: 32, description: 'Comfortable, quiet wireless keyboard with smart backlighting.', query: 'Logitech keyboard' },
  { name: 'Razer DeathAdder Gaming Mouse', brand: 'Razer', category: 'accessory', price: 69.99, rating: 4.7, stock: 38, description: 'Ergonomic esports mouse with a high-precision optical sensor.', query: 'Razer DeathAdder mouse' },
  { name: 'Anker Power Bank 20000mAh', brand: 'Anker', category: 'accessory', price: 49.99, rating: 4.6, stock: 60, description: 'High-capacity fast-charging portable battery with USB-C PD.', query: 'Anker power bank' },
];

const mod = await import('file://' + path.join(ROOT, 'src', 'data', 'catalog.js').replace(/\\/g, '/'));
const existing = mod.CATALOG.map((p) => {
  const copy = { ...p };
  delete copy.id; // drop ids, they'll be reassigned after merge
  return copy;
});

const added = [];
for (const item of NEW) {
  const slug = `${item.category}-${slugify(item.name)}`;
  let image = null;
  let title = '';
  try {
    const url = await commonsImage(item.query);
    const dl = await download(url, slug);
    image = dl.path;
    title = dl.title;
  } catch (e) {
    title = e.message;
  }
  const { query, ...rest } = item;
  void query;
  added.push({ ...rest, image });
  console.log(`${image ? 'OK  ' : 'MISS'} ${item.category}/${item.brand}  ${item.name}  <- ${title}`);
  await sleep(3200);
}

// Merge, sort by category then brand then name, reassign ids.
const catRank = { gaming: 0, laptop: 1, accessory: 2 };
const merged = [...existing, ...added].sort((a, b) => {
  if (catRank[a.category] !== catRank[b.category]) return catRank[a.category] - catRank[b.category];
  if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
  return a.name.localeCompare(b.name);
});
const withIds = merged.map((p, i) => ({ id: i + 1, ...p }));

const body =
  `// AUTO-GENERATED by scripts/build-catalog.mjs (+ expand) — real data + local images.\n` +
  `// Images live in /public/products and are served from /products/*.\n` +
  `export const CATALOG = ${JSON.stringify(withIds, null, 2)};\n`;
await fs.writeFile(path.join(ROOT, 'src', 'data', 'catalog.js'), body);

console.log(`\nTotal products: ${withIds.length}. Missing images: ${withIds.filter((p) => !p.image).length}`);
