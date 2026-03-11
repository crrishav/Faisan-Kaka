import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ title, price, backImage, frontImage, slug }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  return (
    <div 
      className="w-[280px] rounded-[32px] bg-[#D9D9D9] p-4 flex flex-col items-center text-center shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => slug && navigate(`/product/${slug}`)}
    >
      <div className="w-full aspect-[3/4] mb-3 overflow-hidden rounded-[24px]">
        <img 
          src={hovered && frontImage ? frontImage : backImage || frontImage} 
          alt={title} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-lg text-black leading-tight">{title}</h3>
        <p className="text-gray-700 font-semibold">{price}</p>
      </div>
    </div>
  );
};

export default ProductCard;
