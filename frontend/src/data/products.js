import { productImage } from '../utils/images';
import { CATALOG } from './catalog';

// Category metadata (used by the navbar, category pages, and footer).
export const CATEGORIES = [
  { key: 'men', label: 'Men', icon: 'bi-person-standing' },
  { key: 'women', label: 'Women', icon: 'bi-person-standing-dress' },
  { key: 'kids', label: 'Kids', icon: 'bi-emoji-smile' },
  { key: 'shoes', label: 'Shoes', icon: 'bi-bag' },
  { key: 'accessories', label: 'Accessories', icon: 'bi-watch' },
];

export const categoryLabel = (key) =>
  CATEGORIES.find((c) => c.key === key)?.label || key;

// Real product data + locally-bundled photos (see scripts/build-catalog.mjs).
// If an image is ever missing we fall back to a generated placeholder so the
// UI never shows a broken image.
const products = CATALOG.map((p) => ({
  ...p,
  image: p.image || productImage(p),
}));

export default products;

// --- lookups ---------------------------------------------------------------
export const getProductById = (id) =>
  products.find((p) => String(p.id) === String(id));

export const getProductsByCategory = (category) =>
  products.filter((p) => p.category === category);

export const getBrandsByCategory = (category) =>
  [...new Set(getProductsByCategory(category).map((p) => p.brand))].sort();

export const getAllBrands = () => [...new Set(products.map((p) => p.brand))].sort();

// Products of a category grouped by brand: [{ brand, items: [...] }, ...]
export const getProductsGroupedByBrand = (category) => {
  const groups = {};
  for (const p of getProductsByCategory(category)) {
    (groups[p.brand] ||= []).push(p);
  }
  return Object.keys(groups)
    .sort()
    .map((brand) => ({ brand, items: groups[brand] }));
};
