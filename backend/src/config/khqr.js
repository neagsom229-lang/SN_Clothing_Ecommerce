import 'dotenv/config';

const rbkToken = process.env.KHQR_RBK_TOKEN;

if (!rbkToken) {
  console.warn('⚠️  KHQR_RBK_TOKEN is not configured in backend/.env. KHQR payments will fail until configured.');
}

export const khqrConfig = Object.freeze({
  apiBase: process.env.KHQR_API_BASE || 'https://api.khqr.dev/v1',
  checkoutBase: process.env.KHQR_CHECKOUT_BASE || 'https://checkout.khqr.dev',
  rbkToken: rbkToken || '',
  webhookSecret: process.env.KHQR_WEBHOOK_SECRET || '',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5000',
  returnUrl: process.env.CHECKOUT_RETURN_URL || '',
  successUrl: process.env.CHECKOUT_SUCCESS_URL || '',
  cancelUrl: process.env.CHECKOUT_CANCEL_URL || '',
});
