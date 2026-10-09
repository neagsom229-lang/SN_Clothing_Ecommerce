import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getProducts as fetchProductsApi } from '../api/client';
import { productImage } from '../utils/images';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchProductsApi();
      const list = res.products || res;
      const normalized = (Array.isArray(list) ? list : []).map((p) => ({
        ...p,
        image: p.image || productImage(p),
      }));
      setProducts(normalized);
    } catch (err) {
      setError(err.message || 'Failed to load products from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const getProductById = useCallback((id) => {
    if (id === undefined || id === null || id === '') return null;
    return products.find((p) => String(p.id) === String(id)) || null;
  }, [products]);

  const value = {
    products,
    loading,
    error,
    refetch: loadProducts,
    getProductById,
  };

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
}
