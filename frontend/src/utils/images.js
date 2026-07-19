// src/utils/images.js

// Local SVG image generators + real image support.
// Everything the site shows can be drawn as SVG data URI OR use real images
// from assets or public folders.

const svg = (markup) =>
  `data:image/svg+xml,${encodeURIComponent(markup.replace(/\s+/g, ' ').trim())}`;

// --- Category theming -------------------------------------------------------
export const CATEGORY_THEME = {
  men: { from: '#1d4ed8', to: '#3b82f6', accent: '#93c5fd' },
  women: { from: '#be185d', to: '#ec4899', accent: '#fbcfe8' },
  kids: { from: '#d97706', to: '#f59e0b', accent: '#fde68a' },
  shoes: { from: '#374151', to: '#6b7280', accent: '#d1d5db' },
  accessories: { from: '#0f766e', to: '#14b8a6', accent: '#99f6e4' },
};

// --- Product icon shapes (drawn with primitives, no font dependency) --------
function iconMarkup(icon, accent) {
  switch (icon) {
    case 'shirt':
      return `
        <path d="M212 158 l44-22 44 26 44-22 44 22-18 40-26-12v98h-88v-98l-26 12z"
          fill="#fff"/>
        <rect x="272" y="190" width="56" height="10" rx="4" fill="${accent}"/>`;
    case 'jacket':
      return `
        <path d="M204 156 l48-24 48 20 48-20 48 24-14 44-34-14v92h-96v-92l-34 14z"
          fill="#fff"/>
        <rect x="296" y="172" width="8" height="120" fill="${accent}"/>
        <circle cx="290" cy="196" r="4" fill="${accent}"/>
        <circle cx="290" cy="220" r="4" fill="${accent}"/>
        <circle cx="290" cy="244" r="4" fill="${accent}"/>`;
    case 'dress':
      return `
        <path d="M256 148 l30 18 30-18 12 34-16 10 30 100h-112l30-100-16-10z" fill="#fff"/>
        <rect x="286" y="166" width="28" height="10" rx="4" fill="${accent}"/>`;
    case 'kidswear':
      return `
        <path d="M220 168 l36-18 44 24 44-24 36 18-14 34-22-10v82h-88v-82l-22 10z" fill="#fff"/>
        <circle cx="300" cy="216" r="14" fill="${accent}"/>`;
    case 'shoe':
      return `
        <path d="M188 268 h224 a10 10 0 0 0 10-10 c0-14-10-18-24-22-18-5-34-14-46-28
          l-30-34-70 10 c-10 2-16 10-16 20 v44 a20 20 0 0 0 20 20z" fill="#fff"/>
        <rect x="188" y="256" width="234" height="12" fill="${accent}"/>`;
    case 'watch':
      return `
        <rect x="272" y="140" width="56" height="34" rx="6" fill="#fff"/>
        <rect x="272" y="272" width="56" height="34" rx="6" fill="#fff"/>
        <circle cx="300" cy="222" r="52" fill="#fff"/>
        <circle cx="300" cy="222" r="36" fill="${accent}"/>
        <rect x="296" y="192" width="8" height="34" rx="3" fill="#fff"/>`;
    case 'bag':
      return `
        <path d="M216 200 h168 l14 96h-196z" fill="#fff"/>
        <path d="M244 200 v-20 a56 56 0 0 1 112 0 v20" fill="none" stroke="#fff" stroke-width="12"/>
        <rect x="270" y="222" width="60" height="10" rx="4" fill="${accent}"/>`;
    case 'hub':
    default:
      return `
        <rect x="228" y="196" width="144" height="46" rx="12" fill="#fff"/>
        <rect x="296" y="150" width="8" height="48" rx="4" fill="#fff"/>
        <rect x="244" y="212" width="20" height="12" rx="2" fill="${accent}"/>
        <rect x="272" y="212" width="20" height="12" rx="2" fill="${accent}"/>
        <rect x="300" y="212" width="20" height="12" rx="2" fill="${accent}"/>
        <rect x="328" y="212" width="20" height="12" rx="2" fill="${accent}"/>`;
  }
}

// --- NEW: Real image support functions --------------------------------------

// Get product image with fallback to SVG
export function getProductImage(product) {
  // If product has an image, use it
  if (product.image) {
    return product.image;
  }
  
  // Otherwise generate SVG fallback
  return productImage({
    name: product.name,
    brand: product.brand,
    category: product.category,
    icon: product.icon || getIconForCategory(product.category)
  });
}

// Get icon based on category (for fallback)
function getIconForCategory(category) {
  const iconMap = {
    men: 'shirt',
    women: 'dress',
    kids: 'kidswear',
    shoes: 'shoe',
    accessories: 'bag',
    gaming: 'hub',
    laptop: 'hub'
  };
  return iconMap[category] || 'hub';
}

