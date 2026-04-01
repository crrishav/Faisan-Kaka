import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useCart from './useCart.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useCurrency from './currencyContext.jsx';
import { getResponsiveImageProps } from '../lib/responsiveImage.js';

const ProductDetails = ({ 
  title = "T-Shirt (White)", 
  priceINR = "0", 
  priceNPR = "0", 
  description = "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have", 
  colors = ["#3D5443", "#4D3434", "#4A4A4A"], 
  sizes = ["M", "L", "S"],
  slug = undefined,
  frontImage = null,
  backImage = null
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const { addItem } = useCart();
  const { isNepal } = useCurrency();
  const displayPrice = isNepal ? `Rs. ${priceNPR}` : `₹${priceINR}`;
  
  const images = useMemo(() => {
    const unique = [frontImage, backImage].filter(Boolean);
    return [...new Set(unique)];
  }, [frontImage, backImage]);

  const sizingGuideState = useMemo(() => {
    if (!slug) return undefined;
    return {
      fromProduct: `/product/${encodeURIComponent(String(slug))}`,
    };
  }, [slug]);

  const activeMobileImageProps = getResponsiveImageProps({
    src: images[currentImageIndex],
    alt: `${title} preview ${currentImageIndex + 1}`,
    widths: [360, 480, 640, 800, 960],
    sizes: '(max-width: 768px) 100vw, 360px',
    fallbackWidth: 800,
    quality: 80,
    loading: 'eager',
    fetchPriority: 'high',
  });

  const clampZoom = (value) => Math.min(4, Math.max(1, value));

  const resetViewerTransform = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const openViewer = (index) => {
    setCurrentImageIndex(index);
    resetViewerTransform();
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
    setIsPanning(false);
    resetViewerTransform();
  };
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    resetViewerTransform();
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
    resetViewerTransform();
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => clampZoom(prev + 0.25));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = clampZoom(prev - 0.25);
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleViewerWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoomLevel((prev) => {
      const next = clampZoom(prev + delta);
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleViewerPointerDown = (e) => {
    if (zoomLevel <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleViewerPointerMove = (e) => {
    if (!isPanning || zoomLevel <= 1) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const stopPanning = () => {
    setIsPanning(false);
  };

  const handleViewerDoubleClick = () => {
    if (zoomLevel > 1) {
      resetViewerTransform();
      return;
    }
    setZoomLevel(2);
  };
  
  const handleAddToCart = () => {
    const id = slug || title.toLowerCase().replace(/\s+/g, '-');
    addItem({ id, title, priceINR, priceNPR, quantity, frontImage, backImage, slug: id });
  };
  
  const handleBuyNow = () => {
    handleAddToCart();
    // Add buy now logic here
  };

  useEffect(() => {
    if (!isViewerOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        closeViewer();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isViewerOpen]);

  return (
    <>
      <div className="w-full max-w-[480px] rounded-[28px] md:rounded-none bg-[#ebebeb] md:bg-transparent border border-black/10 md:border-0 shadow-[0_16px_40px_rgba(0,0,0,0.08)] md:shadow-none overflow-hidden mx-auto">
        {images.length > 0 && (
          <div className="p-4 sm:p-5 pb-3 sm:pb-4 md:hidden">
            <div className="relative rounded-[22px] bg-white/70 overflow-hidden border border-black/5">
              <button
                type="button"
                className="block w-full cursor-pointer"
                onClick={() => openViewer(currentImageIndex)}
                aria-label="Open image viewer"
              >
                <img
                  {...activeMobileImageProps}
                  className="w-full h-[300px] sm:h-[360px] object-cover"
                />
              </button>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur text-black flex items-center justify-center shadow-md cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 backdrop-blur text-black flex items-center justify-center shadow-md cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => openViewer(currentImageIndex)}
                className="absolute right-3 bottom-3 px-3 py-1.5 rounded-full bg-black/80 text-white text-xs font-semibold cursor-pointer"
              >
                Tap to Zoom
              </button>
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                {images.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-black scale-105'
                        : 'border-black/10 opacity-80 hover:opacity-100'
                    } cursor-pointer`}
                    aria-label={`Show image ${index + 1}`}
                  >
                    <img
                      {...getResponsiveImageProps({
                        src: img,
                        alt: `${title} thumbnail ${index + 1}`,
                        widths: [80, 120, 160],
                        sizes: '48px',
                        fallbackWidth: 120,
                        quality: 72,
                      })}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 sm:px-6 md:px-0 pb-6 sm:pb-7 pt-1 md:pt-0 flex flex-col gap-5 md:gap-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-black leading-tight">{title}</h2>
            <span className="text-lg sm:text-xl md:text-3xl font-black text-black whitespace-nowrap">{displayPrice}</span>
          </div>

          <p className="text-sm md:text-[15px] text-black/70 leading-relaxed md:max-w-[420px]">
            {description}
          </p>

          <div className="flex flex-col gap-3">
            <span className="text-[0.72rem] tracking-[0.14em] uppercase font-bold text-black/45">Color</span>
            <div className="flex flex-wrap gap-2.5 md:pl-2">
              {colors.map((color, index) => (
                <button
                  key={`${color}-${index}`}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-black scale-110'
                      : 'border-transparent hover:border-black/20'
                  } cursor-pointer`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.72rem] tracking-[0.14em] uppercase font-bold text-black/45">Size</span>
              <Link
                to="/sizing-guide"
                state={sizingGuideState}
                className="text-xs font-semibold text-black/60 hover:text-black underline underline-offset-2 transition-colors"
              >
                Not sure about fit? View Sizing Guide
              </Link>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[44px] h-10 px-3 rounded-full text-sm font-bold transition-colors ${
                    selectedSize === size
                      ? 'bg-black text-white'
                      : 'bg-black/10 text-black hover:bg-black/20'
                  } cursor-pointer`}
                  aria-label={`Select size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3 items-center md:pt-1">
            <div className="h-11 rounded-full bg-black text-white flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full hover:bg-white/20 cursor-pointer"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="w-9 text-center font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full hover:bg-white/20 cursor-pointer"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="h-11 px-5 rounded-full bg-black text-white font-bold hover:bg-black/85 transition-colors cursor-pointer"
            >
              Add To Cart
            </button>
          </div>

          <button
            type="button"
            onClick={handleBuyNow}
            className="h-11 rounded-full border border-black/20 text-black font-bold hover:bg-black/5 transition-colors cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>

      {isViewerOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={closeViewer}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-2xl leading-none cursor-pointer"
            aria-label="Close image viewer"
          >
            ×
          </button>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-10 h-10 rounded-full bg-white/15 text-white text-xl cursor-pointer"
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-10 h-10 rounded-full bg-white/15 text-white text-xl cursor-pointer"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetViewerTransform}
              className="px-3 h-10 rounded-full bg-white/15 text-white text-sm font-semibold cursor-pointer"
            >
              Reset
            </button>
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div
            className="w-full max-w-5xl max-h-[85vh] overflow-hidden flex items-center justify-center"
            onWheel={handleViewerWheel}
            onPointerMove={handleViewerPointerMove}
            onPointerUp={stopPanning}
            onPointerLeave={stopPanning}
          >
            <img
              {...getResponsiveImageProps({
                src: images[currentImageIndex],
                alt: `${title} enlarged ${currentImageIndex + 1}`,
                widths: [720, 960, 1280, 1600, 1920],
                sizes: '100vw',
                fallbackWidth: 1600,
                quality: 82,
                loading: 'eager',
                fetchPriority: 'high',
              })}
              className="max-w-full max-h-[85vh] object-contain select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
                touchAction: 'none',
                transition: isPanning ? 'none' : 'transform 120ms ease-out',
              }}
              onPointerDown={handleViewerPointerDown}
              onDoubleClick={handleViewerDoubleClick}
              draggable={false}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductDetails;
