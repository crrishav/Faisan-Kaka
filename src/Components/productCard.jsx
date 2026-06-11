import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchProductBySlug } from '../lib/sanityClient.js';
import { buildSanityImageUrl, getResponsiveImageProps } from '../lib/responsiveImage.js';
import useCurrency from './currencyContext.jsx';
import { normalizeMoneyValue } from '../lib/money.js';

const ProductCard = ({ title, price, backImage, frontImage, slug, priceINR, priceNPR, inStock = true }) => {
  const navigate = useNavigate();
  const { currency } = useCurrency();

  useEffect(() => {
    if (backImage) { const img = new Image(); img.src = buildSanityImageUrl(backImage, { width: 560, quality: 72 }); }
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
      className={`w-[80vw] max-w-[280px] md:w-[280px] min-w-0 flex-shrink-0 mx-auto rounded-[32px] p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer bg-[#D9D9D9]`}
      onClick={handleNavigate}
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-[24px]">
        <img
          {...primaryImageProps}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Title + price */}
      <div className="flex flex-col gap-1 w-full mb-3">
        <h3 className="font-bold text-lg text-black leading-tight">{title}</h3>
        <p className="text-gray-700 font-semibold">{price}</p>
      </div>

      {/* CTA */}
      <button
        className="w-full py-2.5 rounded-2xl text-white text-sm font-bold tracking-tight transition-all duration-200 active:scale-95 bg-black hover:bg-neutral-800 cursor-pointer"
        onClick={(e) => { 
          e.stopPropagation(); 
          handleNavigate(); 
        }}
        aria-label={`View ${title}`}
      >
        View Product
      </button>
    </div>
  );
};

export default ProductCard;