// Get media image with fallback to SVG
export function getMediaImage(key, mediaConfig) {
  // If media object has a real path, use it
  if (mediaConfig && mediaConfig[key]) {
    return mediaConfig[key];
  }
  
  // Otherwise fallback to SVG generated images
  const bannerMap = {
    bannerMen: { title: "Men's Collection", subtitle: 'Timeless Style', category: 'men' },
    bannerWomen: { title: "Women's Collection", subtitle: 'Elegance & Comfort', category: 'women' },
    bannerKids: { title: "Kids' Collection", subtitle: 'Playful & Durable', category: 'kids' },
  };
  
  const config = bannerMap[key];
  if (config) {
    return bannerImage(config);
  }
  
  // For blog covers
  if (key.startsWith('blog')) {
    const blogTitles = {
      blog1: 'Style Guide 2026',
      blog2: 'Sustainable Fashion',
      blog3: 'Seasonal Trends'
    };
    return coverImage(blogTitles[key] || 'Blog Post', key);
  }
  
  return coverImage('Media Image', key);
}

// --- Original SVG generators (kept for fallback) ----------------------------

// A product "photo": gradient card + drawn icon + brand tag + name.
export function productImage({ name = '', brand = '', category = 'accessories', icon }) {
  const theme = CATEGORY_THEME[category] || CATEGORY_THEME.accessories;
  const id = `g${Math.abs(hashCode(name + brand))}`;
  return svg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${theme.from}"/>
          <stop offset="1" stop-color="${theme.to}"/>
        </linearGradient>
      </defs>
      <rect width="600" height="450" fill="url(#${id})"/>
      <g transform="translate(0 -6)">${iconMarkup(icon, theme.accent)}</g>
      <text x="40" y="60" font-family="Segoe UI, Arial, sans-serif" font-size="22"
        font-weight="700" fill="#ffffff" opacity="0.9">${escapeXml(brand)}</text>
      <text x="300" y="360" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="30" font-weight="700" fill="#ffffff">${escapeXml(truncate(name, 26))}</text>
      <text x="300" y="398" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="18" fill="#ffffff" opacity="0.85">${escapeXml(category.toUpperCase())}</text>
    </svg>`);
}

// Wide banner for the home slider.
export function bannerImage({ title = '', subtitle = '', category = 'women' }) {
  const theme = CATEGORY_THEME[category] || CATEGORY_THEME.women;
  const id = `b${Math.abs(hashCode(title))}`;
  return svg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="520" viewBox="0 0 1600 520">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${theme.from}"/>
          <stop offset="1" stop-color="${theme.to}"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="520" fill="url(#${id})"/>
      <circle cx="1300" cy="120" r="260" fill="#ffffff" opacity="0.06"/>
      <circle cx="1180" cy="440" r="180" fill="#ffffff" opacity="0.06"/>
      <text x="120" y="250" font-family="Segoe UI, Arial, sans-serif" font-size="72"
        font-weight="800" fill="#ffffff">${escapeXml(title)}</text>
      <text x="124" y="320" font-family="Segoe UI, Arial, sans-serif" font-size="30"
        fill="#ffffff" opacity="0.9">${escapeXml(subtitle)}</text>
    </svg>`);
}

// Circular avatar with initials, colour derived from the name.
export function avatarImage(name = '?', size = 150) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const hue = Math.abs(hashCode(name)) % 360;
  return svg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 150 150">
      <rect width="150" height="150" fill="hsl(${hue} 55% 55%)"/>
      <text x="75" y="75" dy="0.35em" text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif" font-size="58" font-weight="700"
        fill="#ffffff">${escapeXml(initials || '?')}</text>
    </svg>`);
}

// Generic content image (blog cards etc.).
export function coverImage(label = '', seed = label) {
  const hue = Math.abs(hashCode(seed)) % 360;
  const id = `c${Math.abs(hashCode(seed))}`;
  return svg(`
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hue} 60% 45%)"/>
          <stop offset="1" stop-color="hsl(${(hue + 40) % 360} 60% 55%)"/>
        </linearGradient>
      </defs>
      <rect width="600" height="350" fill="url(#${id})"/>
      <text x="300" y="185" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="30" font-weight="700" fill="#ffffff">${escapeXml(label)}</text>
    </svg>`);
}

// --- helpers ----------------------------------------------------------------
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(s, n) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// --- React Component Example (commented out) -------------------------------
/*
import { useState } from 'react';

export function ProductImage({ product, className, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(getProductImage(product));
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to SVG if real image fails
      setImageSrc(productImage({
        name: product.name,
        brand: product.brand,
        category: product.category,
        icon: product.icon
      }));
    }
  };
  
  return (
    <img 
      src={imageSrc} 
      alt={alt || product.name}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}

export function BannerImage({ mediaKey, mediaConfig, className, alt, ...props }) {
  const [imageSrc, setImageSrc] = useState(getMediaImage(mediaKey, mediaConfig));
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to SVG
      setImageSrc(getMediaImage(mediaKey, null));
    }
  };
  
  return (
    <img 
      src={imageSrc} 
      alt={alt || mediaKey}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
*/