import abaLogo from '../assets/logos/brands/aba.png';
import acledaLogo from '../assets/logos/brands/acleda.jpg';
import wingLogo from '../assets/logos/brands/wing.svg';
import jtLogo from '../assets/logos/brands/jt.svg';
import vireakLogo from '../assets/logos/brands/vireak.svg';
import mekongLogo from '../assets/logos/brands/mekong.png';

// Payment methods (Cambodia). `qr: true` means a payment QR is shown so the
// customer can scan-to-pay; Cash on delivery needs no QR. `logo` is the
// brand's real logo shown on the option tile; cash uses `icon` instead.
export const PAYMENT_METHODS = [
  {
    key: 'stripe',
    label: 'Card (Stripe)',
    type: 'card',
    qr: false,
    card: true,
    color: '#635bff',
    hint: 'Pay securely by card — processed through Stripe (test mode).',
    icon: 'bi-credit-card-2-front',
  },
  {
    key: 'aba',
    label: 'ABA Bank',
    type: 'bank',
    qr: true,
    color: '#0046a4',
    hint: 'Scan with the ABA Mobile app.',
    logo: abaLogo,
  },
  {
    key: 'acleda',
    label: 'ACLEDA Bank',
    type: 'bank',
    qr: true,
    color: '#0a5c37',
    hint: 'Scan with ACLEDA mobile / ACLEDA toanchet.',
    logo: acledaLogo,
  },
  {
    key: 'wing',
    label: 'Wing',
    type: 'wallet',
    qr: true,
    color: '#00843d',
    hint: 'Scan with the Wing app to pay.',
    logo: wingLogo,
  },
  {
    key: 'cash',
    label: 'Cash on delivery',
    type: 'cash',
    qr: false,
    color: '#6c757d',
    hint: 'Pay in cash when your order arrives.',
    icon: 'bi-cash-coin',
  },
];

export const getPayment = (key) => PAYMENT_METHODS.find((p) => p.key === key);

// Express / delivery carriers. `logo` is the carrier's real logo for the tile.
export const EXPRESS_CARRIERS = [
  {
    key: 'jt',
    carrier: 'J&T Express',
    fee: 1.25,
    eta: '2–3 days',
    logo: jtLogo,
  },
  {
    key: 'virak',
    carrier: 'Vireak Buntham',
    fee: 2.0,
    eta: '1–2 days',
    logo: vireakLogo,
  },
  {
    key: 'mekong',
    carrier: 'Mekong Express',
    fee: 1.75,
    eta: '2–4 days',
    logo: mekongLogo,
  },
];

export const getCarrier = (key) => EXPRESS_CARRIERS.find((c) => c.key === key);

// Delivery locations (Cambodian provinces / cities).
export const PROVINCES = [
  'Phnom Penh',
  'Siem Reap',
  'Battambang',
  'Preah Sihanouk (Sihanoukville)',
  'Kampong Cham',
  'Kandal',
  'Takeo',
  'Kampot',
  'Kep',
  'Pursat',
  'Kratie',
  'Banteay Meanchey',
  'Prey Veng',
  'Svay Rieng',
  'Kampong Thom',
  'Kampong Speu',
  'Kampong Chhnang',
  'Ratanakiri',
  'Mondulkiri',
  'Koh Kong',
];

// Build a scannable payment payload. This mimics the shape of a KHQR-style
// string (merchant / bank / amount / reference) so the QR decodes to real,
// human-readable payment info. It is a demo, not a live bank transaction.
export function buildPaymentPayload({ bankLabel, amount, reference }) {
  return [
    'KHQR',
    `bank=${bankLabel}`,
    'merchant=SN Clothing',
    'city=Phnom Penh',
    `amount=USD ${amount.toFixed(2)}`,
    `ref=${reference}`,
  ].join('|');
}
