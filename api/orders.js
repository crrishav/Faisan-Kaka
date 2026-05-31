import process from 'node:process';
import { UTApi } from "uploadthing/server";
import { Resend } from 'resend';

// Initialize UTApi with the Secret Key
// On Vercel, this comes from the Environment Variables you set in the dashboard
const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET,
});

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const makeOrderId = () => `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const joinAddress = (customer = {}) => [customer.house, customer.area, customer.landmark, customer.city, customer.pincode]
  .filter(Boolean)
  .join(', ');

const buildCheckoutOrder = (payload = {}) => {
  const customer = payload.customer || {};
  const order = payload.order || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const id = payload.id || makeOrderId();

  return {
    id,
    orderId: id,
    customer,
    customerName: customer.fullName || 'Anonymous',
    email: customer.email || '',
    phone: customer.phone || '',
    fullAddress: joinAddress(customer),
    totalAmount: Number(order.total || 0),
    cartItems: items,
    status: 'Pending',
    paymentMethod: 'Checkout',
    paymentStatus: 'Pending',
    timestamp: payload.timestamp || new Date().toISOString(),
    raw: payload,
  };
};

async function sendOrderConfirmation(customerEmail) {
  if (!resend) {
    console.warn('[orders] RESEND_API_KEY is not configured; skipping confirmation email');
    return { success: false, error: new Error('RESEND_API_KEY not configured') };
  }

  if (!customerEmail) {
    console.warn('[orders] No customer email provided; skipping confirmation email');
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
    console.error('[orders] Failed to send order email:', error);
    return { success: false, error };
  }
}

export default async function handler(req, res) {
  // CORS Headers for safety
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 1. POST: Create or Update an Order
    if (req.method === 'POST') {
      const body = req.body || {};
      const payload = body.payload || null;
      const order = payload ? buildCheckoutOrder(payload) : body;

      if (payload) {
        const emailResult = await sendOrderConfirmation(order.email);
        if (!emailResult.success) {
          console.warn('[orders] Order confirmation email not sent', emailResult.error?.message || emailResult.error);
        }
      }
      
      // Convert JSON to a "File" for UploadThing
      const jsonString = JSON.stringify(order, null, 2);
      const file = new Blob([jsonString], { type: 'application/json' });
      
      // If updating, we can optionally delete the old file if utKey is provided
      if (order.utKey) {
        await utapi.deleteFiles([order.utKey]);
      }

      // Upload to UploadThing
      const response = await utapi.uploadFiles([
        new File([file], `${order.id}.json`, { type: 'application/json' })
      ]);
      
      const uploadResult = Array.isArray(response) ? response[0] : response;
      
      return res.status(200).json({ 
        success: true, 
        key: uploadResult.data?.key,
        url: uploadResult.data?.url 
      });
    }

    // 2. GET: List all orders
    if (req.method === 'GET') {
      const { files } = await utapi.listFiles();
      
      // Filter for order JSON files only
      const orderFiles = files.filter(f => f.name.endsWith('.json'));

      // Fetch the actual content of each JSON file
      const orders = await Promise.all(orderFiles.map(async (f) => {
        try {
          const contentRes = await fetch(`https://utfs.io/f/${f.key}`);
          const content = await contentRes.json();
          return { ...content, utKey: f.key };
        } catch (e) {
          return null;
        }
      }));

      return res.status(200).json(orders.filter(Boolean));
    }

    // 3. DELETE: Remove an order
    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (key) {
        await utapi.deleteFiles([key]);
      }
      return res.status(200).json({ success: true });
    }

  } catch (error) {
    console.error('[API Error]:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
