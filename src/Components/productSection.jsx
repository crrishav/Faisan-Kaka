import React, { useRef, useMemo } from 'react';
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

  const products = useMemo(() => {
    const files = import.meta.glob('/src/assets/Collection/**/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
    const map = {};
    for (const [path, url] of Object.entries(files)) {
      const parts = path.split('/');
      const idx = parts.indexOf('Collection');
      const category = parts[idx + 1];
      const filename = parts[parts.length - 1];
      const cleaned = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/^\d+\.\s*/, '');
      const rx = /^(.*?)(?:\s*\((front|back)\))\s*\(([^,]+)\s*,\s*([^)]+)\)\s*$/i;
      const m = cleaned.match(rx);
      const name = m ? m[1].trim() : cleaned.replace(/\s*\(.*\)\s*$/, '').trim();
      const variant = m ? m[2].toLowerCase() : '';
      const priceINR = m ? m[3].trim() : undefined;
      const priceNPR = m ? m[4].trim() : undefined;
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const key = `${category}:${slug}`;
      if (!map[key]) {
        map[key] = { category, name, slug, priceINR: undefined, priceNPR: undefined, backImage: undefined, frontImage: undefined };
      }
      if (priceINR && !map[key].priceINR) map[key].priceINR = priceINR;
      if (priceNPR && !map[key].priceNPR) map[key].priceNPR = priceNPR;
      if (variant === 'front') {
        map[key].frontImage = url;
      } else if (variant === 'back') {
        map[key].backImage = url;
      } else {
        map[key].backImage = map[key].backImage || url;
      }
    }
    const list = Object.values(map);
    const hash = (s) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h;
    };
    return list.sort((a, b) => hash(a.slug) - hash(b.slug));
  }, []);
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
          {sectionProducts.map((product, index) => (
            <div key={index} className="flex-shrink-0">
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
