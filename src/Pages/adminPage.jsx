import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Footer from '../Components/footer';
import CouponsAdminPanel from '../Components/CouponsAdminPanel.jsx';
import { listOrders, updateOrderStatus, updateOrderTracking, deleteOrder } from '../lib/ordersService.js';

/* ─── Mock Data ─────────────────────────────────────────────────── */

// Live data will be fetched in the component
const INITIAL_ORDERS = [];

const MOCK = {
  revenue:   { daily: 14820, weekly: 98430, monthly: 312600 },
  netProfit: { daily: 6210,  weekly: 41200, monthly: 129800 },
  aov: 1640,
  payments:  { captured: 187, pending: 12, failed: 4 },
  logistics: { avgDelivery: 4.2, rtoRate: 3.8, totalShipped: 203 },
  inventory: [
    { size: 'S', count: 48 }, { size: 'M', count: 72 }, { size: 'L', count: 7 }, { size: 'XL', count: 39 },
  ],
  topDesigns: [
    { name: 'Solar Flare Drop', sold: 87, pct: 82 },
    { name: 'Midnight Bloom',   sold: 64, pct: 60 },
    { name: 'Void Series',      sold: 51, pct: 48 },
    { name: 'Custom Orders',    sold: 43, pct: 41 },
  ],
  customRatio: 31,
  marketing: { convRate: 4.2, abandonedCarts: 38 },
  traffic: [
    { source: 'Instagram Reels', pct: 54 },
    { source: 'Reddit',          pct: 23 },
    { source: 'Direct',          pct: 23 },
  ],
  payout: {
    total: 312600,
    pending: 41200,
    payoutDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
  },
};

const STATUS_ORDER  = ['Pending', 'Printing', 'Shipped'];
const STATUS_NEXT   = { Pending: 'Printing', Printing: 'Shipped', Shipped: 'Shipped' };
const STATUS_COLORS = {
  Pending:  'bg-amber-100 text-amber-800',
  Printing: 'bg-blue-100 text-blue-800',
  Shipped:  'bg-emerald-100 text-emerald-800',
};
const LOW_STOCK_THRESHOLD = 15;
const TABS = ['Overview', 'Order List', 'Coupons'];

/* ─── Variants ──────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.52, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/* ─── Shared UI ─────────────────────────────────────────────────── */

