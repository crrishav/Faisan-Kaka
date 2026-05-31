import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Footer from '../Components/footer';

/* ─── Mock Data ─────────────────────────────────────────────────── */

const MOCK = {
  revenue: { daily: 14820, weekly: 98430, monthly: 312600 },
  netProfit: { daily: 6210, weekly: 41200, monthly: 129800 },
  aov: 1640,
  payments: { captured: 187, pending: 12, failed: 4 },
  orders: [
    { id: 'ORD-001', customer: 'Arjun Mehta', phone: '+91 98100 22334', address: '14B, Lajpat Nagar, Delhi', status: 'Shipped', design: 'Solar Flare Drop', preview: 'https://placehold.co/60x60/111/fff?text=SF', tracking: 'SHP7291038', shippingCost: 89 },
    { id: 'ORD-002', customer: 'Priya Sharma', phone: '+91 77002 11223', address: '7, Koramangala, Bangalore', status: 'Printing', design: 'Custom Studio', preview: 'https://placehold.co/60x60/111/fff?text=CS', tracking: '—', shippingCost: 75 },
    { id: 'ORD-003', customer: 'Rohan Das', phone: '+91 88123 44556', address: '22, Salt Lake, Kolkata', status: 'Pending', design: 'Midnight Bloom', preview: 'https://placehold.co/60x60/111/fff?text=MB', tracking: '—', shippingCost: 92 },
    { id: 'ORD-004', customer: 'Sneha Kapoor', phone: '+91 99001 55667', address: '5, Banjara Hills, Hyderabad', status: 'Shipped', design: 'Custom Studio', preview: 'https://placehold.co/60x60/111/fff?text=CS', tracking: 'SHP7291101', shippingCost: 81 },
    { id: 'ORD-005', customer: 'Vikram Nair', phone: '+91 70011 22889', address: '3, Powai, Mumbai', status: 'Pending', design: 'Solar Flare Drop', preview: 'https://placehold.co/60x60/111/fff?text=SF', tracking: '—', shippingCost: 95 },
  ],
  logistics: { avgDelivery: 4.2, rtoRate: 3.8, totalShipped: 203 },
  inventory: [
    { size: 'S', count: 48 }, { size: 'M', count: 72 }, { size: 'L', count: 61 }, { size: 'XL', count: 39 },
  ],
  topDesigns: [
    { name: 'Solar Flare Drop', sold: 87, pct: 82 },
    { name: 'Midnight Bloom', sold: 64, pct: 60 },
    { name: 'Void Series', sold: 51, pct: 48 },
    { name: 'Custom Orders', sold: 43, pct: 41 },
  ],
  customRatio: 31,
  marketing: { convRate: 4.2, abandonedCarts: 38 },
  traffic: [
    { source: 'Instagram Reels', pct: 54 },
    { source: 'Reddit', pct: 23 },
    { source: 'Direct', pct: 23 },
  ],
  payout: { total: 312600, saurabh: 50, rishav: 50, pending: 41200 },
};

const STATUS_ORDER = ['Pending', 'Printing', 'Shipped'];
const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-800',
  Printing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-emerald-100 text-emerald-800',
};

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

/* ─── Shared Components ─────────────────────────────────────────── */

const Card = ({ children, className = '', custom = 0 }) => (
  <motion.div
    variants={fadeUp}
    custom={custom}
    className={`bg-white rounded-[28px] border-2 border-black/8 p-6 ${className}`}
  >
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
  <motion.h2
    variants={fadeUp}
    className="text-2xl font-black text-black tracking-tighter mb-4 mt-10"
  >
    {children}
  </motion.h2>
);

