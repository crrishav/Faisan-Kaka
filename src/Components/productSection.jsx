import React, { useRef, useMemo } from 'react';
import ProductCard from './productCard.jsx';
import ArrowButton from './arrowButton.jsx';
import useProducts from './useProducts.jsx';

const ProductSection = ({ title }) => {
  const scrollContainerRef = useRef(null);

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
        behavior: 'smooth'
      });
    }
  };

  // Updated: Now destructures loading and error states
  const { products, loading, error } = useProducts();
  const sectionProducts = products.filter(p => p.category === title);
  
  const isNepal = useMemo(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      const langs = navigator.languages || [navigator.language || ''];
      const langNepal = langs.some(l => /-NP$/i.test(l));
      const tzNepal = /Asia\/Kathmandu/i.test(tz);
      return langNepal || tzNepal;
    } catch {
      return false;
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <section data-product-section className="w-full py-12 flex flex-col items-center relative mt-8 outline-none max-w-[100vw]">
        <div className="w-full px-4 md:px-32 flex flex-col items-center md:items-start mb-4 md:mb-6">
          <h2 className="text-5xl md:text-3xl font-black text-black tracking-tighter">{title}</h2>
        </div>
        <div className="w-full h-40 flex items-center justify-center">
          <p className="text-gray-400 text-lg">Loading products...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section data-product-section className="w-full py-12 flex flex-col items-center relative mt-8 outline-none max-w-[100vw]">
        <div className="w-full px-4 md:px-32 flex flex-col items-center md:items-start mb-4 md:mb-6">
          <h2 className="text-5xl md:text-3xl font-black text-black tracking-tighter">{title}</h2>
        </div>
        <div className="w-full h-40 flex items-center justify-center">
          <p className="text-red-500 text-lg">Error loading products. Please try again later.</p>
        </div>
      </section>
    );
  }

  // No products state
  if (sectionProducts.length === 0) {
    return (
      <section data-product-section className="w-full py-12 flex flex-col items-center relative mt-8 outline-none max-w-[100vw]">
        <div className="w-full px-4 md:px-32 flex flex-col items-center md:items-start mb-4 md:mb-6">
          <h2 className="text-5xl md:text-3xl font-black text-black tracking-tighter">{title}</h2>
        </div>
        <div className="w-full h-40 flex items-center justify-center">
          <p className="text-gray-400 text-lg">No products available in this category.</p>
        </div>
      </section>
    );
  }

  return (
    <section data-product-section className="w-full py-12 flex flex-col items-center relative mt-8 outline-none max-w-[100vw]">
      {/* Header Section */}
      <div className="w-full px-4 md:px-32 flex flex-col items-center md:items-start mb-4 md:mb-6">
        <h2 className="text-5xl md:text-3xl font-black text-black tracking-tighter">{title}</h2>
      </div>

      <div className="w-full relative flex items-center group max-w-[100vw] overflow-x-auto">
        {/* Left feathering overlay */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        
        {/* Left Navigation (only show if more than one product) */}
        {sectionProducts.length > 1 && (
          <div className="absolute left-4 md:left-8 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation">
            <ArrowButton direction="left" onClick={() => scroll('left')} />
          </div>
        )}

        {/* Scrollable List */}
        <div 
          ref={scrollContainerRef}
          className="w-full flex overflow-x-auto gap-4 md:gap-10 py-8 scroll-smooth no-scrollbar outline-none snap-x snap-mandatory md:snap-none px-[10vw] md:px-32"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sectionProducts.map((product) => (
            <div key={product._id} className="flex-shrink-0 carousel-item w-[80vw] max-w-[280px] snap-center mx-auto">
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
          ))}
        </div>

        {/* Right Navigation (only show if more than one product) */}
        {sectionProducts.length > 1 && (
          <div className="absolute right-4 md:right-8 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation">
            <ArrowButton direction="right" onClick={() => scroll('right')} />
          </div>
        )}

        {/* Right feathering overlay */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      </div>
    </section>
  );
};

export default ProductSection;
