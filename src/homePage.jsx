import React from 'react';
import NavBar from './Components/navBar.jsx';
import ProductSection from './Components/productSection.jsx';
import ProductDetails from './Components/productDetails.jsx';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <NavBar />
      
      {/* Hero Section (Empty for now) */}
      <div className="w-full h-screen flex items-center justify-center bg-white">
        {/* Placeholder for Hero content */}
        <h1 className="text-2xl text-gray-400 font-light tracking-widest uppercase">Video Here</h1>
      </div>

      {/* Product Sections */}
      <div className="w-full bg-white relative flex flex-col gap-16 pb-24">
        <ProductSection title="T-Shirts" />
        <ProductSection title="Hoodies" />
        <ProductSection title="Pants" />
      </div>
    </div>
  );
};

export default HomePage;
