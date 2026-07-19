// Small fetch wrapper for the backend API (see /backend).
// Set VITE_API_URL in your .env — see .env.example.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// --- auth --------------------------------------------------------------------

export function register({ name, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function login({ email, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// --- payments ---------------------------------------------------------------

// items: [{ id, qty, size }], carrier: 'jt' | 'virak' | 'mekong'
export function createPaymentIntent({ items, carrier }) {
  return request('/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify({ items, carrier }),
  });
}

// --- orders ------------------------------------------------------------------

// items: [{ id, qty, size }], shipping: {fullName, phone, province, addressLine}
// token: optional JWT — when present, the backend links this order to the account.
export function createOrder({ items, carrier, shipping, paymentIntentId, token }) {
  return request('/orders', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: JSON.stringify({ items, carrier, shipping, paymentIntentId }),
  });
}

export function getBackendOrder(id) {
  return request(`/orders/${id}`);
}
