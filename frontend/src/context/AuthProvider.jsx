import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { register as apiRegister, login as apiLogin } from '../api/client';

// Accounts are real now: registering/logging in calls the backend (backend/),
// where passwords are hashed with bcrypt and a JWT is issued. This provider
// just holds that session (token + user) in localStorage so a refresh doesn't
// sign you out. Orders are still mirrored locally too, so the existing
// tracking / profile UI keeps working exactly as before — the authoritative,
// payment-verified copy of each order lives in the backend's database
// (see Checkout.jsx, which saves to both places).
const SESSION_KEY = 'w401_session'; // { token, user }
const ORDERS_KEY = 'w401_orders';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const carrierPrefix = {
  'J&T Express': 'JT',
  'Vireak Buntham': 'VB',
  'Mekong Express': 'MK',
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => read(SESSION_KEY, null));
  const [orders, setOrders] = useState(() => read(ORDERS_KEY, []));

  useEffect(() => localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)), [orders]);
  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  const register = useCallback(async ({ name, email, password }) => {
    try {
      const { token, user } = await apiRegister({ name, email, password });
      setSession({ token, user });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Could not create your account.' };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { token, user } = await apiLogin({ email, password });
      setSession({ token, user });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Invalid email or password.' };
    }
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const placeOrder = useCallback(
    (data) => {
      const now = new Date().toISOString();
      const prefix = carrierPrefix[data.express?.carrier] || 'W4';
      const order = {
        id: uid(),
        number: `W401-${Math.floor(100000 + Math.random() * 900000)}`,
        trackingNumber: `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`,
        userId: session?.user?.id ?? null,
        createdAt: now,
        statusIndex: 1, // "Confirmed" once placed
        ...data,
      };
      setOrders((prev) => [order, ...prev]);
      return order;
    },
    [session]
  );

  const myOrders = useMemo(
    () =>
      orders
        .filter((o) => o.userId === session?.user?.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders, session]
  );

  const getOrderById = useCallback(
    (id) => orders.find((o) => o.id === id && o.userId === session?.user?.id),
    [orders, session]
  );

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!session,
      register,
      login,
      logout,
      placeOrder,
      myOrders,
      getOrderById,
    }),
    [session, register, login, logout, placeOrder, myOrders, getOrderById]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
