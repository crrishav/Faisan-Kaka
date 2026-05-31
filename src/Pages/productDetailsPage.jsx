import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductDetails from '../Components/productDetails.jsx';
import Footer from '../Components/footer.jsx';
import SmoothScroll from '../Components/smoothScroll.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../lib/sanityClient.js';
import { getResponsiveImageProps } from '../lib/responsiveImage.js';
import { normalizeMoneyValue } from '../lib/money.js';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDesktopViewerOpen, setIsDesktopViewerOpen] = useState(false);
  const [desktopViewerIndex, setDesktopViewerIndex] = useState(0);
  const [desktopZoomLevel, setDesktopZoomLevel] = useState(1);
  const [desktopPan, setDesktopPan] = useState({ x: 0, y: 0 });
  const [isDesktopPanning, setIsDesktopPanning] = useState(false);
  const [desktopPanStart, setDesktopPanStart] = useState({ x: 0, y: 0 });

  const normalizedSlug = useMemo(() => {
    try {
      return decodeURIComponent(String(slug || '')).trim();
    } catch {
      return String(slug || '').trim();
    }
  }, [slug]);

  // Fetch product from Sanity
  useEffect(() => {
    let alive = true;
    let timeoutId;

    const fetchProduct = async () => {
      if (!normalizedSlug) {
        setError('Invalid product link');
        setLoading(false);
        setProduct(null);
        return;
      }

      timeoutId = setTimeout(() => {
        if (!alive) return;
        setError('Product is taking too long to load');
        setLoading(false);
      }, 10000);

      try {
        setLoading(true);
        setError(null);
        setProduct(null);
        const data = await getProductBySlug(normalizedSlug);
        if (!alive) return;
        if (data) {
          setProduct(data);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        if (!alive) return;
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        clearTimeout(timeoutId);
        if (alive) {
          setLoading(false);
        }
      }
    };

    if (normalizedSlug) {
      fetchProduct();
    } else {
      setLoading(false);
      setError('Invalid product link');
      setProduct(null);
    }

    return () => {
      alive = false;
      clearTimeout(timeoutId);
    };
  }, [normalizedSlug]);

  // Scroll to top on mount
  useEffect(() => {
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [slug]);

  // Transform Sanity data for ProductDetails component
  const productData = useMemo(() => {
    if (!product) return null;

    const toArray = (value) => {
      if (Array.isArray(value)) return value;
      if (value == null) return [];
      return [value];
    };

    const toText = (value, fallback = '') => {
      if (typeof value === 'string') return value.trim() || fallback;
      if (value == null) return fallback;
      if (Array.isArray(value)) {
        const text = value
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              if (typeof item.text === 'string') return item.text;
              if (Array.isArray(item.children)) {
                return item.children
                  .map((child) => (typeof child?.text === 'string' ? child.text : ''))
                  .join(' ')
                  .trim();
              }
            }
            return '';
          })
          .filter(Boolean)
          .join(' ')
          .trim();
        return text || fallback;
      }
      if (typeof value === 'object') {
        if (typeof value.text === 'string') return value.text.trim() || fallback;
        if (typeof value.current === 'string') return value.current.trim() || fallback;
      }
      return String(value).trim() || fallback;
    };

    const imageItems = toArray(product.images);
    const colorItems = toArray(product.colors);
    const sizeItems = toArray(product.sizes);

    const mainImageUrl = product.mainImage?.asset?.url;
    const additionalImages = imageItems
      .map((img) => {
        if (typeof img === 'string') return img;
        return img?.asset?.url;
      })
      .filter(Boolean);
    
    // Use main image as front, first additional image as back (or same if no additional)
    const frontImage = mainImageUrl;
    const backImage = additionalImages[0] || mainImageUrl;

    // Default description if not provided
    const normalizedTitle = toText(product.title, 'Product');
    const defaultDescription = `${normalizedTitle} is crafted with premium materials and designed for everyday comfort, durability, and clean style.`;
    const normalizedDescription = toText(product.description, defaultDescription);

    // colors removed — kept for backwards compatibility in Sanity but not used in UI
    const normalizedColors = [];

    const normalizedSizes = sizeItems
      .map((size) => (typeof size === 'string' ? size : String(size || '')))
      .filter(Boolean);

    return {
      title: normalizedTitle,
      priceINR: normalizeMoneyValue(product.priceINR, product.priceINR?.toString()),
      priceNPR: normalizeMoneyValue(product.priceNPR, product.priceNPR?.toString()),
      stock: typeof product.stock === 'number' ? product.stock : null,
      description: normalizedDescription,
      // colors removed from productData
      sizes: normalizedSizes.length > 0 ? normalizedSizes : ["M", "L", "S"],
      slug: product.slug?.current || slug,
      frontImage,
      backImage,
      images: [frontImage, backImage, ...additionalImages.slice(1)].filter(Boolean),
      category: product.category,
      inStock: product.inStock !== false && (typeof product.stock !== 'number' || product.stock > 0),
    };
  }, [product, slug]);

  const clampDesktopZoom = (value) => Math.min(4, Math.max(1, value));

  const resetDesktopViewerTransform = () => {
    setDesktopZoomLevel(1);
    setDesktopPan({ x: 0, y: 0 });
  };

  const openDesktopViewer = (index) => {
    if (index < 0) return;
    setDesktopViewerIndex(index);
    resetDesktopViewerTransform();
    setIsDesktopViewerOpen(true);
  };

  const closeDesktopViewer = useCallback(() => {
    setIsDesktopViewerOpen(false);
    setIsDesktopPanning(false);
    resetDesktopViewerTransform();
  }, []);

  const handleDesktopPrevImage = () => {
    setDesktopViewerIndex((prev) => (prev - 1 + desktopImages.length) % desktopImages.length);
    resetDesktopViewerTransform();
  };

  const handleDesktopNextImage = () => {
    setDesktopViewerIndex((prev) => (prev + 1) % desktopImages.length);
    resetDesktopViewerTransform();
  };

  const handleDesktopZoomIn = () => {
    setDesktopZoomLevel((prev) => clampDesktopZoom(prev + 0.25));
  };

  const handleDesktopZoomOut = () => {
    setDesktopZoomLevel((prev) => {
      const next = clampDesktopZoom(prev - 0.25);
      if (next === 1) {
        setDesktopPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleDesktopViewerWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setDesktopZoomLevel((prev) => {
      const next = clampDesktopZoom(prev + delta);
      if (next === 1) {
        setDesktopPan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleDesktopPointerDown = (e) => {
    if (desktopZoomLevel <= 1) return;
    setIsDesktopPanning(true);
    setDesktopPanStart({ x: e.clientX - desktopPan.x, y: e.clientY - desktopPan.y });
  };

  const handleDesktopPointerMove = (e) => {
    if (!isDesktopPanning || desktopZoomLevel <= 1) return;
    setDesktopPan({
      x: e.clientX - desktopPanStart.x,
      y: e.clientY - desktopPanStart.y,
    });
  };

  const stopDesktopPanning = () => {
    setIsDesktopPanning(false);
  };

  const handleDesktopDoubleClick = () => {
    if (desktopZoomLevel > 1) {
      resetDesktopViewerTransform();
      return;
    }
    setDesktopZoomLevel(2);
  };

  useEffect(() => {
    if (!isDesktopViewerOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        closeDesktopViewer();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isDesktopViewerOpen, closeDesktopViewer]);

  // Prepare display data
  const displayError = error || (!productData && !loading);
  const displayLoading = loading || !productData;
  const backImg = productData?.images?.[1] || productData?.images?.[0];
  const frontImg = productData?.images?.[0];
  const desktopImages = productData ? [...new Set([backImg, frontImg, ...productData.images].filter(Boolean))] : [];

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[#f5f5f5] overflow-x-hidden">
        
        {/* Error State */}
        {displayError && (
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 flex items-center justify-center pt-20 px-4">
              <div className="text-center max-w-md">
                <p className="text-red-500 font-medium mb-4">{error || 'Product not found'}</p>
                <button 
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-black text-white rounded-full font-bold hover:opacity-80 transition-opacity"
                >
                  Back to Shop
                </button>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* Loading State */}
        {!displayError && displayLoading && (
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 flex items-center justify-center pt-20 px-4">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <p className="text-black/60 text-sm font-medium">Loading product...</p>
              </div>
            </div>
            <Footer />
          </div>
        )}

        {/* Main Content */}
        {!displayError && !displayLoading && productData && (
          <>
            <div className="flex-1 px-4 sm:px-8 pt-24 md:pt-28 overflow-x-hidden flex items-center justify-center">
              <div className="max-w-7xl mx-auto flex flex-col items-center justify-center md:flex-row md:items-start gap-8 md:h-screen pt-4 md:pt-12">
                {/* Desktop Images - Side by Side */}
                <div className="hidden md:grid w-full md:w-[600px] grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#1f3c34]">
                    <button
                      type="button"
                      className="block w-full h-full cursor-zoom-in"
                      onClick={() => openDesktopViewer(desktopImages.indexOf(backImg))}
                      aria-label="Open product image"
                    >
                      <img
                        {...getResponsiveImageProps({
                          src: backImg,
                          alt: productData.title,
                          widths: [360, 540, 720, 840, 1080],
                          sizes: '(max-width: 768px) 100vw, 300px',
                          fallbackWidth: 840,
                          quality: 80,
                          loading: 'eager',
                          fetchPriority: 'high',
                        })}
                        className="w-full h-64 md:h-[420px] object-cover"
                      />
                    </button>
                  </div>
                  <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#27443b]">
                    <button
                      type="button"
                      className="block w-full h-full cursor-zoom-in"
                      onClick={() => openDesktopViewer(desktopImages.indexOf(frontImg))}
                      aria-label="Open product image"
                    >
                      <img
                        {...getResponsiveImageProps({
                          src: frontImg,
                          alt: productData.title,
                          widths: [360, 540, 720, 840, 1080],
                          sizes: '(max-width: 768px) 100vw, 300px',
                          fallbackWidth: 840,
                          quality: 80,
                          loading: 'eager',
                          fetchPriority: 'high',
                        })}
                        className="w-full h-64 md:h-[420px] object-cover"
                      />
                    </button>
                  </div>
            </div>

            {/* Product Details - Desktop & Mobile */}
            <div className="w-full md:w-[440px] flex-shrink-0">
              <ProductDetails 
                title={productData.title}
                priceINR={productData.priceINR}
                priceNPR={productData.priceNPR}
                description={productData.description}
                sizes={productData.sizes}
                slug={productData.slug}
                frontImage={frontImg}
                backImage={backImg}
                inStock={productData.inStock}
              />
              
              {/* Stock Status - Removed from here as it's now inside ProductDetails next to colors */}
            </div>
          </div>
            </div>
          </>
        )}

        {isDesktopViewerOpen && desktopImages.length > 0 && (
          <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button
              type="button"
              onClick={closeDesktopViewer}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-2xl leading-none"
              aria-label="Close image viewer"
            >
              ×
            </button>

            <div className="absolute top-4 left-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDesktopZoomOut}
                className="w-10 h-10 rounded-full bg-white/15 text-white text-xl"
                aria-label="Zoom out"
              >
                -
              </button>
              <button
                type="button"
                onClick={handleDesktopZoomIn}
                className="w-10 h-10 rounded-full bg-white/15 text-white text-xl"
                aria-label="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={resetDesktopViewerTransform}
                className="px-3 h-10 rounded-full bg-white/15 text-white text-sm font-semibold"
              >
                Reset
              </button>
            </div>

            {desktopImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handleDesktopPrevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={handleDesktopNextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            <div
              className="w-full max-w-5xl max-h-[85vh] overflow-hidden flex items-center justify-center"
              onWheel={handleDesktopViewerWheel}
              onPointerMove={handleDesktopPointerMove}
              onPointerUp={stopDesktopPanning}
              onPointerLeave={stopDesktopPanning}
            >
              <img
                {...getResponsiveImageProps({
                  src: desktopImages[desktopViewerIndex],
                  alt: `${productData.title} enlarged ${desktopViewerIndex + 1}`,
                  widths: [720, 960, 1280, 1600, 1920, 2400],
                  sizes: '100vw',
                  fallbackWidth: 1920,
                  quality: 84,
                  loading: 'eager',
                  fetchPriority: 'high',
                })}
                className="max-w-full max-h-[85vh] object-contain select-none"
                style={{
                  transform: `translate(${desktopPan.x}px, ${desktopPan.y}px) scale(${desktopZoomLevel})`,
                  transformOrigin: 'center center',
                  cursor: desktopZoomLevel > 1 ? (isDesktopPanning ? 'grabbing' : 'grab') : 'zoom-in',
                  touchAction: 'none',
                  transition: isDesktopPanning ? 'none' : 'transform 120ms ease-out',
                }}
                onPointerDown={handleDesktopPointerDown}
                onDoubleClick={handleDesktopDoubleClick}
                draggable={false}
              />
            </div>
          </div>
        )}
        
        <Footer />
      </div>
    </SmoothScroll>
  );
};

export default ProductDetailsPage;
