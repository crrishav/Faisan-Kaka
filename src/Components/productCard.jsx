import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchProductBySlug } from '../lib/sanityClient.js';
import { buildSanityImageUrl, getResponsiveImageProps } from '../lib/responsiveImage.js';
import useCart from './useCart.jsx';
import useCurrency from './currencyContext.jsx';
import { normalizeMoneyValue } from '../lib/money.js';

const QUICK_SIZES = ['S', 'M', 'L', 'XL'];
const QUICK_COLORS = ['#111111', '#2f2f2f', '#d9d9d9', '#1e3a8a'];

const ProductCard = ({ title, price, backImage, frontImage, slug, priceINR, priceNPR, inStock }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [addedFlash, setAddedFlash] = useState(false);

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

  useEffect(() => {
    if (!addedFlash) return undefined;
    const timer = setTimeout(() => setAddedFlash(false), 950);
    return () => clearTimeout(timer);
  }, [addedFlash]);

  const resolvedPriceINR = normalizeMoneyValue(priceINR || (currency === 'INR' ? price : 0), price);
  const resolvedPriceNPR = normalizeMoneyValue(priceNPR || (currency === 'NPR' ? price : 0), price);

  const handleMouseEnter = () => {
    setSelectedSize(null);
    setSelectedColor(null);
    setAddedFlash(false);
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const handleQuickPick = (nextSize, nextColor) => {
    const finalSize = nextSize !== null ? nextSize : selectedSize;
    const finalColor = nextColor !== null ? nextColor : selectedColor;

    if (nextSize !== null) setSelectedSize(nextSize);
    if (nextColor !== null) setSelectedColor(nextColor);

    if (!finalSize || !finalColor) return;

    const baseId = slug || title.toLowerCase().replace(/\s+/g, '-');
    const id = `${baseId}-${finalColor}-${finalSize}`;
    addItem({
      id,
      title,
      priceINR: resolvedPriceINR,
      priceNPR: resolvedPriceNPR,
      displayPriceINR: String(priceINR || price || resolvedPriceINR),
      displayPriceNPR: String(priceNPR || price || resolvedPriceNPR),
      quantity: 1,
      size: finalSize,
      color: finalColor,
      frontImage,
      backImage,
      slug: baseId,
    });
    setAddedFlash(true);
  };

  const handleNavigate = () => {
    if (!slug) return;
    prefetchProductBySlug(slug);
    navigate(`/product/${slug}`);
  };

  return (
    <div
      className="w-[80vw] max-w-[280px] md:w-[280px] min-w-0 flex-shrink-0 mx-auto rounded-[32px] bg-[#D9D9D9] p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNavigate}
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] mb-3 overflow-hidden rounded-[24px]">
        <img
          {...primaryImageProps}
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] md:object-[center_85%] pointer-events-none"
          draggable={false}
          style={{
            opacity: hovered && backImage ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }}
        />
        {backImage && (
          <img
            {...hoverImageProps}
            className="absolute inset-0 w-full h-full object-cover object-[center_35%] md:object-[center_85%] pointer-events-none"
            draggable={false}
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.35s ease',
            }}
          />
        )}
      </div>

      {/* Title + price */}
      <div className="flex flex-col gap-1 w-full mb-3">
        <h3 className="font-bold text-lg text-black leading-tight">{title}</h3>
        <p className="text-gray-700 font-semibold">{price}</p>
      </div>

      {/* CTA - fixed height container so card never resizes */}
      <div className="w-full relative" style={{ height: '42px' }}>

        {/* "View Product" button - fades out on hover (desktop only) */}
        <button
          className="absolute inset-0 w-full py-2.5 rounded-2xl bg-black text-white text-sm font-bold tracking-tight hover:bg-neutral-800 active:scale-95 cursor-pointer hidden md:block"
          style={{
            opacity: hovered ? 0 : 1,
            transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            pointerEvents: hovered ? 'none' : 'auto',
          }}
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          aria-label={`View ${title}`}
        >
          View Product
        </button>

        {/* Mobile: always show View Product normally */}
        <button
          className="absolute inset-0 w-full py-2.5 rounded-2xl bg-black text-white text-sm font-bold tracking-tight hover:bg-neutral-800 active:scale-95 cursor-pointer md:hidden"
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          aria-label={`View ${title}`}
        >
          View Product
        </button>

        {/* Quick-pick panel - fades in on hover, same fixed height */}
        <div
          className="absolute inset-0 hidden md:flex flex-col justify-between"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
            pointerEvents: hovered ? 'auto' : 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sizes row */}
          <div className="flex items-center justify-between gap-1">
            {QUICK_SIZES.map((size) => (
              <button
                key={`${slug || title}-size-${size}`}
                type="button"
                disabled={inStock === false}
                onClick={() => handleQuickPick(size, null)}
                className={`flex-1 h-[42px] rounded-xl text-[11px] font-bold transition-colors duration-150 ${inStock === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{
                  backgroundColor: selectedSize === size ? '#111' : 'rgba(0,0,0,0.1)',
                  color: selectedSize === size ? '#fff' : '#111',
                }}
                aria-label={`Select size ${size}`}
              >
                {size}
              </button>
            ))}

            {/* Color swatches inline on the right */}
            <div className="flex items-center gap-1 ml-1">
              {QUICK_COLORS.map((color) => (
                <button
                  key={`${slug || title}-color-${color}`}
                  type="button"
                  disabled={inStock === false}
                  onClick={() => handleQuickPick(null, color)}
                  className={`rounded-full transition-transform duration-150 ${inStock === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: color,
                    border: selectedColor === color
                      ? '2px solid #000'
                      : '2px solid rgba(0,0,0,0.15)',
                    boxShadow: selectedColor === color
                      ? '0 0 0 2px #D9D9D9, 0 0 0 3.5px #000'
                      : 'none',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Status hint */}
          <div
            className="text-[10px] font-bold tracking-widest uppercase text-center"
            style={{
              color: addedFlash ? '#15803d' : 'rgba(0,0,0,0.35)',
              transition: 'color 0.2s ease',
              lineHeight: 1,
              marginTop: '3px',
            }}
          >
            {addedFlash ? '✓ Added to Cart' : 'Pick size + color'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
