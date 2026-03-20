import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import ProductSection from './Components/productSection.jsx';
import Footer from './Components/footer.jsx';
import DeliverySection from './Components/DeliverySection.jsx';
import PrintSection from './Components/PrintSection.jsx';

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const textContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.15 } },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const cardContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.22 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
};

const fabricFitCards = [
  {
    title: 'Fabric Weight',
    description:
      'Mid-weight premium cotton blend that keeps structure without feeling heavy, made for all-day wear.',
  },
  {
    title: 'Fit Profile',
    description:
      'Relaxed streetwear silhouette with clean shoulders and room where it matters for movement and layering.',
  },
  {
    title: 'Wash Durability',
    description:
      'Colorfast finish and reinforced seams help maintain shape and print quality across repeated washes.',
  },
];

const printWorkflowSteps = [
  {
    title: 'Upload Design',
    description: 'Submit your artwork in PNG, JPG, SVG, or PDF directly from any device.',
  },
  {
    title: 'Review Mockup',
    description: 'We prepare a placement preview so you can confirm the look before production.',
  },
  {
    title: 'Delivered',
    description: 'Your final piece is printed with care, quality-checked, and shipped to your door.',
  },
];

const HomePage = () => {
  const location = useLocation();
  const fabricSectionRef = useRef(null);
  const workflowSectionRef = useRef(null);
  const fabricInView = useInView(fabricSectionRef, { amount: 0.2, once: false });
  const workflowInView = useInView(workflowSectionRef, { amount: 0.2, once: false });

  useEffect(() => {
    const PENDING_CATEGORY_KEY = 'fk_pending_category_scroll';

    const getPendingCategory = () => {
      const fromState = location.state?.scrollToCategory;
      if (typeof fromState === 'string' && fromState.trim()) {
        return fromState.trim();
      }

      try {
        const fromStorage = window.sessionStorage.getItem(PENDING_CATEGORY_KEY);
        return fromStorage ? fromStorage.trim() : '';
      } catch {
        return '';
      }
    };

    const clearPendingCategory = () => {
      try {
        window.sessionStorage.removeItem(PENDING_CATEGORY_KEY);
      } catch {
        // Ignore storage failures.
      }
    };

    const pendingCategory = getPendingCategory();
    if (!pendingCategory) return;

    let attempts = 0;
    const maxAttempts = 18;
    const retryDelay = 140;

    const performScroll = (top) => {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(top);
      } else {
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };

    const tryScroll = () => {
      const sections = document.querySelectorAll('[data-product-section]');
      for (const section of sections) {
        const heading = section.querySelector('h2');
        if (heading && heading.textContent.trim() === pendingCategory) {
          const rect = section.getBoundingClientRect();
          const top = window.scrollY + rect.top - 100;
          performScroll(top);
          clearPendingCategory();
          return;
        }
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryScroll, retryDelay);
      }
    };

    window.setTimeout(tryScroll, 70);
  }, [location.state]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden max-w-[100vw]">
      {/* Hero Section (Empty for now) */}
      <div className="w-full h-screen flex items-center justify-center bg-white max-w-[100vw] overflow-x-hidden">
        {/* Placeholder for Hero content */}
        <h1 className="text-2xl text-gray-400 font-light tracking-widest uppercase">Video Here</h1>
      </div>

      {/* Product Sections */}
      <div className="w-full bg-white relative flex flex-col gap-16 pb-24 max-w-[100vw] overflow-x-hidden">
        <ProductSection title="T-Shirts" />
        <ProductSection title="Hoodies" />
        <ProductSection title="Pants" />
      </div>

      {/* Delivery Section */}
      <DeliverySection />

      {/* Fabric + Fit Explainer */}
      <motion.section
        ref={fabricSectionRef}
        className="w-full bg-white py-16 md:py-24 px-4 md:px-8 lg:px-12"
        variants={sectionVariants}
        initial="hidden"
        animate={fabricInView ? 'visible' : 'hidden'}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="mb-10 md:mb-14 text-center md:text-left"
            variants={textContainerVariants}
            initial="hidden"
            animate={fabricInView ? 'visible' : 'hidden'}
          >
            <motion.p className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-black/60" variants={textItemVariants}>
              Why It Feels Better
            </motion.p>
            <motion.h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-black leading-[1.05]" variants={textItemVariants}>
              Fabric and Fit,
              <br className="hidden md:block" />
              Explained Clearly
            </motion.h2>
            <motion.p className="mt-4 text-sm md:text-base text-black/65 max-w-2xl mx-auto md:mx-0" variants={textItemVariants}>
              Quick product confidence at a glance to reduce guesswork before checkout.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            animate={fabricInView ? 'visible' : 'hidden'}
          >
            {fabricFitCards.map((card) => (
              <motion.article
                key={card.title}
                className="rounded-3xl border border-black/10 bg-white p-6 md:p-7 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
                variants={cardVariants}
              >
                <h3 className="text-xl md:text-2xl font-bold text-black">{card.title}</h3>
                <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-black/70">{card.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Print Workflow Preview */}
      <motion.section
        ref={workflowSectionRef}
        className="w-full bg-white py-16 md:py-24 px-4 md:px-8 lg:px-12"
        variants={sectionVariants}
        initial="hidden"
        animate={workflowInView ? 'visible' : 'hidden'}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="mb-10 md:mb-14 text-center"
            variants={textContainerVariants}
            initial="hidden"
            animate={workflowInView ? 'visible' : 'hidden'}
          >
            <motion.p className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-black/60" variants={textItemVariants}>
              How Custom Print Works
            </motion.p>
            <motion.h2 className="mt-3 text-3xl md:text-5xl font-black tracking-tight text-black leading-[1.05]" variants={textItemVariants}>
              From Design to Door,
              <br className="hidden md:block" />
              in 3 Steps
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
            variants={cardContainerVariants}
            initial="hidden"
            animate={workflowInView ? 'visible' : 'hidden'}
          >
            {printWorkflowSteps.map((step, index) => (
              <motion.article
                key={step.title}
                className="relative rounded-3xl border border-black/10 bg-white p-6 md:p-7 shadow-[0_8px_22px_rgba(0,0,0,0.04)]"
                variants={cardVariants}
              >
                <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black text-white text-sm font-bold">
                  {index + 1}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-black">{step.title}</h3>
                <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-black/70">{step.description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Print Section */}
      <PrintSection />

      <Footer />
    </div>
  );
};

export default HomePage;
