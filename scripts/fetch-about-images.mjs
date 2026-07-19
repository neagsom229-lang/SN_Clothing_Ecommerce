// scripts/fetch-about-images.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../src/assets/banners');

// Download specific images for About page
const images = {
  'about-hero.jpg': 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&h=600&fit=crop',
  'about-story.jpg': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=500&fit=crop',
  'about-growth.jpg': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=500&fit=crop'
};

async function downloadImage(url, filename) {
  try {
    console.log(`📥 Downloading: ${filename}...`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const filepath = path.join(assetsDir, filename);
    fs.writeFileSync(filepath, Buffer.from(buffer));
    console.log(`✅ Downloaded: src/assets/banners/${filename}`);
  } catch (error) {
    console.error(`❌ Failed: ${filename}`, error.message);
  }
}

async function downloadAboutImages() {
  console.log('📥 Downloading About page images...\n');
  for (const [filename, url] of Object.entries(images)) {
    await downloadImage(url, filename);
  }
  console.log('\n✅ Done!');
}

downloadAboutImages();