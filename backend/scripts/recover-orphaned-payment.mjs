import 'dotenv/config';
import { pool } from '../src/db.js';
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

  const existingRes = await pool.query('SELECT * FROM orders WHERE bakong_md5 = $1', [md5]);
  const existingOrder = existingRes.rows[0];
  if (existingOrder) {
    console.log(`[recovery] Order already exists in DB (ID: ${existingOrder.id}, status: ${existingOrder.payment_status})`);
    if (existingOrder.payment_status !== 'paid') {
      await pool.query(`UPDATE orders SET payment_status = 'paid', paid_at = NOW() WHERE id = $1`, [existingOrder.id]);
      console.log(`[recovery] Updated existing order ID ${existingOrder.id} to 'paid'.`);
    }
    await pool.end();
    return;
  }

  const txData = checkResult.data || {};
  const amount = Number(txData.amount) || 0.10;
  const tranId = txData.tran_id || 'RECOVERY_' + Date.now();
  const orderNumber = `SN-REC-${Math.floor(100000 + Math.random() * 900000)}`;

  const insertRes = await pool.query(`
    INSERT INTO orders
      (order_number, tracking_number, user_id, items_json, shipping_json,
       subtotal, shipping_fee, total, currency, payment_provider, payment_method,
       bakong_md5, bakong_tran_id, payment_status, paid_at, status_index, is_recovery)
    VALUES
      ($1, 'REC000000', NULL, $2, $3,
       $4, 0, $5, 'usd', 'bakong', 'bakong',
       $6, $7, 'paid', NOW(), 1, 1)
    RETURNING id
  `, [
    orderNumber,
    JSON.stringify([{ productId: 0, name: 'Recovered Item (Orphaned Payment)', price: amount, qty: 1, lineTotal: amount }]),
    JSON.stringify({ fullName: 'Recovered Customer', phone: '012345678', province: 'Phnom Penh', addressLine: 'Recovered Address' }),
    amount,
    amount,
    md5,
    tranId,
  ]);

  const newId = insertRes.rows[0].id;
  console.log(`✅ Successfully recovered orphaned payment! Created order ID ${newId} (Order Number: ${orderNumber})`);
  await pool.end();
}

recover().catch((err) => {
  console.error('Recovery failed:', err);
  pool.end();
  process.exit(1);
});
