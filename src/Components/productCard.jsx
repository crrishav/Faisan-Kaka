import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { prefetchProductBySlug } from '../lib/sanityClient.js';
import useCart from './useCart.jsx';
import useCurrency from './currencyContext.jsx';

const QUICK_SIZES = ['S', 'M', 'L', 'XL'];
const QUICK_COLORS = ['#111111', '#2f2f2f', '#d9d9d9', '#1e3a8a'];

const ProductCard = ({ title, price, backImage, frontImage, slug, priceINR, priceNPR }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { currency } = useCurrency();
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [addedFlash, setAddedFlash] = useState(false);

  useEffect(() => {
    if (backImage) { const img = new Image(); img.src = backImage; }
    if (frontImage) { const img = new Image(); img.src = frontImage; }
  }, [backImage, frontImage]);

  useEffect(() => {
    if (!addedFlash) return undefined;
    const timer = setTimeout(() => setAddedFlash(false), 950);
    return () => clearTimeout(timer);
  }, [addedFlash]);

  const toNumber = (value) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    const fromString = Number(String(value || '').replace(/[^\d.]/g, ''));
    return Number.isFinite(fromString) ? fromString : 0;
  };

  const resolvedPriceINR = toNumber(priceINR || (currency === 'INR' ? price : 0));
  const resolvedPriceNPR = toNumber(priceNPR || (currency === 'NPR' ? price : 0));

  const handleQuickPick = (nextSize, nextColor) => {
    const finalSize = nextSize || selectedSize;
    const finalColor = nextColor || selectedColor;

    setSelectedSize(finalSize || null);
    setSelectedColor(finalColor || null);

    if (!finalSize || !finalColor) return;

    const id = slug || title.toLowerCase().replace(/\s+/g, '-');
    addItem({
      id,
      title,
      priceINR: resolvedPriceINR,
      priceNPR: resolvedPriceNPR,
      quantity: 1,
      size: finalSize,
      color: finalColor,
      frontImage,
      backImage,
      slug: id,
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
      <div className="w-full">
        <button
          className={`w-full py-2.5 rounded-2xl bg-black text-white text-sm font-bold tracking-tight
                     transition-all duration-250 ease-out hover:bg-neutral-800 active:scale-95 cursor-pointer
                     ${hovered ? 'md:opacity-0 md:-translate-y-2 md:max-h-0 md:overflow-hidden md:py-0 md:pointer-events-none' : 'opacity-100 translate-y-0 max-h-16'}`}
          onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
          aria-label={`View ${title}`}
        >
          View Product
        </button>

        <div
          className={`hidden md:block transition-all duration-250 ease-out ${
            hovered ? 'opacity-100 max-h-32 mt-2' : 'opacity-0 max-h-0 overflow-hidden'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-2">
            {QUICK_SIZES.map((size) => (
              <button
                key={`${slug || title}-size-${size}`}
                type="button"
                onClick={() => handleQuickPick(size, null)}
                className={`h-8 min-w-8 px-2 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedSize === size ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'
                }`}
                aria-label={`Select size ${size}`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            {QUICK_COLORS.map((color) => (
              <button
                key={`${slug || title}-color-${color}`}
                type="button"
                onClick={() => handleQuickPick(null, color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-105 cursor-pointer ${
                  selectedColor === color ? 'border-black' : 'border-black/10'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>

          <div className="mt-2 h-4 text-[11px] font-bold text-center tracking-wide uppercase">
            <span className={`${addedFlash ? 'text-green-700 opacity-100' : 'text-black/45 opacity-100'} transition-colors`}>
              {addedFlash ? 'Added to Cart' : 'Pick size + color'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
