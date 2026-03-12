import React from 'react';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-[#191818] text-[#f5f5f5] mt-12">
      <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <img src={logo} alt="Logo" className="h-6 md:h-8" />
          <p className="mt-2 text-sm text-[#d4d4d4] max-w-sm">
            Timeless essentials crafted with care. Premium fabrics, clean cuts, and everyday comfort.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm">
          <div>
            <h3 className="font-medium text-[#e5e5e5]">Shop</h3>
            <ul className="mt-2 space-y-1 text-[#d4d4d4]">
              <li><button className="hover:text-white transition-colors">New Arrivals</button></li>
              <li><button className="hover:text-white transition-colors">Best Sellers</button></li>
              <li><button className="hover:text-white transition-colors">T-Shirts</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-[#e5e5e5]">Support</h3>
            <ul className="mt-2 space-y-1 text-[#d4d4d4]">
              <li><button className="hover:text-white transition-colors">Contact</button></li>
              <li><button className="hover:text-white transition-colors">Shipping</button></li>
              <li><button className="hover:text-white transition-colors">Returns</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#2c4b41]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[#bfbfbf]">
          <p>© {new Date().getFullYear()} Faisan Kaka. All rights reserved.</p>
          <p className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
