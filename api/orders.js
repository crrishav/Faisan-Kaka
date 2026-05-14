import { UTApi } from "uploadthing/server";

// Initialize UTApi with the Secret Key
// On Vercel, this comes from the Environment Variables you set in the dashboard
const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
});

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
      const order = req.body;
      
      // Convert JSON to a "File" for UploadThing
      const jsonString = JSON.stringify(order, null, 2);
      const file = new Blob([jsonString], { type: 'application/json' });
      
      // If updating, we can optionally delete the old file if utKey is provided
      if (order.utKey) {
        await utapi.deleteFiles([order.utKey]);
      }

      // Upload to UploadThing
      const response = await utapi.uploadFiles(new File([file], `${order.id}.json`, { type: 'application/json' }));
      
      return res.status(200).json({ 
        success: true, 
        key: response.data?.key,
        url: response.data?.url 
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
