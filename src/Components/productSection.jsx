import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './productCard.jsx';
import ArrowButton from './arrowButton.jsx';
import useProducts from './useProducts.jsx';

const ProductSection = ({ title }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const { products, loading, error } = useProducts();
  const sectionProducts = products.filter(p => p.category === title);

  // Drag-to-scroll refs
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrameId = useRef(null);
  const isTouchDragging = useRef(false);
  const touchStartX = useRef(0);
  const touchScrollStart = useRef(0);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Use a small buffer to avoid flickering
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && !loading && sectionProducts.length > 0) {
      // Small timeout to ensure DOM is rendered and scrollWidth is accurate
      const timeoutId = setTimeout(checkScroll, 100);
      
      const handleScroll = () => {
        checkScroll();
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      
      return () => {
        clearTimeout(timeoutId);
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScroll);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      };
    }
  }, [loading, sectionProducts.length]);

  const applyMomentum = () => {
    if (Math.abs(velocity.current) > 0.1 && !isDragging.current) {
      scrollContainerRef.current.scrollLeft -= velocity.current;
      velocity.current *= 0.95; // Friction
      checkScroll(); // Ensure arrows update during momentum
      animationFrameId.current = requestAnimationFrame(applyMomentum);
    } else {
      velocity.current = 0;
      if (scrollContainerRef.current) {
        scrollContainerRef.current.style.scrollBehavior = 'smooth';
      }
    }
  };

  const handleMouseDown = (e) => {
    // Only for desktop
    if (window.innerWidth < 768) return;
    
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current.scrollLeft;
    lastX.current = e.pageX;
    lastTime.current = Date.now();
    velocity.current = 0;
    
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    
    // Disable smooth scroll during drag
    scrollContainerRef.current.style.scrollBehavior = 'auto';
    scrollContainerRef.current.style.cursor = 'grabbing';
    scrollContainerRef.current.style.userSelect = 'none';

    // Add window listeners to catch mouseup outside the container
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const now = Date.now();
    const dt = now - lastTime.current;
    const dx = e.pageX - lastX.current;
    
    if (dt > 0) {
      velocity.current = dx / (dt / 16); // Normalized to 60fps
    }
    
    lastX.current = e.pageX;
    lastTime.current = now;

    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    
    if (Math.abs(walk) > 5) {
      hasMoved.current = true;
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.scrollBehavior = 'smooth';
      scrollContainerRef.current.style.cursor = 'grab';
      scrollContainerRef.current.style.removeProperty('user-select');
      
      // If we were moving fast, apply momentum
      if (Math.abs(velocity.current) > 1) {
        scrollContainerRef.current.style.scrollBehavior = 'auto'; // Disable smooth for momentum
        animationFrameId.current = requestAnimationFrame(applyMomentum);
      }
    }

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
  };

  const handleTouchStart = (e) => {
    if (window.innerWidth >= 768 || !scrollContainerRef.current) return;
    if (e.touches.length !== 1) return;

    isTouchDragging.current = true;
    hasMoved.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchScrollStart.current = scrollContainerRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (window.innerWidth >= 768 || !isTouchDragging.current || !scrollContainerRef.current) return;
    if (e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStartX.current;
    const walk = deltaX * 0.65; // Mobile-only reduced swipe sensitivity.

    if (Math.abs(walk) > 4) {
      hasMoved.current = true;
      e.preventDefault();
    }

    scrollContainerRef.current.scrollLeft = touchScrollStart.current - walk;
  };

  const handleTouchEnd = () => {
    isTouchDragging.current = false;
  };

  const renderHeader = () => (
    <div className="w-full px-4 md:px-32 flex flex-col items-center md:flex-row md:items-end md:justify-between gap-3 mb-4 md:mb-6">
      <h2 className="text-5xl md:text-3xl font-black text-black tracking-tighter">{title}</h2>
      <button
        type="button"
        onClick={() => navigate('/collections')}
        className="inline-flex items-center justify-center rounded-full border border-black bg-transparent px-5 py-2.5 text-sm font-bold text-black transition-colors duration-200 hover:bg-black hover:text-white active:scale-[0.98] cursor-pointer"
      >
        View All
      </button>
    </div>
  );

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
        {renderHeader()}
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
        {renderHeader()}
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
        {renderHeader()}
        <div className="w-full h-40 flex items-center justify-center">
          <p className="text-gray-400 text-2xl md:text-3xl font-medium">Coming Soon</p>
        </div>
      </section>
    );
  }

  return (
    <section data-product-section className="w-full py-12 flex flex-col items-center relative mt-8 outline-none max-w-[100vw]">
      {renderHeader()}

      <div className="w-full relative flex items-center group max-w-[100vw] overflow-x-hidden">
        {/* Left feathering overlay */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        
        {/* Left Navigation (only show if more than one product and can scroll left) */}
        {sectionProducts.length > 1 && (
          <div 
            className={`absolute left-4 md:left-8 z-20 transition-all duration-300 touch-manipulation ${
              showLeftArrow ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none -translate-x-4'
            }`}
          >
            <ArrowButton direction="left" onClick={() => scroll('left')} />
          </div>
        )}

        {/* Scrollable List */}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="w-full flex overflow-x-auto gap-4 md:gap-10 py-8 scroll-smooth no-scrollbar outline-none snap-x snap-mandatory md:snap-none px-[10vw] md:px-32 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-y' }}
        >
          {sectionProducts.map((product) => (
            <div 
              key={product._id} 
              className="flex-shrink-0 carousel-item w-[80vw] max-w-[280px] snap-center mx-auto"
              onClickCapture={(e) => {
                if (hasMoved.current) {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
            >
              <ProductCard 
                title={product.name} 
                price={
                  isNepal
                    ? (product.priceNPR ? `Rs. ${product.priceNPR}` : 'Rs. —')
                    : (product.priceINR ? `₹${product.priceINR}` : '₹—')
                  }
                priceINR={product.priceINR}
                priceNPR={product.priceNPR}
                backImage={product.backImage} 
                frontImage={product.frontImage} 
                slug={product.slug}
                inStock={product.inStock}
              />
            </div>
          ))}
        </div>

        {/* Right Navigation (only show if more than one product and can scroll right) */}
        {sectionProducts.length > 1 && (
          <div 
            className={`absolute right-4 md:right-8 z-20 transition-all duration-300 touch-manipulation ${
              showRightArrow ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none translate-x-4'
            }`}
          >
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
