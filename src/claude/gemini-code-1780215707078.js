import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchProductBySlug } from '../lib/sanityClient.js';
import { buildSanityImageUrl, getResponsiveImageProps } from '../lib/responsiveImage.js';
import useCurrency from './currencyContext.jsx';
import { normalizeMoneyValue } from '../lib/money.js';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

const ProductCard = ({ title, price, backImage, frontImage, slug, priceINR, priceNPR, inStock }) => {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const isMobile = useIsMobile();

  // Preload both images
  useEffect(() => {
    if (backImage)  { const img = new Image(); img.src = buildSanityImageUrl(backImage,  { width: 560, quality: 72 }); }
    if (frontImage) { const img = new Image(); img.src = buildSanityImageUrl(frontImage, { width: 560, quality: 72 }); }
  }, [backImage, frontImage]);

  const primaryImageProps = getResponsiveImageProps({
    src: frontImage || backImage,
    alt: title,
    widths: [240, 320, 420, 560, 840],
    sizes: '(max-width: 768px) 80vw, 280px',
    fallbackWidth: 560,
    quality: 78,
    loading: 'eager',
    fetchPriority: 'high',
  });

  const hoverImageProps = getResponsiveImageProps({
    src: backImage,
    alt: title,
    widths: [240, 320, 420, 560, 840],
    sizes: '(max-width: 768px) 80vw, 280px',
    fallbackWidth: 560,
    quality: 76,
    loading: 'lazy',
  });

  const resolvedPriceINR = normalizeMoneyValue(priceINR || (currency === 'INR' ? price : 0), price);
  const resolvedPriceNPR = normalizeMoneyValue(priceNPR || (currency === 'NPR' ? price : 0), price);

  const handleNavigate = () => {
    if (!slug) return;
    prefetchProductBySlug(slug);
    navigate(`/product/${slug}`);
  };

  return (
    <div
      className="w-[80vw] max-w-[280px] md:w-[280px] min-w-0 flex-shrink-0 mx-auto rounded-[32px] bg-[#D9D9D9] p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleNavigate}
    >
      {/* Image — original 3/4 card preserved */}
      <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-[24px]">
        <img
          {...primaryImageProps}
          /* Using object-contain and scale to let oversized shirts sit comfortably without clipping the hem */
          className="absolute inset-0 w-full h-full object-contain scale-115 md:scale-100 md:object-cover pointer-events-none"
          draggable={false}
          style={{
            /* Shifts the focal center down on mobile to center the graphic and show the collar/hem nicely */
            objectPosition: isMobile ? 'center 40%' : 'center center',
            opacity: hovered && backImage ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }}
        />
        {backImage && (
          <img
            {...hoverImageProps}
            className="absolute inset-0 w-full h-full object-contain scale-115 md:scale-100 md:object-cover pointer-events-none"
            draggable={false}
            style={{
              objectPosition: isMobile ? 'center 40%' : 'center center',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          />
        )}

        {/* Out of stock overlay */}
        {inStock === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-[24px]">
            <span className="text-white text-xs font-black tracking-widest uppercase bg-black/60 px-3 py-1.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Title + price */}
      <div className="flex flex-col gap-1 w-full my-3">
        <h3 className="font-bold text-lg text-black leading-tight">{title}</h3>
        <p className="text-gray-700 font-semibold">{price}</p>
      </div>

      {/* CTA */}
      <button
        className="w-full py-2.5 rounded-2xl bg-black text-white text-sm font-bold tracking-tight hover:bg-neutral-800 active:scale-95 transition-all duration-150 cursor-pointer"
        onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
        aria-label={`View ${title}`}
      >
        View Product
      </button>
    </div>
  );
};

export default ProductCard;