import React from 'react';

const ArrowButton = ({ onClick, direction = 'right' }) => {
  return (
    <button 
      onClick={onClick}
      className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shadow-lg z-10"
      style={{ backgroundColor: '#797474' }}
      aria-label={`Scroll ${direction}`}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="white" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        {direction === 'left' ? (
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
};

export default ArrowButton;
