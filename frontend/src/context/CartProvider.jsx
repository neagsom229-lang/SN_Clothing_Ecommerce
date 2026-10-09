import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartContext } from './CartContext';
import { useProducts } from './ProductsContext';

const STORAGE_KEY = 'w401_cart';

// A cart line is uniquely identified by product id + size (size is null for
// products that don't have sizes, e.g. accessories).
const lineKey = (id, size) => `${id}::${size || ''}`;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const cleaned = Array.isArray(parsed)
      ? parsed.filter((item) => item && (item.id || item.productId) && Number(item.qty) > 0)
      : [];
    if (cleaned.length !== parsed.length) {
      console.warn('[cart] Dropped invalid items from storage:', parsed.length - cleaned.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    // Back-compat: older carts saved before size support won't have `size`.
    return cleaned.map((i) => ({ id: i.id || i.productId, size: null, ...i }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const { products, getProductById } = useProducts();
  // items: [{ id, size, qty }]
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1, size = null) => {
    const productId = product?.id || product?.productId;
    if (!productId) return;
    setItems((prev) => {
      const key = lineKey(productId, size);
      const existing = prev.find((i) => lineKey(i.id, i.size) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.id, i.size) === key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { id: productId, size, qty }];
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
        .filter((i) => i && (i.id || i.productId) && Number(i.qty) > 0)
        .map((i) => {
          const targetId = i.id || i.productId;
          const product = i.product || products.find((p) => String(p.id) === String(targetId)) || getProductById(targetId);
          if (!product) return null;
          return { ...i, id: targetId, key: lineKey(targetId, i.size), product, lineTotal: product.price * i.qty };
        })
        .filter(Boolean),
    [items, products, getProductById]
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
