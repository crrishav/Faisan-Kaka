import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchProductBySlug } from '../lib/sanityClient.js';

const ProductCard = ({ title, price, backImage, frontImage, slug }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (backImage) { const img = new Image(); img.src = backImage; }
    if (frontImage) { const img = new Image(); img.src = frontImage; }
  }, [backImage, frontImage]);

  const handleNavigate = () => {
    if (!slug) return;
    prefetchProductBySlug(slug);
    navigate(`/product/${slug}`);
  };

  return (
    <div
      className="w-[80vw] max-w-[280px] md:w-[280px] min-w-0 flex-shrink-0 mx-auto rounded-[32px] bg-[#D9D9D9] p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleNavigate}
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-[24px]">
        <img
          src={frontImage || backImage}
          alt={title}
          loading="eager"
          fetchPriority="high"
          className={`absolute inset-0 w-full h-full object-cover transition-none ${hovered && backImage ? 'opacity-0' : 'opacity-100'}`}
        />
        {backImage && (
          <img
            src={backImage}
            alt={title}
            loading="eager"
            fetchPriority="high"
            className={`absolute inset-0 w-full h-full object-cover transition-none ${hovered ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>

      {/* Title + price */}
      <div className="flex flex-col gap-1 w-full mb-3">
        <h3 className="font-bold text-lg text-black leading-tight">{title}</h3>
        <p className="text-gray-700 font-semibold">{price}</p>
      </div>

      {/* CTA button */}
      <button
        className="w-full py-2.5 rounded-2xl bg-black text-white text-sm font-bold tracking-tight
                   transition-all duration-250 ease-out
                   hover:bg-neutral-800 active:scale-95
                   cursor-pointer opacity-100 translate-y-0"
        onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
        aria-label={`View ${title}`}
      >
        View Product
      </button>
    </div>
  );
};

export default ProductCard;
