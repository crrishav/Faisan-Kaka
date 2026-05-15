const STORAGE_KEY = 'fk_orders';

const readLocalOrders = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch { return []; }
};

const writeLocalOrders = (orders) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch { }
};

const makeOrderId = () => `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// ── Vercel API Bridge ────────────────────────────────────────────────────────
// This talks to your api/orders.js which then talks to UploadThing safely.

const apiRequest = async (method, body = null, query = '') => {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);
    
    const res = await fetch(`/api/orders${query}`, options);
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('[ordersService] API Failure:', err);
    return null;
  }
};

// ── Logic ───────────────────────────────────────────────────────────────────

const mapPayloadToOrder = (payload) => {
  const id = payload.id || makeOrderId();
  const customer = `${payload.customer?.fullName || ''}`.trim() || 'Anonymous';
  const phone = payload.customer?.phone || '';
  const address = [payload.customer?.house, payload.customer?.area, payload.customer?.city, payload.customer?.pincode]
    .filter(Boolean).join(', ');
  
  const items = Array.isArray(payload.order?.items) ? payload.order.items : [];
  const firstItem = items[0] || null;
  
  return {
    id,
    customer,
    phone,
    address,
    status: payload.status || 'Pending',
    design: items.length > 1 ? `${firstItem?.title || 'Custom'} + ${items.length - 1} more` : (firstItem?.title || 'Custom Order'),
    preview: firstItem?.frontImage || firstItem?.backImage || firstItem?.preview || '',
    hiRes: firstItem?.hiRes || '',
    tracking: payload.tracking || '',
    shippingCost: payload.order?.shippingCost || 0,
    date: payload.timestamp ? new Date(payload.timestamp).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
    amount: Number(payload.order?.total || 0),
    items: items,
    timestamp: payload.timestamp || Date.now(),
  };
};

export const submitOrder = async (payload) => {
  const order = mapPayloadToOrder(payload);

  // 1. Store Locally (Fallback)
  const next = [order, ...readLocalOrders()].slice(0, 50);
  writeLocalOrders(next);

  // 2. Store in UploadThing (via Vercel API)
  await apiRequest('POST', order);

  return order;
};

export const listOrders = async () => {
  // 1. Fetch from Cloud
  const remote = await apiRequest('GET');
  
  // 2. Fetch from Local
  const local = readLocalOrders();

  // 3. Merge & Deduplicate
  const all = [...(Array.isArray(remote) ? remote : []), ...local];
  const seen = new Set();
  return all.filter(o => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

export const updateOrderStatus = async (id, status) => {
  const orders = await listOrders();
  const target = orders.find(o => o.id === id);
  if (!target) return false;

  const updated = { ...target, status };
  
  // Update Local
  writeLocalOrders(readLocalOrders().map(o => o.id === id ? updated : o));

  // Update Cloud
  await apiRequest('POST', updated);
  
  return true;
};

export const updateOrderTracking = async (id, tracking) => {
  const orders = await listOrders();
  const target = orders.find(o => o.id === id);
  if (!target) return false;

  const updated = { ...target, tracking };
  
  writeLocalOrders(readLocalOrders().map(o => o.id === id ? updated : o));

  // Update Cloud
  await apiRequest('POST', updated);
  
  return true;
};

export const deleteOrder = async (id) => {
  const orders = await listOrders();
  const target = orders.find(o => o.id === id);
  if (!target) return false;

  // 1. Remove Local
  writeLocalOrders(readLocalOrders().filter(o => o.id !== id));

  // 2. Remove Cloud (if key exists)
  if (target.utKey) {
    await apiRequest('DELETE', null, `?key=${target.utKey}`);
  }
  
  return true;
};

export default { submitOrder, listOrders, updateOrderStatus, updateOrderTracking, deleteOrder };

