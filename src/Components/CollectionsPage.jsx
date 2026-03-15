import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Footer from './footer.jsx';
import ProductCard from './productCard.jsx';
import useProducts from './useProducts.jsx';

/* ─── Constants ────────────────────────────────────────────────── */

const FILTERS = ['All', 'Hoodies', 'T-Shirts', 'Pants'];

/* ─── Variants ─────────────────────────────────────────────────── */

const heroVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.48,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/* ─── Empty state ──────────────────────────────────────────────── */

const EmptyState = ({ query }) => (
  <motion.div
    className="col-span-full flex flex-col items-center justify-center py-24 gap-3"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
  >
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
    <p className="text-lg font-black text-black tracking-tight">No results found</p>
    <p className="text-sm text-black/40">
      {query ? `Nothing matched "${query}"` : 'Nothing in this category yet.'}
    </p>
  </motion.div>
);

/* ─── Page ─────────────────────────────────────────────────────── */

const CollectionsPage = () => {
  const { products, loading } = useProducts();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const gridRef = useRef(null);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });

  // Scroll to top on load handled by ScrollToTop component
  useEffect(() => {
    // Keep internal state resets if any, but scroll is global now
  }, []);

  /* Nepal detection (mirrors productSection) */
  const isNepal = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const langs = navigator.languages || [navigator.language || ''];
      return langs.some((l) => /-NP$/i.test(l)) || /Asia\/Kathmandu/i.test(tz);
    } catch { return false; }
  }, []);

  /* Filtered + searched products */
  const filtered = useMemo(() => {
    let list = products;
    if (activeFilter !== 'All') {
      list = list.filter((p) => p.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeFilter, searchQuery]);

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-16 md:pt-20 transition-all duration-300">
        {/* ── Hero header ── */}
        <motion.div
          ref={heroRef}
          className="w-full px-4 md:px-16 lg:px-32 pt-16 pb-10 flex flex-col gap-6"
          variants={heroVariants}
          initial="hidden"
          animate={heroInView ? 'visible' : 'hidden'}
        >
          {/* Title row */}
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-2"
            variants={heroItemVariants}
          >
            <div>
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-black/40 mb-1">
                Our Products
              </p>
              <h1 className="text-5xl md:text-6xl font-black text-black tracking-tighter leading-none">
                Collections
              </h1>
            </div>
            {!loading && (
              <p className="text-sm font-semibold text-black/40 md:pb-2">
                {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
              </p>
            )}
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="relative w-full max-w-xl"
            variants={heroItemVariants}
          >
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black/40">
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-black/10 bg-[#f5f5f5] text-black font-semibold text-sm placeholder-black/30 outline-none focus:border-black transition-colors duration-200"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  className="absolute inset-y-0 right-4 flex items-center text-black/30 hover:text-black transition-colors"
                  onClick={() => setSearchQuery('')}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Clear search"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Filter pills */}
          <motion.div
            className="flex items-center gap-2 flex-wrap"
            variants={heroItemVariants}
          >
            {FILTERS.map((filter) => {
              const active = activeFilter === filter;
              return (
                <motion.button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold border-2 transition-colors duration-200 ${
                    active
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black/15 hover:border-black/40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  layout
                >
                  {filter}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* ── Divider ── */}
        <div className="w-full px-4 md:px-16 lg:px-32">
          <div className="w-full h-px bg-black/8" />
        </div>

        {/* ── Product grid ── */}
        <div
          ref={gridRef}
          className="w-full px-4 md:px-16 lg:px-32 py-10"
        >
          {loading ? (
            /* Skeleton grid */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-[32px] bg-[#f0f0f0] aspect-[3/4]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              layout
            >
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
                  <EmptyState query={searchQuery} key="empty" />
                ) : (
                  filtered.map((product, index) => (
                    <motion.div
                      key={product._id || product.slug}
                      className="w-full"
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                    >
                      {/* Override ProductCard's fixed width so it fills the grid cell */}
                      <div className="[&>div]:w-full [&>div]:max-w-full [&>div]:mx-0">
                        <ProductCard
                          title={product.name}
                          price={
                            isNepal
                              ? (product.priceNPR ? `Rs. ${product.priceNPR}` : 'Rs. —')
                              : (product.priceINR ? `₹${product.priceINR}` : '₹—')
                          }
                          backImage={product.backImage}
                          frontImage={product.frontImage}
                          slug={product.slug}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CollectionsPage;
