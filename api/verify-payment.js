import process from 'node:process';
import crypto from 'crypto';
import { UTApi } from 'uploadthing/server';
import { Resend } from 'resend';

const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET });
const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendOrderConfirmation(customerEmail) {
  if (!resend) {
    console.warn('[verify-payment] RESEND_API_KEY is not configured; skipping confirmation email');
    return { success: false, error: new Error('RESEND_API_KEY not configured') };
  }

  if (!customerEmail) {
    console.warn('[verify-payment] No customer email provided; skipping confirmation email');
    return { success: false, error: new Error('Customer email not provided') };
  }

  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: customerEmail,
      subject: '📦 Your Faisan Kaka Order Is Confirmed!',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #111; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #000; margin-bottom: 20px;">🎉 Thank you for your order!</h2>
          <p>Hi there,</p>
          <p>Your order has been successfully placed! We are absolutely thrilled to have you onboard. 🚀</p>
          <p style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #000; font-weight: 500;">
            ℹ️ <strong>Status Update:</strong> Your order is currently being processed. Your tracking ID will be sent to you automatically via email and SMS as soon as your package has been packed and its shipment begins. ✨
          </p>
          <p>Our team is already working hard to get your gear ready. If you have any urgent modifications or questions about your order, feel free to reply directly to this email.</p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">⚡ Driven by Culture. Faisan Kaka Streetwear.</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('[verify-payment] Failed to send order email:', error);
    return { success: false, error };
  }
}

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
      bypassVerification,
    } = req.body || {};

    const skipVerification = process.env.SKIP_RAZORPAY_VERIFICATION === 'true';
    const useBypass = skipVerification && bypassVerification === true;

    if (!useBypass) {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured on server' });

      const expected = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (expected !== String(razorpay_signature)) {
        console.warn('[verify-payment] signature mismatch', { expected, got: razorpay_signature });
        return res.status(400).json({ error: 'Signature verification failed' });
      }
    } else {
      console.warn('[verify-payment] Razorpay verification bypassed for local testing');
    }

    const customerEmail = orderPayload?.customer?.email || orderPayload?.customerEmail || orderPayload?.email;
    const emailResult = await sendOrderConfirmation(customerEmail);
    if (!emailResult.success) {
      console.warn('[verify-payment] Order confirmation email not sent', emailResult.error?.message || emailResult.error);
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
