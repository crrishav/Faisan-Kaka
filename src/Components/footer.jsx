import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Footer = () => {
  const PENDING_CATEGORY_KEY = 'fk_pending_category_scroll';
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
      const sections = document.querySelectorAll('[data-product-section]');
      for (const section of sections) {
        const titleElement = section.querySelector('h2');
        if (titleElement && titleElement.textContent.trim() === category) {
          const rect = section.getBoundingClientRect();
          const top = window.scrollY + rect.top - 100;
          performScroll(top);
          return;
        }
      }
    };

    if (location.pathname === '/') {
      scrollToPosition();
    } else {
      try {
        window.sessionStorage.setItem(PENDING_CATEGORY_KEY, category);
      } catch {
        // Ignore storage failures; navigation still proceeds.
      }
      navigate('/');
    }
  };

  const handleContactClick = () => {
    // Dispatch custom event to expand About dropdown in navbar
    const event = new CustomEvent('expand-navbar-about');
    window.dispatchEvent(event);
  };

  const handleHomeClick = () => {
    if (location.pathname === '/') {
      performScroll(0);
      return;
    }
    navigate('/');
  };

  const handleCollectionsClick = () => {
    navigate('/collections');
  };

  const handlePrintStudioClick = () => {
    navigate('/print');
  };

  const handleReturnsClick = () => {
    navigate('/returns');
  };

  const handleTermsClick = () => {
    navigate('/terms-of-service');
  };

  const handleShippingReturnsClick = () => {
    navigate('/shipping-returns');
  };

  const handleSizingGuideClick = () => {
    navigate('/sizing-guide');
  };

  return (
    <footer className="bg-[#191818] text-[#f5f5f5] mt-12">
      <div className="max-w-7xl mx-auto px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <img src={logo} alt="Logo" className="hidden md:block md:h-16" />
          <div className="mt-4 flex items-center gap-6">
            <a href="https://www.instagram.com/saurabhmaurya.___/" target="_blank" rel="noreferrer" className="flex items-center gap-3 cursor-pointer group">
              <img 
                src={new URL('../assets/pfp/saurabh.jpg', import.meta.url).href} 
                alt="Saurabh" 
                className="w-12 h-12 rounded-full border border-[#d4d4d4] group-hover:border-white transition-colors" 
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#e5e5e5]">Saurabh</span>
                <span className="text-xs text-[#a3a3a3]">Founder</span>
              </div>
            </a>
            <a href="https://www.instagram.com/crrishav/" target="_blank" rel="noreferrer" className="flex items-center gap-3 cursor-pointer group">
              <img 
                src={new URL('../assets/pfp/rishav.jpg', import.meta.url).href} 
                alt="Rishav" 
                className="w-12 h-12 rounded-full border border-[#d4d4d4] group-hover:border-white transition-colors" 
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#e5e5e5]">Rishav</span>
                <span className="text-xs text-[#a3a3a3]">Co-Founder</span>
              </div>
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-10 text-sm">
          <div>
            <h3 className="font-bold text-[#e5e5e5]">Site Map</h3>
            <ul className="mt-2 space-y-1 text-[#d4d4d4]">
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handleHomeClick}>Home</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handleCollectionsClick}>Collections</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handlePrintStudioClick}>Print Studio</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={() => navigate('/track-order')}>Track Your Order</button></li>
              <li><button type="button" aria-label="Request a return" className="hover:text-white transition-colors cursor-pointer" onClick={handleReturnsClick}>Returns</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-[#e5e5e5]">Collections</h3>
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
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handleSizingGuideClick}>Sizing Guide</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handleTermsClick}>Terms Of Service</button></li>
              <li><button className="hover:text-white transition-colors cursor-pointer" onClick={handleShippingReturnsClick}>Shipping & Returns</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#323030]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[#bfbfbf]">
          <p>© {new Date().getFullYear()} Faisan Kaka. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
