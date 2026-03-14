import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ title, price, backImage, frontImage, slug }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (backImage) {
      const img = new Image();
      img.src = backImage;
    }
    if (frontImage) {
      const img = new Image();
      img.src = frontImage;
    }
  }, [backImage, frontImage]);
  return (
    <div 
      className="w-[80vw] max-w-[280px] md:w-[280px] min-w-0 flex-shrink-0 mx-auto rounded-[32px] bg-[#D9D9D9] p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (slug) {
          navigate(`/product/${slug}`);
          if (window.lenis && typeof window.lenis.scrollTo === 'function') {
            setTimeout(() => window.lenis.scrollTo(0, { immediate: true }), 0);
          } else {
            setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 0);
          }
        }
      }}
    >
      <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-[24px]">
        <img 
          src={frontImage || backImage} 
          alt={title} 
          loading="eager"
          fetchpriority="high"
          className={`absolute inset-0 w-full h-full object-cover transition-none ${hovered && backImage ? 'opacity-0' : 'opacity-100'}`} 
        />
        {backImage && (
          <img 
            src={backImage} 
            alt={title} 
            loading="eager"
            fetchpriority="high"
            className={`absolute inset-0 w-full h-full object-cover transition-none ${hovered ? 'opacity-100' : 'opacity-0'}`} 
          />
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-lg text-black leading-tight">{title}</h3>
        <p className="text-gray-700 font-semibold">{price}</p>
      </div>
    </div>
  );
};

export default ProductCard;
