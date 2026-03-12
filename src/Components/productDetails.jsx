import React, { useState, useMemo } from 'react';
import useCart from './useCart.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const { addItem } = useCart();
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
  const displayPrice = isNepal ? `Rs. ${priceNPR}` : `₹${priceINR}`;
  
  const images = [frontImage, backImage].filter(Boolean);
  
  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const handleAddToCart = () => {
    const id = slug || title.toLowerCase().replace(/\s+/g, '-');
    addItem({ id, title, priceINR, priceNPR, quantity });
  };
  
  const handleBuyNow = () => {
    handleAddToCart();
    // Add buy now logic here
  };

  return (
    <>
      {/* Desktop Layout - Hidden on Mobile */}
      <div className="hidden md:block w-full max-w-[440px] bg-[#D9D9D9] rounded-[35px] overflow-hidden flex flex-col font-sans relative shadow-xl mx-auto">
        {/* Top Section: Content */}
        <div className="p-9 pt-10 pb-12 relative z-20 flex flex-col gap-5">
          <div className="flex justify-between items-baseline">
            <h2 className="text-lg font-bold text-black tracking-tight">{title}</h2>
            <span className="text-lg font-bold text-black">{displayPrice}</span>
          </div>
          
          <p className="text-[12px] text-black/90 leading-relaxed font-medium">
            {description}
          </p>

          <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-bold text-black">Color:</span>
                  <div className="flex gap-3">
                      {colors.map((color, index) => (
                      <div 
                          key={index} 
                          className="w-8 h-8 rounded-full cursor-pointer shadow-md border-2 border-transparent hover:border-black/10 transition-all"
                          style={{ backgroundColor: color }}
                      />
                      ))}
                  </div>
              </div>
          </div>

          <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-black">Size:</span>
                  <div className="flex gap-3">
                      {sizes.map((size) => (
                      <div 
                          key={size} 
                          className="w-8 h-8 rounded-full bg-[#808080] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-[#707070] transition-colors"
                      >
                          {size}
                      </div>
                      ))}
                  </div>
              </div>
          </div>
        </div>

        {/* Bottom Section: Cutout Action Bar */}
        <div className="relative flex items-end">
          <div className="bg-[#323232] w-[66%] h-20 rounded-tr-[40px] flex items-center px-7 relative shadow-[10px_0_20px_rgba(0,0,0,0.12)] z-10 before:content-[''] before:absolute before:left-[36px] before:-top-10 before:w-10 before:h-10 before:bg-[#D9D9D9] before:rounded-bl-[40px] after:content-[''] after:absolute after:-right-10 after:top-0 after:w-10 after:h-10 after:bg-[#D9D9D9] after:rounded-bl-[40px]">
              <div className="flex items-center justify-between text-white z-20 w-full">
                  <div className="flex items-center gap-5">
                      <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center text-xl font-bold hover:text-gray-400 transition-colors cursor-pointer"
                      >
                          -
                      </button>
                      <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                      <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-xl font-bold hover:text-gray-400 transition-colors cursor-pointer"
                      >
                          +
                      </button>
                  </div>
                  <button onClick={handleAddToCart} className="font-bold text-base whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer">
                      Add To Cart
                  </button>
              </div>
          </div>

          <div className="flex-grow h-20 bg-transparent relative flex items-center justify-center">
              <button 
                  className="text-[#323232] px-12 py-4 rounded-[20px] font-bold text-base hover:opacity-80 transition-opacity z-20 leading-none cursor-pointer"
              >
                  Buy Now
              </button>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Only visible on screens ≤ 768px */}
      <div className="md:hidden w-full max-w-[440px] bg-white rounded-[20px] overflow-hidden flex flex-col font-sans relative shadow-lg mx-auto">
        {/* Product Name and Price on same line with pipe separator */}
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-center justify-center gap-2 text-center">
            <h2 className="text-lg font-bold text-black">{title}</h2>
            <span className="text-black/50">|</span>
            <span className="text-lg font-bold text-black">{displayPrice}</span>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pb-4">
          <p className="text-sm text-black/80 leading-relaxed text-center">
            {description}
          </p>
        </div>

        {/* Interactive Image Gallery with Navigation */}
        {images.length > 0 && (
          <div className="px-4 pb-4">
            <div className="relative w-full h-64 bg-gray-100 rounded-[15px] overflow-hidden">
              <img 
                src={images[currentImageIndex]} 
                alt={`${title} - Image ${currentImageIndex + 1}`} 
                className="w-full h-full object-cover"
              />
              
              {/* Left Arrow */}
              {images.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg touch-manipulation"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} className="text-black" />
                </button>
              )}
              
              {/* Right Arrow */}
              {images.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg touch-manipulation"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} className="text-black" />
                </button>
              )}
              
              {/* Image Indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-black' : 'bg-black/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Color Selection Options */}
        <div className="px-4 pb-4">
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-bold text-black">Color:</span>
            <div className="flex gap-3">
              {colors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-full cursor-pointer shadow-md border-2 transition-all ${
                    selectedColor === color ? 'border-black scale-110' : 'border-transparent hover:border-black/10'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Size Selection Options */}
        <div className="px-4 pb-4">
          <div className="flex flex-col items-center gap-3">
            <span className="text-sm font-bold text-black">Size:</span>
            <div className="flex gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all ${
                    selectedSize === size 
                      ? 'bg-black text-white scale-110' 
                      : 'bg-gray-300 text-black hover:bg-gray-400'
                  }`}
                  aria-label={`Select size ${size}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quantity Selector and Action Buttons */}
        <div className="px-4 pb-6">
          <div className="flex flex-col gap-4">
            {/* Quantity Selector with Add to Cart */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-2 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-lg font-bold text-black hover:bg-gray-200 rounded-full transition-colors touch-manipulation"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="text-lg font-bold text-black w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 min-w-[44px] min-h-[44px] flex items-center justify-center text-lg font-bold text-black hover:bg-gray-200 rounded-full transition-colors touch-manipulation"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              
              <button
                onClick={handleAddToCart}
                className="px-6 py-3 min-h-[44px] bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors touch-manipulation"
              >
                Add to Cart
              </button>
            </div>
            
            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              className="w-full py-3 min-h-[44px] bg-gray-200 text-black font-bold rounded-full hover:bg-gray-300 transition-colors touch-manipulation"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
