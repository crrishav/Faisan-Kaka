import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import ProductCard from '../Components/productCard.jsx';
import useProducts from '../Components/useProducts.jsx';

/* ─── Constants ────────────────────────────────────────────────── */

const AVAILABILITY_OPTIONS = [
  { label: 'All Availability', value: 'all' },
  { label: 'In Stock', value: 'in-stock' },
  { label: 'Out of Stock', value: 'out-of-stock' },
];

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name: A-Z', value: 'name-asc' },
  { label: 'Name: Z-A', value: 'name-desc' },
];

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

const EmptyState = ({ query, onResetFilters }) => (
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
    <button
      type="button"
      onClick={onResetFilters}
      className="mt-2 rounded-full border border-black/20 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:border-black hover:bg-black hover:text-white transition-colors"
    >
      Reset Filters
    </button>
  </motion.div>
);

/* ─── Page ─────────────────────────────────────────────────────── */

const CollectionsPage = () => {
  const { products, loading } = useProducts({ includeOutOfStock: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sizeFilter, setSizeFilter] = useState('All');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');
  const gridRef = useRef(null);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.3 });

  const toPriceNumber = (value) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    const stripped = Number(String(value || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(stripped) ? stripped : 0;
  };

  const productPrice = (product) => (
    isNepal ? toPriceNumber(product.priceNPR) : toPriceNumber(product.priceINR)
  );

  /* Nepal detection (mirrors productSection) */
  const isNepal = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const langs = navigator.languages || [navigator.language || ''];
      return langs.some((l) => /-NP$/i.test(l)) || /Asia\/Kathmandu/i.test(tz);
    } catch { return false; }
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ['All', ...categories.sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const sizeOptions = useMemo(() => {
    const sizes = products.flatMap((p) => (Array.isArray(p.sizes) ? p.sizes : [])).filter(Boolean);
    return ['All', ...Array.from(new Set(sizes)).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  

  const priceBounds = useMemo(() => {
    const prices = products
      .map((p) => productPrice(p))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!prices.length) {
      return { min: 0, max: 0 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products, isNepal]);

  useEffect(() => {
    setMinPriceInput(priceBounds.min ? String(priceBounds.min) : '');
    setMaxPriceInput(priceBounds.max ? String(priceBounds.max) : '');
  }, [priceBounds.min, priceBounds.max]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (categoryFilter !== 'All') {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (sizeFilter !== 'All') {
      list = list.filter((p) => Array.isArray(p.sizes) && p.sizes.includes(sizeFilter));
    }

    

    if (availabilityFilter === 'in-stock') {
      list = list.filter((p) => p.inStock !== false);
    }

    if (availabilityFilter === 'out-of-stock') {
      list = list.filter((p) => p.inStock === false);
    }

    const minPrice = Number(minPriceInput);
    const maxPrice = Number(maxPriceInput);

    if (Number.isFinite(minPrice) && minPrice > 0) {
      list = list.filter((p) => productPrice(p) >= minPrice);
    }

    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      list = list.filter((p) => productPrice(p) <= maxPrice);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const description = String(p.description || '').toLowerCase();
        return name.includes(q) || description.includes(q);
      });
    }

    switch (sortBy) {
      case 'newest':
        list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
        break;
      case 'price-asc':
        list.sort((a, b) => productPrice(a) - productPrice(b));
        break;
      case 'price-desc':
        list.sort((a, b) => productPrice(b) - productPrice(a));
        break;
      case 'name-asc':
        list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        break;
      case 'name-desc':
        list.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        break;
      default:
        break;
    }

    return list;
  }, [
    products,
    categoryFilter,
    sizeFilter,
    availabilityFilter,
    minPriceInput,
    maxPriceInput,
    searchQuery,
    sortBy,
    isNepal,
  ]);

  const resetFilters = () => {
    setCategoryFilter('All');
    setSizeFilter('All');
    setAvailabilityFilter('all');
    setSortBy('featured');
    setSearchQuery('');
    setMinPriceInput(priceBounds.min ? String(priceBounds.min) : '');
    setMaxPriceInput(priceBounds.max ? String(priceBounds.max) : '');
  };

  return (
    <div className="min-h-screen bg-white">

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

        {/* Advanced filter controls */}
        <motion.div
          className="grid w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
          variants={heroItemVariants}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Size</span>
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black"
            >
              {sizeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>

          {/* Color filter removed (feature disabled) */}

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Availability</span>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black"
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </motion.div>

        <motion.div
          className="grid w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
          variants={heroItemVariants}
        >
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Min Price ({isNepal ? 'NPR' : 'INR'})</span>
            <input
              type="number"
              min={0}
              step={10}
              value={minPriceInput}
              onChange={(e) => setMinPriceInput(e.target.value)}
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black"
              placeholder={priceBounds.min ? String(priceBounds.min) : '0'}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Max Price ({isNepal ? 'NPR' : 'INR'})</span>
            <input
              type="number"
              min={0}
              step={10}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black"
              placeholder={priceBounds.max ? String(priceBounds.max) : '0'}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/45">Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 rounded-xl border border-black/15 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="h-11 w-full rounded-xl border border-black/20 bg-white px-3 text-sm font-black uppercase tracking-[0.14em] text-black transition-colors hover:bg-black hover:text-white"
            >
              Clear All
            </button>
          </div>
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
                <EmptyState query={searchQuery} onResetFilters={resetFilters} key="empty" />
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
                        inStock={product.inStock}
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
  );
};

export default CollectionsPage;
