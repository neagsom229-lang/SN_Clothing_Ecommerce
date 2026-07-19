// scripts/fetch-blog2.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../src/assets/blog');

// Try a different image URL
const urls = [
  'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=350&fit=crop',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=350&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=350&fit=crop'
];

async function downloadBlog2() {
  for (const url of urls) {
    try {
      console.log('📥 Trying to download blog-2.jpg...');
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const filepath = path.join(assetsDir, 'blog-2.jpg');
        fs.writeFileSync(filepath, Buffer.from(buffer));
        console.log('✅ Downloaded: src/assets/blog/blog-2.jpg');
        return;
      }
    } catch (error) {
      console.log('❌ Failed, trying next URL...');
    }
  }
  console.log('💡 Using hero.png as fallback');
}

downloadBlog2();