import React, { useState } from 'react';

const ProductDetails = ({ 
  title = "T-Shirt (White)", 
  price = "9.99", 
  description = "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have", 
  colors = ["#3D5443", "#4D3434", "#4A4A4A"], 
  sizes = ["M", "L", "S"] 
}) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="w-full max-w-[440px] bg-[#D9D9D9] rounded-[35px] overflow-hidden flex flex-col font-sans relative shadow-xl mx-auto">
      {/* Top Section: Content */}
      <div className="p-9 pt-10 pb-12 relative z-20 flex flex-col gap-5">
        <div className="flex justify-between items-baseline">
          <h2 className="text-lg font-bold text-black tracking-tight">{title}</h2>
          <span className="text-lg font-bold text-black">${price}</span>
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
                        className="text-2xl font-bold hover:text-gray-400 transition-colors cursor-pointer"
                    >
                        -
                    </button>
                    <span className="text-lg font-bold w-6 text-center">{quantity}</span>
                    <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="text-2xl font-bold hover:text-gray-400 transition-colors cursor-pointer"
                    >
                        +
                    </button>
                </div>
                <button className="font-bold text-base whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer">
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
  );
};

export default ProductDetails;
