import React from 'react';
import ProductDetails from '../Components/productDetails.jsx';
import NavBar from '../Components/navBar.jsx';

const ProductDetailsPage = () => {
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-[#f5f5f5] px-8 pt-28">
        <div className="max-w-7xl mx-auto flex items-start justify-center gap-8">
          <div className="w-[600px] grid grid-cols-2 gap-8">
            <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#1f3c34]">
              <img
                src="https://images.unsplash.com/photo-1593032452516-39aeabbbbcb3?q=80&w=800&auto=format&fit=crop"
                alt="Model wearing white t-shirt"
                className="w-full h-[420px] object-cover"
              />
            </div>
            <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#27443b]">
              <img
                src="https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=800&auto=format&fit=crop"
                alt="White t-shirt flat lay"
                className="w-full h-[420px] object-cover"
              />
            </div>
          </div>
          <div className="flex-shrink-0 w-[440px]">
            <ProductDetails />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailsPage;
