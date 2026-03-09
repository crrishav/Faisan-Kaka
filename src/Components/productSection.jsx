import React, { useRef } from 'react';
import ProductCard from './productCard.jsx';
import ArrowButton from './arrowButton.jsx';

const ProductSection = ({ title }) => {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const products = Array(8).fill({ title: "White T-Shirt", price: "$9.99", image: "/products/shirt.png" });

  return (
    <section className="w-full py-12 flex flex-col items-center relative mt-8 outline-none">
      {/* Header Section */}
      <div className="w-full px-10 md:px-32 flex flex-col items-center md:items-start mb-4 md:mb-6">
        <h2 className="text-5xl md:text-3xl font-black text-black tracking-tighter">{title}</h2>
      </div>

      <div className="w-full relative flex items-center group">
        {/* Left feathering overlay */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        
        {/* Left Navigation */}
        <div className="absolute left-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowButton direction="left" onClick={() => scroll('left')} />
        </div>

        {/* Scrollable List */}
        <div 
          ref={scrollContainerRef}
          className="w-full flex overflow-x-auto gap-10 px-32 py-8 scroll-smooth no-scrollbar outline-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, index) => (
            <div key={index} className="flex-shrink-0">
              <ProductCard {...product} />
            </div>
          ))}
        </div>

        {/* Right Navigation */}
        <div className="absolute right-8 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowButton direction="right" onClick={() => scroll('right')} />
        </div>

        {/* Right feathering overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      </div>
    </section>
  );
};

export default ProductSection;
