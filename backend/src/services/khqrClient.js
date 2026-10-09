import axios from 'axios';
import { khqrConfig } from '../config/khqr.js';

export class KhqrApiError extends Error {
  constructor(message, status, responseData) {
    super(message);
    this.name = 'KhqrApiError';
    this.status = status;
    this.responseData = responseData;
  }
}

export class KhqrRateLimitError extends Error {
  constructor(message = 'Rate limit exceeded (429)', retryAfterMs = 3000) {
    super(message);
    this.name = 'KhqrRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}

export class KhqrNetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'KhqrNetworkError';
  }
}

const client = axios.create({
  baseURL: khqrConfig.apiBase,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(khqrConfig.rbkToken ? { Authorization: `Bearer ${khqrConfig.rbkToken}` } : {}),
  },
});

// Response interceptor for 429 Retry-After handling
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response && error.response.status === 429) {
      if (!config._retry) {
        config._retry = true;
        const retryAfterHeader = error.response.headers['retry-after'];
        const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 3;
        const delayMs = isNaN(retryAfterSec) ? 3000 : retryAfterSec * 1000;
        
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return client(config);
      }
      const retryAfterHeader = error.response.headers['retry-after'];
      const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 3;
      throw new KhqrRateLimitError('KHQR rate limit exceeded', isNaN(retryAfterSec) ? 3000 : retryAfterSec * 1000);
    }
    if (!error.response) {
      throw new KhqrNetworkError(error.message || 'KHQR network error');
    }
    throw new KhqrApiError(
      error.response.data?.responseMessage || error.message,
      error.response.status,
      error.response.data
    );
  }
);

// Rate limiter state for createQrPayment (1 req/s)
let lastRequestTime = 0;

async function enforceRateLimit() {
  const now = Date.now();
  const diff = now - lastRequestTime;
  if (diff < 1000) {
    const waitTime = 1000 - diff;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  lastRequestTime = Date.now();
}

/**
 * Generate QR Payment via KHQR.dev relay
 * @param {Object} options
 * @param {number} options.amount
 * @param {string} [options.returnUrl]
 * @param {string} [options.successUrl]
 * @param {string} [options.cancelUrl]
 * @returns {Promise<Object>} { qr, md5, tranId, checkoutUrl }
 */
export async function createQrPayment({ amount, returnUrl, successUrl, cancelUrl }) {
  if (!khqrConfig.rbkToken) {
    throw new Error('KHQR_RBK_TOKEN is not configured.');
  }

  await enforceRateLimit();

  const payload = {
    amount: Number(amount),
    ...(returnUrl || khqrConfig.returnUrl ? { return_url: returnUrl || khqrConfig.returnUrl } : {}),
    ...(successUrl || khqrConfig.successUrl ? { success_url: successUrl || khqrConfig.successUrl } : {}),
    ...(cancelUrl || khqrConfig.cancelUrl ? { cancel_url: cancelUrl || khqrConfig.cancelUrl } : {}),
  };

  try {
    const response = await client.post('/generate_qr', payload);
    const result = response.data;

    if (result.responseCode !== 0) {
      throw new KhqrApiError(result.responseMessage || 'Failed to generate QR', 400, result);
    }

    const data = result.data || {};
    return {
      qr: data.qr,
      md5: data.md5,
      tranId: data.tran_id,
      checkoutUrl: data.checkout_url,
    };
  } catch (err) {
    if (err instanceof KhqrApiError || err instanceof KhqrRateLimitError || err instanceof KhqrNetworkError) {
      throw err;
    }
    throw new KhqrNetworkError(err.message || 'Failed to connect to KHQR relay');
  }
}

/**
 * Check transaction status by MD5
 * @param {string} md5
 * @returns {Promise<Object>} { status: 'paid'|'scanned'|'unpaid'|'expired', data?: Object }
 */
export async function checkTransaction(md5) {
  if (!khqrConfig.rbkToken) {
    throw new Error('KHQR_RBK_TOKEN is not configured.');
  }

  if (!md5) {
    return { status: 'unpaid' };
  }

  try {
    const response = await client.post('/check_transaction_by_md5', { md5 });
    const result = response.data;
    const data = result.data || {};

    if (data.status === 'paid') {
      return { status: 'paid', data };
    }
    if (data.status === 'scanned') {
      return { status: 'scanned', data };
    }
    if (data.status === 'expired') {
      return { status: 'expired', data };
    }

    return { status: data.status || 'unpaid', data };
  } catch (err) {
    if (err instanceof KhqrApiError) {
      if (err.status === 404) {
        return { status: 'unpaid' };
      }
      if (err.status === 400 && err.responseData?.data?.status === 'expired') {
        return { status: 'expired', data: err.responseData.data };
      }
    }
    // If 404 from axios directly
    if (err.response && err.response.status === 404) {
      return { status: 'unpaid' };
    }
    if (err.response && err.response.status === 400 && err.response.data?.data?.status === 'expired') {
      return { status: 'expired', data: err.response.data.data };
    }

    console.error('[khqrClient] checkTransaction error:', err.message);
    return { status: 'unpaid', error: err.message };
  }
}

/**
 * Get public QR image URL for an MD5 hash
 * @param {string} md5
 * @returns {string}
 */
export function getQrImageUrl(md5) {
  return `${khqrConfig.apiBase}/generate_khqr_image/${md5}`;
}
