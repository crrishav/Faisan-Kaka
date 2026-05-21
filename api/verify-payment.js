import crypto from 'crypto';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET });

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderPayload,
    } = req.body || {};

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured on server' });

    const expected = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expected !== String(razorpay_signature)) {
      console.warn('[verify-payment] signature mismatch', { expected, got: razorpay_signature });
      return res.status(400).json({ error: 'Signature verification failed' });
    }

    // Persist order via UploadThing (same flow as api/orders.js)
    const order = {
      ...orderPayload,
      payment: { id: razorpay_payment_id, orderId: razorpay_order_id },
      status: 'Paid',
      timestamp: new Date().toISOString(),
    };

    try {
      const jsonString = JSON.stringify(order, null, 2);
      const file = new Blob([jsonString], { type: 'application/json' });
      const response = await utapi.uploadFiles([
        new File([file], `${order.id || `ORD-${Date.now()}`}.json`, { type: 'application/json' })
      ]);
      const uploadResult = Array.isArray(response) ? response[0] : response;
      return res.status(200).json({ ok: true, key: uploadResult.data?.key, url: uploadResult.data?.url });
    } catch (e) {
      console.error('[verify-payment] upload error', e);
      // Order verified but failed to persist; still return success for payment verification
      return res.status(200).json({ ok: true, warning: 'verified_but_not_stored' });
    }
  } catch (err) {
    console.error('[verify-payment] error', err);
    return res.status(500).json({ error: err.message });
  }
}
