// Category metadata and helpers (used by navbar, footer, category pages, etc.)
export const CATEGORIES = [
  { key: 'men', label: 'Men', icon: 'bi-person-standing' },
  { key: 'women', label: 'Women', icon: 'bi-person-standing-dress' },
  { key: 'kids', label: 'Kids', icon: 'bi-emoji-smile' },
  { key: 'shoes', label: 'Shoes', icon: 'bi-bag' },
  { key: 'accessories', label: 'Accessories', icon: 'bi-watch' },
];

export const categoryLabel = (key) =>
  CATEGORIES.find((c) => c.key === key)?.label || key;
