import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './CartContext';
import { getProductById } from '../data/products';

const STORAGE_KEY = 'w401_cart';

// A cart line is uniquely identified by product id + size (size is null for
// products that don't have sizes, e.g. accessories).
const lineKey = (id, size) => `${id}::${size || ''}`;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Back-compat: older carts saved before size support won't have `size`.
    return parsed.map((i) => ({ size: null, ...i }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // items: [{ id, size, qty }]
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1, size = null) => {
    setItems((prev) => {
      const key = lineKey(product.id, size);
      const existing = prev.find((i) => lineKey(i.id, i.size) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.id, i.size) === key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { id: product.id, size, qty }];
    });
  }, []);

  const updateQty = useCallback((id, size, qty) => {
    const key = lineKey(id, size);
    setItems((prev) =>
      prev
        .map((i) => (lineKey(i.id, i.size) === key ? { ...i, qty: Math.max(1, qty) } : i))
        .filter((i) => i.qty > 0)
    );
  }, []);

  const removeItem = useCallback((id, size) => {
    const key = lineKey(id, size);
    setItems((prev) => prev.filter((i) => lineKey(i.id, i.size) !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  // Join cart items with product data for display / totals.
  const detailed = useMemo(
    () =>
      items
        .map((i) => {
          const product = getProductById(i.id);
          if (!product) return null;
          return { ...i, key: lineKey(i.id, i.size), product, lineTotal: product.price * i.qty };
        })
        .filter(Boolean),
    [items]
  );

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(
    () => detailed.reduce((sum, i) => sum + i.lineTotal, 0),
    [detailed]
  );

  const value = useMemo(
    () => ({ items, detailed, count, subtotal, addItem, updateQty, removeItem, clear }),
    [items, detailed, count, subtotal, addItem, updateQty, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
