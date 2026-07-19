import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// Order status pipeline shared by the profile / tracking UI.
export const ORDER_STEPS = [
  { key: 'placed', label: 'Order placed', icon: 'bi-bag-check' },
  { key: 'confirmed', label: 'Confirmed', icon: 'bi-clipboard-check' },
  { key: 'shipped', label: 'Shipped', icon: 'bi-box-seam' },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: 'bi-truck' },
  { key: 'delivered', label: 'Delivered', icon: 'bi-house-check' },
];
