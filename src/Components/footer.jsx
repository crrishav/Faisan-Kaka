import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const performScroll = (top) => {
    if (isMobileDevice()) {
      window.scrollTo({ top, behavior: 'auto' });
    } else if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(top);
    } else {
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleShopItemClick = (category) => {
    const scrollToPosition = () => {
      // Find the section based on category
      const titleMap = {
        'T-Shirts': 'T-Shirts',
        'Hoodies': 'Hoodies',
        'Pants': 'Pants'
      };
      
      // Find ProductSection with matching title
      const sections = document.querySelectorAll('[data-product-section]');
      for (const section of sections) {
        if (section.textContent.includes(titleMap[category])) {
          const rect = section.getBoundingClientRect();
          const top = window.scrollY + rect.top - 100; // Offset for navbar
          performScroll(top);
          break;
        }
      }
    };

    if (location.pathname === '/') {
      scrollToPosition();
    } else {
      navigate('/');
      setTimeout(scrollToPosition, 300);
    }
  };

  const handleContactClick = () => {
    // Dispatch custom event to expand About dropdown in navbar
    const event = new CustomEvent('expand-navbar-about');
    window.dispatchEvent(event);
    
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <footer className="bg-[#191818] text-[#f5f5f5] mt-12">
      <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <img src={logo} alt="Logo" className="h-4 md:h-8" />
          <p className="mt-2 text-sm text-[#d4d4d4] max-w-sm">
            Timeless essentials crafted with care. Premium fabrics, clean cuts, and everyday comfort.
          </p>
        </div>

        <div className="flex flex-wrap gap-10 text-sm">
          <div>
            <h3 className="font-bold text-[#e5e5e5]">Shop</h3>
            <ul className="mt-2 space-y-1 text-[#d4d4d4]">
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={() => handleShopItemClick('T-Shirts')}>T-Shirts</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={() => handleShopItemClick('Hoodies')}>Hoodies</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={() => handleShopItemClick('Pants')}>Pants</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#e5e5e5]">Support</h3>
            <ul className="mt-2 space-y-1 text-[#d4d4d4]">
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handleContactClick}>Contact</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer">Shipping</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer">Returns</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#323030]">
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
