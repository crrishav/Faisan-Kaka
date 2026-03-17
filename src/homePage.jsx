import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductSection from './Components/productSection.jsx';
import Footer from './Components/footer.jsx';
import DeliverySection from './Components/DeliverySection.jsx';
import PrintSection from './Components/PrintSection.jsx';

const HomePage = () => {
  const location = useLocation();

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

      {/* Print Section */}
      <PrintSection />

      <Footer />
    </div>
  );
};

export default HomePage;
