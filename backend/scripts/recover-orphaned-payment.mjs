import 'dotenv/config';
import { db } from '../src/db.js';
import { checkTransaction } from '../src/services/khqrClient.js';

const md5 = process.argv[2];
if (!md5) {
  console.error('Usage: node scripts/recover-orphaned-payment.mjs <MD5_HASH>');
  process.exit(1);
}

async function recover() {
  console.log(`[recovery] Checking transaction status for MD5: ${md5}`);
  const checkResult = await checkTransaction(md5);

  console.log('[recovery] Gateway check result:', checkResult);

  if (checkResult.status !== 'paid') {
    console.error(`[recovery] Transaction is NOT marked as paid on gateway (status: ${checkResult.status})`);
    process.exit(1);
  }

  const existingOrder = db.prepare('SELECT * FROM orders WHERE bakong_md5 = ?').get(md5);
  if (existingOrder) {
    console.log(`[recovery] Order already exists in DB (ID: ${existingOrder.id}, status: ${existingOrder.payment_status})`);
    if (existingOrder.payment_status !== 'paid') {
      db.prepare(`UPDATE orders SET payment_status = 'paid', paid_at = datetime('now') WHERE id = ?`).run(existingOrder.id);
      console.log(`[recovery] Updated existing order ID ${existingOrder.id} to 'paid'.`);
    }
    return;
  }

  const txData = checkResult.data || {};
  const amount = Number(txData.amount) || 0.10;
  const tranId = txData.tran_id || 'RECOVERY_' + Date.now();
  const orderNumber = `SN-REC-${Math.floor(100000 + Math.random() * 900000)}`;

  const info = db.prepare(`
    INSERT INTO orders
      (order_number, tracking_number, user_id, items_json, shipping_json,
       subtotal, shipping_fee, total, currency, payment_provider, payment_method,
       bakong_md5, bakong_tran_id, payment_status, paid_at, status_index, is_recovery)
    VALUES
      (@order_number, 'REC000000', NULL, @items_json, @shipping_json,
       @subtotal, 0, @total, 'usd', 'bakong', 'bakong',
       @bakong_md5, @bakong_tran_id, 'paid', datetime('now'), 1, 1)
  `).run({
    order_number: orderNumber,
    items_json: JSON.stringify([{ productId: 0, name: 'Recovered Item (Orphaned Payment)', price: amount, qty: 1, lineTotal: amount }]),
    shipping_json: JSON.stringify({ fullName: 'Recovered Customer', phone: '012345678', province: 'Phnom Penh', addressLine: 'Recovered Address' }),
    subtotal: amount,
    total: amount,
    bakong_md5: md5,
    bakong_tran_id: tranId,
  });

  console.log(`✅ Successfully recovered orphaned payment! Created order ID ${info.lastInsertRowid} (Order Number: ${orderNumber})`);
}

recover().catch((err) => {
  console.error('Recovery failed:', err);
  process.exit(1);
});