const Card = ({ children, className = '', custom = 0 }) => (
  <motion.div variants={fadeUp} custom={custom}
    className={`bg-white rounded-[28px] border-2 border-black/8 p-6 ${className}`}>
    {children}
  </motion.div>
);
const Label = ({ children }) => (
  <p className="text-[10px] font-black tracking-[0.18em] uppercase text-black/35 mb-1">{children}</p>
);
const BigNum = ({ children, sub }) => (
  <div className="flex items-end gap-1.5">
    <span className="text-4xl font-black text-black tracking-tighter leading-none">{children}</span>
    {sub && <span className="text-sm font-bold text-black/40 mb-0.5">{sub}</span>}
  </div>
);
const SectionHeading = ({ children }) => (
  <motion.h2 variants={fadeUp} className="text-2xl font-black text-black tracking-tighter mb-4 mt-10">
    {children}
  </motion.h2>
);
const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${className}`}>
    {children}
  </span>
);

/* ─── Settlement Countdown Hook ─────────────────────────────────── */

const useCountdown = (targetDate) => {
  const calc = useCallback(() => {
    const diff = targetDate - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }, [targetDate]);
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return time;
};

/* ─── Print Preview Modal ────────────────────────────────────────── */

const PrintModal = ({ order, onClose }) => {
  useEffect(() => {
    if (!order) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [order, onClose]);

  return (
    <AnimatePresence>
      {order && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.div
            className="relative bg-white rounded-[28px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-black/6">
              <div>
                <Label>Print Preview</Label>
                <p className="text-xl font-black text-black tracking-tight">{order.id} · {order.customer}</p>
              </div>
              <button onClick={onClose}
                className="w-9 h-9 rounded-full bg-black/6 flex items-center justify-center hover:bg-black/12 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* Images */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Mockup Preview</Label>
                <div className="rounded-[20px] overflow-hidden border-2 border-black/8 h-64 sm:h-72 bg-black/4">
                  <img src={order.preview} alt="Mockup" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                </div>
              </div>
              <div>
                <Label>High-Res Design File</Label>
                <div className="rounded-[20px] overflow-hidden border-2 border-black/8 h-64 sm:h-72 bg-black/4">
                  <img src={order.hiRes} alt="Hi-res design" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
            {/* Meta */}
            <div className="px-6 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Design',    val: order.design },
                { label: 'Status',    val: order.status },
                { label: 'Tracking',  val: order.tracking || '—' },
                { label: 'Ship Cost', val: `₹${order.shippingCost}` },
              ].map(({ label, val }) => (
                <div key={label}><Label>{label}</Label><p className="text-sm font-black text-black">{val}</p></div>
              ))}
            </div>
            {/* CTA */}
            <div className="px-6 pb-6 flex gap-3 flex-wrap">
              <a href={order.hiRes} target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl bg-black text-white text-sm font-black hover:bg-black/80 transition-colors">
                Download Hi-Res ↗
              </a>
              <button onClick={onClose}
                className="px-5 py-2.5 rounded-2xl bg-black/6 text-black text-sm font-black hover:bg-black/12 transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Order Detail Drawer ────────────────────────────────────────── */

const OrderDrawer = ({ order, onClose, onStatusChange, onTrackingUpdate }) => {
  const [trackingInput, setTrackingInput] = useState('');
  const [printOrder, setPrintOrder]       = useState(null);

  useEffect(() => { setTrackingInput(order?.tracking || ''); }, [order]);
  useEffect(() => {
    if (!order) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [order, onClose]);

  return (
    <>
      <PrintModal order={printOrder} onClose={() => setPrintOrder(null)} />
      <AnimatePresence>
        {order && (
          <motion.div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="relative bg-white rounded-[28px] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 24 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="p-6 border-b-2 border-black/6 flex items-start justify-between gap-3">
                <div>
                  <Label>Order Detail</Label>
                  <p className="text-xl font-black text-black tracking-tight">{order.id}</p>
                  <p className="text-sm font-bold text-black/50">{order.date}</p>
                </div>
                <button onClick={onClose}
                  className="w-9 h-9 rounded-full bg-black/6 flex items-center justify-center hover:bg-black/12 transition-colors mt-1 flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Design preview */}
              <div className="p-6 border-b-2 border-black/6">
                <Label>Design Preview</Label>
                <div className="rounded-[20px] overflow-hidden border-2 border-black/8 h-52 sm:h-60 bg-black/4 mt-2">
                  <img src={order.preview} alt="Design" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                </div>
                <button onClick={() => setPrintOrder(order)} disabled={!order?.hiRes}
                  className="mt-3 w-full py-2.5 rounded-2xl bg-black text-white text-sm font-black hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  View Print Files ↗
                </button>
              </div>

              {/* Customer */}
              <div className="p-6 border-b-2 border-black/6">
                <Label>Customer</Label>
                <p className="text-base font-black text-black">{order.customer}</p>
                <p className="text-sm font-semibold text-black/50">{order.phone}</p>
                <p className="text-sm font-semibold text-black/40 mt-1">{order.address}</p>
              </div>

              {/* Status update */}
              <div className="p-6 border-b-2 border-black/6">
                <Label>Update Status</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {STATUS_ORDER.map((s) => (
                    <button key={s} onClick={() => onStatusChange(order.id, s)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black border-2 transition-all duration-200 ${
                        order.status === s ? 'bg-black text-white border-black' : 'bg-white text-black border-black/15 hover:border-black/40'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
                {order.status !== 'Shipped' && (
                  <button onClick={() => onStatusChange(order.id, STATUS_NEXT[order.status])}
                    className="mt-3 w-full py-2.5 rounded-2xl bg-black/6 text-black text-sm font-black hover:bg-black/12 transition-colors">
                    Advance → {STATUS_NEXT[order.status]}
                  </button>
                )}
              </div>

              {/* Shiprocket paste */}
              <div className="p-6 border-b-2 border-black/6">
                <Label>Shiprocket Tracking ID</Label>
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Paste tracking ID…"
                    className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-black/10 bg-[#f5f5f5] text-black font-bold text-sm placeholder-black/30 outline-none focus:border-black transition-colors"
                  />
                  <button onClick={() => onTrackingUpdate(order.id, trackingInput)}
                    className="px-4 py-2.5 rounded-2xl bg-black text-white text-sm font-black hover:bg-black/80 transition-colors">
                    Save
                  </button>
                </div>
                {order.tracking && (
                  <p className="text-xs font-mono font-bold text-black/40 mt-2">Current: {order.tracking}</p>
                )}
              </div>

              {/* Financials */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Order Amount</Label><p className="text-lg font-black text-black">₹{order.amount.toLocaleString()}</p></div>
                  <div><Label>Ship Cost</Label><p className="text-lg font-black text-black">₹{order.shippingCost}</p></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ─── Order List Tab ─────────────────────────────────────────────── */

const OrderListTab = ({ orders, setOrders }) => {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected]         = useState(new Set());
  const [drawerOrder, setDrawerOrder]   = useState(null);
  const [printOrder, setPrintOrder]     = useState(null);
  const [bulkStatus, setBulkStatus]     = useState('');
  const [toast, setToast]               = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const filtered = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'All') list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [orders, search, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  };

  const toggleOne = (id) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleStatusChange = async (id, newStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    if (drawerOrder?.id === id) setDrawerOrder((o) => ({ ...o, status: newStatus }));
    await updateOrderStatus(id, newStatus);
    showToast(`${id} → ${newStatus}`);
  };

  const handleTrackingUpdate = async (id, tracking) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, tracking } : o));
    if (drawerOrder?.id === id) setDrawerOrder((o) => ({ ...o, tracking }));
    await updateOrderTracking(id, tracking);
    showToast(`Tracking saved for ${id}`);
  };

  const applyBulkAction = async () => {
    if (!bulkStatus || selected.size === 0) return;
    
    // Update locally first for immediate UI response
    const selectedIds = Array.from(selected);
    setOrders((prev) => prev.map((o) => selected.has(o.id) ? { ...o, status: bulkStatus } : o));
    
    // Update in database for each
    showToast(`Updating ${selected.size} order${selected.size > 1 ? 's' : ''}…`);
    
    await Promise.all(selectedIds.map(id => updateOrderStatus(id, bulkStatus)));
    
    showToast(`Successfully updated ${selected.size} order${selected.size > 1 ? 's' : ''}`);
    setSelected(new Set());
    setBulkStatus('');
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selected.size} order${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;

    const selectedIds = Array.from(selected);
    
    // Update locally
    setOrders((prev) => prev.filter((o) => !selected.has(o.id)));
    
    showToast(`Deleting ${selected.size} order${selected.size > 1 ? 's' : ''}…`);
    
    await Promise.all(selectedIds.map(id => deleteOrder(id)));
    
    showToast(`Deleted ${selected.size} order${selected.size > 1 ? 's' : ''}`);
    setSelected(new Set());
  };

  return (
    <>
      <PrintModal order={printOrder} onClose={() => setPrintOrder(null)} />
      <OrderDrawer
        order={drawerOrder}
        onClose={() => setDrawerOrder(null)}
        onStatusChange={handleStatusChange}
        onTrackingUpdate={handleTrackingUpdate}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-sm font-black px-5 py-3 rounded-2xl shadow-xl whitespace-nowrap"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">

        {/* ── Search + Filter ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black/40">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order ID or customer…"
              className="w-full pl-10 pr-10 py-3 rounded-2xl border-2 border-black/10 bg-white text-black font-semibold text-sm placeholder-black/30 outline-none focus:border-black transition-colors"
            />
            <AnimatePresence>
              {search && (
                <motion.button onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-4 flex items-center text-black/30 hover:text-black transition-colors"
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', ...STATUS_ORDER].map((s) => (
              <motion.button key={s} onClick={() => setStatusFilter(s)} whileTap={{ scale: 0.95 }}
                className={`px-4 py-3 rounded-2xl text-xs font-black border-2 transition-all duration-200 whitespace-nowrap ${
                  statusFilter === s ? 'bg-black text-white border-black' : 'bg-white text-black border-black/15 hover:border-black/40'
                }`}>
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Bulk Action Bar ── */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              className="flex items-center gap-3 flex-wrap px-5 py-3 bg-black rounded-2xl"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <span className="text-white text-sm font-black flex-1">{selected.size} selected</span>
              <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-black outline-none border border-white/20 hover:bg-white/25 transition-colors cursor-pointer">
                <option value="" className="text-black bg-white">Mark as…</option>
                {STATUS_ORDER.map((s) => <option key={s} value={s} className="text-black bg-white">{s}</option>)}
              </select>
              <button onClick={applyBulkAction} disabled={!bulkStatus}
                className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-black hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Apply
              </button>
              <button onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 text-xs font-black hover:bg-red-500/30 transition-colors">
                Delete
              </button>
              <button onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 rounded-xl bg-white/10 text-white/70 text-xs font-black hover:bg-white/20 transition-colors">
                Deselect
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[{ label: 'Total', filter: 'All' }, ...STATUS_ORDER.map((s) => ({ label: s, filter: s }))].map(({ label, filter }) => {
            const count = filter === 'All' ? orders.length : orders.filter((o) => o.status === filter).length;
            return (
              <button key={label} onClick={() => setStatusFilter(filter)}
                className={`bg-white rounded-[20px] border-2 px-4 py-3 text-left transition-all duration-200 ${
                  statusFilter === filter ? 'border-black' : 'border-black/8 hover:border-black/20'
                }`}>
                <p className="text-[10px] font-black tracking-widest uppercase text-black/35">{label}</p>
                <p className="text-2xl font-black text-black tracking-tighter">{count}</p>
              </button>
            );
          })}
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block bg-white rounded-[28px] border-2 border-black/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-black/6">
                <th className="px-5 py-4 w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll}
                    className="w-4 h-4 rounded accent-black cursor-pointer" />
                </th>
                {['Preview','Order','Customer','Design','Status','Tracking','Amount','Actions'].map((h) => (
                  <th key={h} className="px-4 py-4 text-left text-[10px] font-black tracking-[0.15em] uppercase text-black/35">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center">
                    <p className="text-sm font-black text-black/30">No orders match your filter.</p>
                  </td></tr>
                ) : filtered.map((order, i) => (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`border-b border-black/5 hover:bg-black/[0.015] transition-colors ${selected.has(order.id) ? 'bg-black/[0.025]' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleOne(order.id)}
                        className="w-4 h-4 rounded accent-black cursor-pointer" />
                    </td>
                    <td className="px-4 py-3.5">
                      <img src={order.preview} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded-xl object-contain bg-black/5" />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-black text-black">{order.id}</span>
                      <p className="text-[10px] font-semibold text-black/35">{order.date}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-black leading-tight">{order.customer}</p>
                      <p className="text-xs text-black/40 font-semibold">{order.phone}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-black/70 text-xs">{order.design}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] font-black rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer appearance-none ${STATUS_COLORS[order.status]}`}>
                        {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-bold text-black/50">
                        {order.tracking || <span className="text-black/20">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-black text-black">₹{order.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="grid grid-cols-2 gap-2 min-w-[170px]">
                        <button onClick={() => setDrawerOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-black/6 text-black text-[11px] font-black hover:bg-black/12 transition-colors text-center">
                          Details
                        </button>
                        <button onClick={() => setPrintOrder(order)} disabled={!order.hiRes}
                          className="px-3 py-1.5 rounded-xl bg-black text-white text-[11px] font-black hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-center">
                          Print ↗
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {filtered.length === 0 ? (
            <p className="text-center py-12 text-sm font-black text-black/30">No orders match your filter.</p>
          ) : filtered.map((order, i) => (
            <motion.div key={order.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`bg-white rounded-[24px] border-2 p-4 transition-all ${selected.has(order.id) ? 'border-black' : 'border-black/8'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleOne(order.id)}
                  className="w-4 h-4 rounded accent-black cursor-pointer flex-shrink-0" />
                <img src={order.preview} alt="" loading="lazy" decoding="async" className="w-11 h-11 rounded-xl object-contain bg-black/5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-black">{order.id}</span>
                    <select value={order.status} onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`text-[11px] font-black rounded-full px-2 py-0.5 border-0 outline-none cursor-pointer appearance-none ${STATUS_COLORS[order.status]}`}>
                      {STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <p className="text-xs font-bold text-black/50 truncate">{order.customer} · {order.design}</p>
                </div>
              </div>
              <div className="overflow-x-auto pb-1 border-b border-black/6 mb-3">
                <div className="grid grid-cols-3 gap-2 min-w-[320px] pb-2">
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-black/30">Date</p>
                  <p className="text-xs font-bold text-black/70 truncate">{order.date}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-black/30">Amount</p>
                  <p className="text-xs font-black text-black">₹{order.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase text-black/30">Tracking</p>
                  <p className="text-xs font-mono font-bold text-black/60 truncate">{order.tracking || '—'}</p>
                </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-2 gap-2 min-w-[220px]">
                <button onClick={() => setDrawerOrder(order)}
                  className="flex-1 py-2 rounded-xl bg-black/6 text-black text-xs font-black hover:bg-black/12 transition-colors">
                  Details
                </button>
                <button onClick={() => setPrintOrder(order)} disabled={!order.hiRes}
                  className="flex-1 py-2 rounded-xl bg-black text-white text-xs font-black hover:bg-black/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  Print ↗
                </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </>
  );
};

/* ─── Overview: Revenue Card ─────────────────────────────────────── */

const RevenueCard = ({ orders }) => {
  const [period, setPeriod] = useState('monthly');
  const periods = ['daily', 'weekly', 'monthly'];

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((acc, o) => acc + (o.amount || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    const netProfit = totalRevenue * 0.42; // Simulated 42% margin

    return {
      revenue: { daily: totalRevenue * 0.1, weekly: totalRevenue * 0.4, monthly: totalRevenue },
      netProfit: { daily: netProfit * 0.1, weekly: netProfit * 0.4, monthly: netProfit },
      aov: avgOrderValue
    };
  }, [orders]);

  return (
    <Card className="md:col-span-2" custom={0}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <Label>Gross Revenue</Label>
          <BigNum sub="INR">₹{stats.revenue[period].toLocaleString(undefined, { maximumFractionDigits: 0 })}</BigNum>
        </div>
        <div className="grid grid-cols-3 sm:flex gap-1 bg-black/5 rounded-full p-1 w-full sm:w-auto">
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`w-full sm:w-auto px-3 py-1 rounded-full text-[11px] font-black text-center transition-all duration-200 ${period === p ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t-2 border-black/6">
        <div><Label>Net Profit</Label>
          <p className="text-xl font-black text-emerald-600 tracking-tight">₹{stats.netProfit[period].toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
        <div><Label>Avg Order Value</Label>
          <p className="text-xl font-black text-black tracking-tight">₹{stats.aov.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
        <div><Label>Margin</Label>
          <p className="text-xl font-black text-black tracking-tight">
            {stats.revenue[period] > 0 ? Math.round((stats.netProfit[period] / stats.revenue[period]) * 100) : 0}%
          </p></div>
      </div>
    </Card>
  );
};

/* ─── Overview: Payment Card ─────────────────────────────────────── */

const PaymentCard = ({ orders }) => {
  const captured = orders.filter(o => o.status === 'Shipped').length;
  const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Printing').length;
  const failed = 0; // Simulated
  const total = orders.length;

  return (
    <Card custom={1}>
      <Label>Orders Status</Label>
      <BigNum>{total}</BigNum>
      <p className="text-xs font-semibold text-black/35 mb-4">total processed</p>
      <div className="flex flex-col gap-2">
        {[
          { label: 'Shipped', val: captured, color: 'bg-emerald-500' },
          { label: 'Pending', val: pending, color: 'bg-amber-400' },
          { label: 'Failed', val: failed, color: 'bg-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
            <span className="text-xs font-black text-black/60 flex-1">{label}</span>
            <span className="text-sm font-black text-black">{val}</span>
            <div className="w-16 h-1.5 rounded-full bg-black/8 overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: total > 0 ? `${(val / total) * 100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ─── Overview: Recent Orders ────────────────────────────────────── */

const OrdersSection = ({ orders }) => {
  const sorted = [...orders].slice(0, 5).sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
  return (
    <>
      <SectionHeading>Recent Orders</SectionHeading>
      {/* Mobile */}
      <div className="flex flex-col gap-3 md:hidden">
        {sorted.map((order, i) => (
          <motion.div key={order.id} variants={fadeUp} custom={i}
            className="bg-white rounded-[24px] border-2 border-black/8 p-4">
            <div className="flex items-center gap-3 mb-3">
              <img src={order.preview} alt="" loading="lazy" decoding="async" className="w-11 h-11 rounded-xl object-contain bg-black/5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-black">{order.id}</span>
                  <Pill className={STATUS_COLORS[order.status]}>{order.status}</Pill>
                </div>
                <p className="text-xs font-bold text-black/50 truncate">{order.customer}</p>
              </div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-black/6">
              <div><p className="text-[10px] font-black tracking-widest uppercase text-black/30">Tracking</p>
                <p className="text-xs font-mono font-bold text-black/60">{order.tracking || '—'}</p></div>
              <div><p className="text-[10px] font-black tracking-widest uppercase text-black/30">Ship</p>
                <p className="text-sm font-black text-black">₹{order.shippingCost}</p></div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Desktop */}
      <Card className="!p-0 overflow-hidden hidden md:block" custom={0}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-black/6">
              {['Preview','Order','Customer','Design','Status','Tracking','Ship Cost'].map((h) => (
                <th key={h} className="px-5 py-4 text-left text-[10px] font-black tracking-[0.15em] uppercase text-black/35">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((order, i) => (
              <motion.tr key={order.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                <td className="px-5 py-3.5"><img src={order.preview} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded-xl object-contain bg-black/5" /></td>
                <td className="px-5 py-3.5"><span className="font-black text-black">{order.id}</span></td>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-black">{order.customer}</p>
                  <p className="text-xs text-black/40 font-semibold">{order.phone}</p>
                </td>
                <td className="px-5 py-3.5"><span className="font-semibold text-black/70">{order.design}</span></td>
                <td className="px-5 py-3.5"><Pill className={STATUS_COLORS[order.status]}>{order.status}</Pill></td>
                <td className="px-5 py-3.5"><span className="font-mono text-xs font-bold text-black/60">{order.tracking || '—'}</span></td>
                <td className="px-5 py-3.5"><span className="font-bold text-black">₹{order.shippingCost}</span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
};

/* ─── Overview: Logistics ────────────────────────────────────────── */

const LogisticsSection = ({ orders }) => (
  <>
    <SectionHeading>Logistics · Shiprocket</SectionHeading>
    <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Orders', val: orders.length, sub: 'parcels' },
        { label: 'Avg Delivery', val: `4.2d`, sub: 'order → delivered' },
        { label: 'RTO / Return', val: `0%`, sub: 'undelivered' },
        { label: 'Total Ship Cost', val: `₹${orders.reduce((a, o) => a + (o.shippingCost || 0), 0)}`, sub: 'all orders' },
      ].map(({ label, val, sub }, i) => (
        <Card key={label} custom={i}>
          <Label>{label}</Label>
          <p className="text-3xl font-black text-black tracking-tighter leading-none">{val}</p>
          <p className="text-xs font-semibold text-black/35 mt-1">{sub}</p>
        </Card>
      ))}
    </motion.div>
  </>
);

/* ─── Overview: Inventory ─────────────────────────────────────────── */

const InventorySection = () => {
  const maxCount = Math.max(...MOCK.inventory.map((i) => i.count));
  return (
    <>
      <SectionHeading>Inventory & Products</SectionHeading>
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card custom={0}>
          <Label>Blank Stock · 240+ GSM</Label>
          <p className="text-xs font-bold text-black/35 mb-4">India Warehouse</p>
          <div className="flex flex-col gap-3">
            {MOCK.inventory.map(({ size, count }) => {
              const low = count < LOW_STOCK_THRESHOLD;
              return (
                <div key={size} className="flex items-center gap-3">
                  <span className={`w-7 text-xs font-black ${low ? 'text-red-500' : 'text-black'}`}>{size}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-black/6 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${low ? 'bg-red-500' : 'bg-black'}`}
                      initial={{ width: 0 }} animate={{ width: `${(count / maxCount) * 100}%` }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-16 justify-end">
                    <span className={`text-sm font-black ${low ? 'text-red-500' : 'text-black'}`}>{count}</span>
                    {low && <span className="text-[10px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">LOW</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card custom={1}>
          <Label>Top Selling Designs</Label>
          <p className="text-xs font-bold text-black/35 mb-4">All time</p>
          <div className="flex flex-col gap-3">
            {MOCK.topDesigns.map(({ name, sold, pct }, i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-black text-black/30 w-4">{i + 1}</span>
                <span className="flex-1 text-sm font-bold text-black truncate">{name}</span>
                <div className="w-20 h-2 rounded-full bg-black/6 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-black" initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 + 0.2 }} />
                </div>
                <span className="text-sm font-black text-black w-8 text-right">{sold}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-black/6">
            <Label>Custom vs Standard</Label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-3 rounded-full overflow-hidden bg-black/8">
                <motion.div className="h-full bg-black" initial={{ width: 0 }} animate={{ width: `${MOCK.customRatio}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
              </div>
              <span className="text-xs font-black text-black">{MOCK.customRatio}% Custom</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

/* ─── Overview: Marketing ────────────────────────────────────────── */

const MarketingSection = () => (
  <>
    <SectionHeading>Marketing & Traffic</SectionHeading>
    <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card custom={0}>
        <Label>Conversion Rate</Label>
        <BigNum sub="%">{MOCK.marketing.convRate}</BigNum>
        <p className="text-xs font-semibold text-black/35 mt-1">visitors → buyers</p>
      </Card>
      <Card custom={1}>
        <Label>Abandoned Carts</Label>
        <BigNum>{MOCK.marketing.abandonedCarts}</BigNum>
        <p className="text-xs font-semibold text-black/35 mt-1">designed but didn't checkout</p>
      </Card>
      <Card custom={2}>
        <Label>Traffic Sources</Label>
        <div className="flex flex-col gap-2 mt-2">
          {MOCK.traffic.map(({ source, pct }) => (
            <div key={source} className="flex items-center gap-2">
              <span className="flex-1 text-xs font-bold text-black/70">{source}</span>
              <div className="w-16 h-1.5 rounded-full bg-black/8 overflow-hidden">
                <motion.div className="h-full rounded-full bg-black" initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
              </div>
              <span className="text-xs font-black text-black w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  </>
);

/* ─── Overview: Partnership ──────────────────────────────────────── */

const PartnershipSection = () => {
  const share    = Math.round(MOCK.payout.total / 2);
  const countdown = useCountdown(MOCK.payout.payoutDate);

  return (
    <>
      <SectionHeading>Partnership Split</SectionHeading>
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card custom={0} className="col-span-1 md:col-span-2">
          <Label>Revenue Split · 50 / 50</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-3">
            {[{ name: 'Saurabh', role: 'Founder' }, { name: 'Rishav', role: 'Co-Founder' }].map(({ name, role }) => (
              <div key={name}>
                <div className="w-8 h-8 rounded-full bg-black/15 mb-2 flex items-center justify-center">
                  <span className="text-xs font-black text-black">{name[0]}</span>
                </div>
                <p className="text-xs font-black tracking-[0.1em] uppercase text-black/35">{role}</p>
                <p className="text-xl font-black text-black tracking-tight">{name}</p>
                <p className="text-2xl font-black text-black tracking-tighter mt-1">₹{share.toLocaleString()}</p>
                <p className="text-xs font-semibold text-black/35">this month</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-3 rounded-full overflow-hidden bg-black/8">
            <div className="w-1/2 h-full bg-black" />
          </div>
        </Card>
        <Card custom={1}>
          <Label>Pending Settlement</Label>
          <BigNum sub="INR">₹{MOCK.payout.pending.toLocaleString()}</BigNum>
          <p className="text-xs font-semibold text-amber-600 mt-1">Held in Razorpay · 3-day window</p>
          {/* Live countdown */}
          <div className="mt-4 pt-4 border-t-2 border-black/6">
            <Label>Payout In</Label>
            <div className="flex gap-2 mt-2">
              {[{ val: countdown.d, unit: 'd' }, { val: countdown.h, unit: 'h' }, { val: countdown.m, unit: 'm' }, { val: countdown.s, unit: 's' }].map(({ val, unit }) => (
                <div key={unit} className="flex-1 bg-black/5 rounded-xl py-2 text-center">
                  <p className="text-lg font-black text-black tracking-tighter leading-none">{String(val).padStart(2, '0')}</p>
                  <p className="text-[10px] font-black text-black/35 uppercase tracking-widest">{unit}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-black/35 mt-2">
              Each founder gets ₹{Math.round(MOCK.payout.pending / 2).toLocaleString()} on release
            </p>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

/* ─── Main Dashboard ─────────────────────────────────────────────── */

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef    = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    let mounted = true;
    const fetchOrders = async () => {
      try {
        const list = await listOrders();
        if (mounted) {
          setOrders(list);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        if (mounted) setLoading(false);
      }
    };
    fetchOrders();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden [&_button]:cursor-pointer">

      {/* ── Header ── */}
      <motion.div
        ref={heroRef}
        className="w-full px-4 md:px-16 lg:px-32 pt-24 md:pt-28 pb-6"
        initial="hidden"
        animate={heroInView ? 'visible' : 'hidden'}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.p variants={fadeUp} className="text-xs font-black tracking-[0.2em] uppercase text-black/35 mb-1">
          Admin Panel
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter leading-none">
              Dashboard
            </h1>
            <p className="text-sm font-semibold text-black/35 mt-2">{today}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('fk_admin_token');
              localStorage.removeItem('fk_admin_expiry');
              window.location.reload();
            }}
            className="px-6 py-2.5 rounded-2xl bg-black/5 text-black text-sm font-black hover:bg-red-50 text-red-600 border border-black/5 hover:border-red-100 transition-all duration-200"
          >
            Log Out
          </button>
        </motion.div>

        {/* Tab switcher */}
        <motion.div variants={fadeUp} className="flex gap-2 mt-6">
          {TABS.map((tab) => (
            <motion.button key={tab} onClick={() => setActiveTab(tab)} whileTap={{ scale: 0.96 }}
              className={`px-5 py-2 rounded-full text-sm font-black border-2 transition-all duration-200 ${
                activeTab === tab ? 'bg-black text-white border-black' : 'bg-white text-black border-black/15 hover:border-black/40'
              }`}>
              {tab}
              {tab === 'Order List' && (
                <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-black/8'}`}>
                  {orders.length}
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Divider ── */}
      <div className="w-full px-4 md:px-16 lg:px-32">
        <div className="w-full h-px bg-black/8" />
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="w-full px-4 md:px-16 lg:px-32 py-8"
        >
          {activeTab === 'Overview' ? (
            <motion.div className="flex flex-col gap-0" initial="hidden" animate="visible" variants={stagger}>
              <motion.p variants={fadeUp} className="text-2xl font-black text-black tracking-tighter mb-4">
                Sales & Revenue
              </motion.p>
              {loading ? (
                <div className="py-20 text-center">
                  <motion.div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full mx-auto" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />
                  <p className="mt-4 text-sm font-black text-black/30">Loading real-time data…</p>
                </div>
              ) : (
                <>
                  <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RevenueCard orders={orders} />
                    <PaymentCard orders={orders} />
                  </motion.div>
                  <OrdersSection orders={orders} />
                  <LogisticsSection orders={orders} />
                  <InventorySection orders={orders} />
                  <MarketingSection orders={orders} />
                  <PartnershipSection orders={orders} />
                </>
              )}
              <div className="h-16" />
            </motion.div>
          ) : activeTab === 'Order List' ? (
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.p variants={fadeUp} className="text-2xl font-black text-black tracking-tighter mb-6">
                Order List
              </motion.p>
              <OrderListTab orders={orders} setOrders={setOrders} />
              <div className="h-16" />
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.p variants={fadeUp} className="text-2xl font-black text-black tracking-tighter mb-6">
                Coupons & Discounts
              </motion.p>
              <CouponsAdminPanel />
              <div className="h-16" />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default AdminPage;