const Pill = ({ children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black ${className}`}>
    {children}
  </span>
);

/* ─── Revenue Toggle ────────────────────────────────────────────── */

const RevenueCard = () => {
  const [period, setPeriod] = useState('monthly');
  const periods = ['daily', 'weekly', 'monthly'];
  return (
    <Card className="md:col-span-2" custom={0}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <Label>Gross Revenue</Label>
          <BigNum sub="INR">₹{MOCK.revenue[period].toLocaleString()}</BigNum>
        </div>
        <div className="grid grid-cols-3 sm:flex gap-1 bg-black/5 rounded-full p-1 mt-1 w-full sm:w-auto">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-label={`Show ${p} revenue data`}
              aria-pressed={period === p}
              className={`w-full sm:w-auto px-3 py-1 rounded-full text-[11px] font-black text-center transition-all duration-200 ${period === p ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t-2 border-black/6">
        <div>
          <Label>Net Profit</Label>
          <p className="text-xl font-black text-emerald-600 tracking-tight">₹{MOCK.netProfit[period].toLocaleString()}</p>
        </div>
        <div>
          <Label>Avg Order Value</Label>
          <p className="text-xl font-black text-black tracking-tight">₹{MOCK.aov.toLocaleString()}</p>
        </div>
        <div>
          <Label>Margin</Label>
          <p className="text-xl font-black text-black tracking-tight">
            {Math.round((MOCK.netProfit[period] / MOCK.revenue[period]) * 100)}%
          </p>
        </div>
      </div>
    </Card>
  );
};

/* ─── Payment Status ────────────────────────────────────────────── */

const PaymentCard = () => {
  const total = MOCK.payments.captured + MOCK.payments.pending + MOCK.payments.failed;
  return (
    <Card custom={1}>
      <Label>Order Payments</Label>
      <BigNum>{total}</BigNum>
      <p className="text-xs font-semibold text-black/35 mb-4">total transactions</p>
      <div className="flex flex-col gap-2">
        {[
          { label: 'Captured', val: MOCK.payments.captured, color: 'bg-emerald-500' },
          { label: 'Pending', val: MOCK.payments.pending, color: 'bg-amber-400' },
          { label: 'Failed', val: MOCK.payments.failed, color: 'bg-red-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} aria-hidden="true" />
            <span className="text-xs font-black text-black/60 flex-1">{label}</span>
            <span className="text-sm font-black text-black">{val}</span>
            <div className="w-16 h-1.5 rounded-full bg-black/8 overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${(val / total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/* ─── Orders Table ──────────────────────────────────────────────── */

const OrdersSection = () => {
  const sorted = [...MOCK.orders].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
  return (
    <>
      <SectionHeading>Order Management</SectionHeading>
      <Card className="!p-0 overflow-hidden" custom={0}>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm" aria-label="Order management table">
            <caption className="sr-only">Orders sorted by status with customer, tracking, shipping cost, and design file actions.</caption>
            <thead>
              <tr className="border-b-2 border-black/6">
                {['Preview', 'Order', 'Customer', 'Design', 'Status', 'Tracking', 'Ship Cost', 'Files'].map((h) => (
                  <th key={h} scope="col" className="px-5 py-4 text-left text-[10px] font-black tracking-[0.15em] uppercase text-black/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sorted.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <img src={order.preview} alt={`${order.design} preview for ${order.id}`} className="w-10 h-10 rounded-xl object-cover" />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-black text-black">{order.id}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-black leading-tight">{order.customer}</p>
                      <p className="text-xs text-black/40 font-semibold">{order.phone}</p>
                      <p className="text-xs text-black/35 font-medium max-w-[140px] truncate">{order.address}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-black/70">{order.design}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Pill className={STATUS_COLORS[order.status]}>{order.status}</Pill>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-black/60">{order.tracking}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-black">₹{order.shippingCost}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {order.design === 'Custom Studio' ? (
                        <button
                          type="button"
                          aria-label={`View uploaded design file for order ${order.id}`}
                          className="px-3 py-1.5 rounded-xl bg-black text-white text-[11px] font-black hover:bg-black/80 transition-colors"
                        >
                          View File ↗
                        </button>
                      ) : (
                        <span className="text-xs text-black/25 font-semibold">—</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="md:hidden p-4 space-y-3">
          <AnimatePresence>
            {sorted.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-black/8 p-3 bg-white"
              >
                <div className="flex items-start gap-3">
                  <img src={order.preview} alt={`${order.design} preview for ${order.id}`} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-black text-sm">{order.id}</p>
                      <Pill className={STATUS_COLORS[order.status]}>{order.status}</Pill>
                    </div>
                    <p className="font-bold text-black text-sm leading-tight mt-1">{order.customer}</p>
                    <p className="text-xs text-black/45 font-semibold">{order.phone}</p>
                    <p className="text-xs text-black/35 font-medium truncate">{order.address}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-black tracking-[0.12em] uppercase text-black/35">Design</p>
                    <p className="font-semibold text-black/75 truncate">{order.design}</p>
                  </div>
                  <div>
                    <p className="font-black tracking-[0.12em] uppercase text-black/35">Ship Cost</p>
                    <p className="font-bold text-black">₹{order.shippingCost}</p>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="font-black tracking-[0.12em] uppercase text-black/35">Tracking</p>
                    <p className="font-mono font-bold text-black/60 text-[11px] break-all">{order.tracking}</p>
                  </div>
                </div>

                {order.design === 'Custom Studio' && (
                  <button
                    type="button"
                    aria-label={`View uploaded design file for order ${order.id}`}
                    className="mt-3 w-full px-3 py-2 rounded-xl bg-black text-white text-[11px] font-black hover:bg-black/80 transition-colors"
                  >
                    View File ↗
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </>
  );
};

/* ─── Logistics ─────────────────────────────────────────────────── */

const LogisticsSection = () => (
  <>
    <SectionHeading>Logistics · Shiprocket</SectionHeading>
    <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { label: 'Total Shipped', val: MOCK.logistics.totalShipped, sub: 'parcels' },
        { label: 'Avg Delivery', val: `${MOCK.logistics.avgDelivery}d`, sub: 'order → delivered' },
        { label: 'RTO / Return Rate', val: `${MOCK.logistics.rtoRate}%`, sub: 'undelivered' },
        { label: 'Avg Ship Cost', val: `₹${Math.round(MOCK.orders.reduce((a, o) => a + o.shippingCost, 0) / MOCK.orders.length)}`, sub: 'per parcel' },
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

/* ─── Inventory ─────────────────────────────────────────────────── */

const InventorySection = () => {
  const maxCount = Math.max(...MOCK.inventory.map((i) => i.count));
  return (
    <>
      <SectionHeading>Inventory & Products</SectionHeading>
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blank stock */}
        <Card custom={0}>
          <Label>Blank Stock · 240+ GSM</Label>
          <p className="text-xs font-bold text-black/35 mb-4">India Warehouse</p>
          <div className="flex flex-col gap-3">
            {MOCK.inventory.map(({ size, count }) => (
              <div key={size} className="flex items-center gap-3">
                <span className="w-7 text-xs font-black text-black">{size}</span>
                <div className="flex-1 h-2.5 rounded-full bg-black/6 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  />
                </div>
                <span className="text-sm font-black text-black w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Card>
        {/* Top designs */}
        <Card custom={1}>
          <Label>Top Selling Designs</Label>
          <p className="text-xs font-bold text-black/35 mb-4">All time</p>
          <div className="flex flex-col gap-3">
            {MOCK.topDesigns.map(({ name, sold, pct }, i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-black text-black/30 w-4">{i + 1}</span>
                <span className="flex-1 text-sm font-bold text-black truncate">{name}</span>
                <div className="w-20 h-2 rounded-full bg-black/6 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-black"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 + 0.2 }}
                  />
                </div>
                <span className="text-sm font-black text-black w-8 text-right">{sold}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-black/6">
            <Label>Custom vs Standard</Label>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-3 rounded-full overflow-hidden bg-black/8 flex">
                <motion.div
                  className="h-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${MOCK.customRatio}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </div>
              <span className="text-xs font-black text-black">{MOCK.customRatio}% Custom</span>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

/* ─── Marketing ─────────────────────────────────────────────────── */

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
                <motion.div
                  className="h-full rounded-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-xs font-black text-black w-8 text-right">{pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  </>
);

/* ─── Partnership ───────────────────────────────────────────────── */

const PartnershipSection = () => {
  const share = Math.round(MOCK.payout.total / 2);
  return (
    <>
      <SectionHeading>Partnership Split</SectionHeading>
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card custom={0} className="col-span-1 md:col-span-2">
          <Label>Revenue Split · 50 / 50</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-3">
            {[
              {
                name: 'Saurabh',
                role: 'Founder',
                image: new URL('../assets/pfp/saurabh.jpg', import.meta.url).href,
              },
              {
                name: 'Rishav',
                role: 'Co-Founder',
                image: new URL('../assets/pfp/rishav.jpg', import.meta.url).href,
              },
            ].map(({ name, role, image }) => (
              <div key={name}>
                <img src={image} alt={`${name} profile`} className="w-8 h-8 rounded-full object-cover mb-2" />
                <p className="text-xs font-black tracking-[0.1em] uppercase text-black/35">{role}</p>
                <p className="text-xl font-black text-black tracking-tight">{name}</p>
                <p className="text-2xl font-black text-black tracking-tighter mt-1">₹{share.toLocaleString()}</p>
                <p className="text-xs font-semibold text-black/35">this month</p>
              </div>
            ))}
          </div>
          <div className="mt-4 h-3 rounded-full overflow-hidden bg-black/8 flex">
            <div className="w-1/2 h-full bg-black" />
          </div>
        </Card>
        <Card custom={1}>
          <Label>Pending Settlement</Label>
          <BigNum sub="INR">₹{MOCK.payout.pending.toLocaleString()}</BigNum>
          <p className="text-xs font-semibold text-amber-600 mt-1 font-bold">Held for the 3-day window</p>
          <div className="mt-4 pt-4 border-t-2 border-black/6">
            <Label>Each founder receives</Label>
            <p className="text-lg font-black text-black/60 tracking-tight">
              ₹{Math.round(MOCK.payout.pending / 2).toLocaleString()} <span className="text-xs font-bold">on release</span>
            </p>
          </div>
        </Card>
      </motion.div>
    </>
  );
};

/* ─── Main Dashboard ────────────────────────────────────────────── */

const DashboardPage = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#fafafa] overflow-x-hidden [&_button]:cursor-pointer" role="main" aria-label="Dashboard overview">
      {/* ── Header ── */}
      <motion.div
        ref={heroRef}
        className="w-full px-4 md:px-16 lg:px-32 pt-24 md:pt-28 pb-8"
        initial="hidden"
        animate={heroInView ? 'visible' : 'hidden'}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.p
          variants={fadeUp}
          className="text-xs font-black tracking-[0.2em] uppercase text-black/35 mb-1"
        >
          Admin Panel
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-2"
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black tracking-tighter leading-none">
            Dashboard
          </h1>
          <p className="text-sm font-semibold text-black/35 md:pb-2">{today}</p>
        </motion.div>
      </motion.div>

      {/* ── Divider ── */}
      <div className="w-full px-4 md:px-16 lg:px-32">
        <div className="w-full h-px bg-black/8" />
      </div>

      {/* ── Content ── */}
      <motion.div
        className="w-full px-4 md:px-16 lg:px-32 py-8 flex flex-col gap-0"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* Sales & Revenue */}
        <motion.p variants={fadeUp} className="text-2xl font-black text-black tracking-tighter mb-4">
          Sales & Revenue
        </motion.p>
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RevenueCard />
          <PaymentCard />
        </motion.div>

        <OrdersSection />
        <LogisticsSection />
        <InventorySection />
        <MarketingSection />
        <PartnershipSection />

        <div className="h-16" />
      </motion.div>

      <Footer />
    </div>
  );
};

export default DashboardPage;
