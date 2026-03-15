import React from 'react';
import NavBar from './Components/navBar.jsx';
import ProductSection from './Components/productSection.jsx';
import Footer from './Components/footer.jsx';
import DeliverySection from './Components/DeliverySection.jsx';
import PrintSection from './Components/PrintSection.jsx';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden max-w-[100vw]">
      <NavBar />
      
      {/* Hero Section (Empty for now) */}
      <div className="w-full h-screen flex items-center justify-center bg-white max-w-[100vw] overflow-x-hidden">
        {/* Placeholder for Hero content */}
        <h1 className="text-2xl text-gray-400 font-light tracking-widest uppercase">Video Here</h1>
      </div>

      {/* Product Sections */}
      <div className="w-full bg-white relative flex flex-col gap-16 pb-24 max-w-[100vw] overflow-x-hidden">
        <ProductSection title="T-Shirts" />
        <ProductSection title="Hoodies" />
        <ProductSection title="Pants" />
      </div>

      {/* Delivery Section */}
      <DeliverySection />

      {/* Print Section */}
      <PrintSection />

      <Footer />
    </div>
  );
};

export default HomePage;
