// scripts/fetch-decor-images.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../src/assets');

// Create folders if they don't exist
const folders = ['banners', 'blog'];
folders.forEach(folder => {
  const folderPath = path.join(assetsDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`📁 Created folder: src/assets/${folder}`);
  }
});

// Images to download - ADDED shoes and accessories
const images = {
  'banners/men-banner.jpg': 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1600&h=520&fit=crop',
  'banners/women-banner.jpg': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=520&fit=crop',
  'banners/kids-banner.jpg': 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=1600&h=520&fit=crop',
  'banners/shoes-banner.jpg': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1600&h=520&fit=crop',
  'banners/accessories-banner.jpg': 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1600&h=520&fit=crop',
  'blog/blog-1.jpg': 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=350&fit=crop',
  'blog/blog-2.jpg': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=350&fit=crop',
  'blog/blog-3.jpg': 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=350&fit=crop'
};

async function downloadImage(url, relativePath) {
  try {
    console.log(`📥 Downloading: ${relativePath}...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    const fullPath = path.join(assetsDir, relativePath);
    
    fs.writeFileSync(fullPath, Buffer.from(buffer));
    console.log(`✅ Downloaded: src/assets/${relativePath}`);
  } catch (error) {
    console.error(`❌ Failed: src/assets/${relativePath}`, error.message);
  }
}

async function fetchAllImages() {
  console.log('📥 Starting download of decorative images...\n');
  
  const downloads = Object.entries(images).map(([relativePath, url]) => 
    downloadImage(url, relativePath)
  );
  
  await Promise.all(downloads);
  console.log('\n✅ All images downloaded successfully!');
  console.log('\n📁 Images saved to:');
  console.log('   - src/assets/banners/');
  console.log('   - src/assets/blog/');
}

fetchAllImages();