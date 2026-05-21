export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { payload } = req.body || {};
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
    }

    const total = Number((payload?.order?.total ?? 0));
    if (!total || total <= 0) return res.status(400).json({ error: 'Invalid order total' });

    const amount = Math.round(total * 100); // paise

    const body = {
      amount,
      currency: 'INR',
      receipt: payload?.id || `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: { source: 'FaisanKaka Web Checkout' },
    };

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    let data;
    try {
      data = await r.json();
    } catch (e) {
      const text = await r.text().catch(() => '<unreadable body>');
      console.error('[Razorpay create order] non-JSON response', text);
      return res.status(502).json({ error: `Razorpay returned non-JSON response: ${text}` });
    }

    if (!r.ok) {
      console.error('[Razorpay create order] failed', data);
      return res.status(502).json({ error: data.error?.description || 'Razorpay order creation failed' });
    }

    return res.status(200).json({ razorpayOrderId: data.id, amount: data.amount, key: keyId });
  } catch (err) {
    console.error('[create-order] error', err);
    return res.status(500).json({ error: err.message });
  }
}
