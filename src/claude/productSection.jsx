import React, { useRef, useMemo, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProductCard from './productCard.jsx';
import ArrowButton from './arrowButton.jsx';
import useProducts from './useProducts.jsx';

/* ─── Variants ─────────────────────────────────────────────────── */

const headerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const headerItemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.15 + i * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

/* ─── Component ────────────────────────────────────────────────── */

const ProductSection = ({ title }) => {
  const scrollContainerRef = useRef(null);
  const sectionRef = useRef(null);
  const navigate = useNavigate();

  const isInView = useInView(sectionRef, { amount: 0.1, once: true });

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      let scrollAmount = container.clientWidth;
      const firstChild = container.querySelector('.carousel-item');
      if (firstChild) {
        const style = window.getComputedStyle(container);
        const gap = parseFloat(style.gap) || 0;
        scrollAmount = firstChild.getBoundingClientRect().width + gap;
      }
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const { products, loading, error } = useProducts();

  useEffect(() => {
    products.forEach((product) => {
      if (product.allImages?.length > 0) {
        product.allImages.forEach((imageUrl) => {
          if (imageUrl) { const img = new Image(); img.src = imageUrl; }
        });
      }
    });
  }, [products]);

  const sectionProducts = products.filter((p) => p.category === title);

  const isNepal = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const langs = navigator.languages || [navigator.language || ''];
      const langNepal = langs.some((l) => /-NP$/i.test(l));
      const tzNepal = /Asia\/Kathmandu/i.test(tz);
      return langNepal || tzNepal;
    } catch { return false; }
  }, []);

  return (
    <section
      ref={sectionRef}
      data-product-section
      className="w-full py-12 flex flex-col items-center relative mt-8 outline-none max-w-[100vw]"
    >
      {/* ── Header ── */}
      <motion.div
        className="w-full px-4 md:px-32 flex flex-col items-center md:flex-row md:items-end md:justify-between mb-4 md:mb-6"
        variants={headerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <motion.h2
          className="text-5xl md:text-3xl font-black text-black tracking-tighter"
          variants={headerItemVariants}
        >
          {title}
        </motion.h2>

        {/* View All button */}
        <motion.button
          variants={headerItemVariants}
          onClick={() => navigate('/collections')}
          className="mt-3 md:mt-0 flex items-center gap-1.5 text-sm font-semibold text-black border border-black rounded-full px-4 py-1.5 hover:bg-black hover:text-white transition-colors duration-200"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          View All
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </motion.div>

      {/* ── Carousel ── */}
      <div className="w-full relative flex items-center group max-w-[100vw] overflow-x-auto">
        {/* Left feather */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />

        {/* Left arrow */}
        {sectionProducts.length > 1 && (
          <div className="absolute left-4 md:left-8 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation">
            <ArrowButton direction="left" onClick={() => scroll('left')} />
          </div>
        )}

        {/* Scrollable track */}
        <div
          ref={scrollContainerRef}
          className="w-full flex overflow-x-auto gap-4 md:gap-10 py-8 scroll-smooth no-scrollbar outline-none snap-x snap-mandatory md:snap-none px-[10vw] md:px-32"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sectionProducts.map((product, index) => (
            <motion.div
              key={product._id || index}
              className="flex-shrink-0 carousel-item w-[80vw] max-w-[280px] snap-center mx-auto"
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
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
            </motion.div>
          ))}
        </div>

        {/* Right arrow */}
        {sectionProducts.length > 1 && (
          <div className="absolute right-4 md:right-8 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation">
            <ArrowButton direction="right" onClick={() => scroll('right')} />
          </div>
        )}

        {/* Right feather */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      </div>
    </section>
  );
};

export default ProductSection;
