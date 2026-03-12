import React, { useEffect, useMemo, useRef, useState } from 'react';
import logo from '../assets/logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import useCart from './useCart.jsx';
import useProducts from './useProducts.jsx';

const NavBar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  // Mobile accordion submenu: 'collection' | 'about' | 'search' | null
  const [mobileSubmenu, setMobileSubmenu] = useState(null);
  // Separate search state for mobile inline search
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [mobileSearchResults, setMobileSearchResults] = useState([]);
  const mobileSearchInputRef = useRef(null);

  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const navRef = useRef(null); // for outside-tap detection
  const [minHeight, setMinHeight] = useState(0);
  const closeTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { items, currency, total, updateQuantity, removeItem } = useCart();
  const allProducts = useProducts();

  // Desktop search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchInputRef = useRef(null);

  const imageMap = useMemo(() => {
    const files = import.meta.glob('/src/assets/Collection/**/*.{png,jpg,jpeg,webp}', { eager: true, query: '?url', import: 'default' });
    const map = {};
    for (const [path, url] of Object.entries(files)) {
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      const cleaned = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/^\d+\.\s*/, '');
      
      // Enhanced regex to handle both formats: "Name (variant) (price1, price2)" and "Name (price1, price2)"
      const rx = /^(.*?)(?:\s*\((front|back|Front|Back)\))?\s*\(([^,]+)\s*,\s*([^)]+)\)\s*$/i;
      const m = cleaned.match(rx);
      
      let name, variant;
      
      if (m) {
        name = m[1].trim();
        variant = (m[2] || '').toLowerCase();
      } else {
        // Fallback for files without price info
        name = cleaned.replace(/\s*\(.*\)\s*$/, '').trim();
        variant = '';
      }
      
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      if (!map[slug]) map[slug] = {};
      if (variant === 'front') map[slug].front = url;
      else if (variant === 'back') map[slug].back = url;
      else map[slug].back = map[slug].back || url;
    }
    return map;
  }, []);

  const openMenu = (name) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(name);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
    setIsMobileCartOpen(false);
    setMobileSubmenu(null);
  };

  const toggleMobileCart = () => {
    setIsMobileCartOpen(prev => !prev);
    setIsMobileMenuOpen(false);
    setMobileSubmenu(null);
  };

  const closeMobileMenus = () => {
    setIsMobileMenuOpen(false);
    setIsMobileCartOpen(false);
    setMobileSubmenu(null);
    setMobileSearchQuery('');
    setMobileSearchResults([]);
  };

  const toggleMobileSubmenu = (name) => {
    setMobileSubmenu(prev => prev === name ? null : name);
    // Auto-focus search input when search submenu opens
    if (name === 'search') {
      setTimeout(() => { if (mobileSearchInputRef.current) mobileSearchInputRef.current.focus(); }, 50);
    }
  };

  const handleMobileSearchChange = (e) => {
    const q = e.target.value;
    setMobileSearchQuery(q);
    if (q.trim().length > 0) {
      setMobileSearchResults(allProducts.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5));
    } else {
      setMobileSearchResults([]);
    }
  };

  const handleMobileResultClick = (product) => {
    closeMobileMenus();
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => scrollToProduct(product), 500);
    } else {
      scrollToProduct(product);
    }
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
        setActiveMenu(null);
        // Do not close search automatically on mouse leave, only menu
    }, 80);
  };

  useEffect(() => {
    const updateHeight = () => {
      // Only measure/set height on desktop — on mobile the desktop header is display:none
      // so offsetHeight returns 0, causing the container to collapse.
      if (window.innerWidth >= 768 && headerRef.current) {
        setMinHeight(headerRef.current.offsetHeight);
      } else {
        // On mobile, clear any JS-set height so CSS controls layout naturally
        setMinHeight(0);
        if (containerRef.current) containerRef.current.style.height = '';
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Scroll-triggered collapse: close all mobile panels when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        setIsMobileMenuOpen(false);
        setIsMobileCartOpen(false);
        setMobileSubmenu(null);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Outside-tap collapse: close all mobile panels when tapping outside the nav
  useEffect(() => {
    const handleOutsideTap = (e) => {
      if (window.innerWidth < 768 && navRef.current && !navRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false);
        setIsMobileCartOpen(false);
        setMobileSubmenu(null);
      }
    };
    // touchstart for iOS/Android instant feedback; mousedown as fallback for desktop
    document.addEventListener('touchstart', handleOutsideTap, { passive: true });
    document.addEventListener('mousedown', handleOutsideTap);
    return () => {
      document.removeEventListener('touchstart', handleOutsideTap);
      document.removeEventListener('mousedown', handleOutsideTap);
    };
  }, []);

  useEffect(() => {
    // On mobile (< 768px) the desktop header is display:none — skip JS height control
    // entirely so the container uses its natural CSS height (auto).
    if (!containerRef.current || !headerRef.current) return;
    if (window.innerWidth < 768) {
      containerRef.current.style.height = '';
      return;
    }
    const base = headerRef.current.offsetHeight;
    const target = activeMenu && contentRef.current ? contentRef.current.offsetHeight : 0;
    // Add extra height for search results if search is active and has results
    const searchHeight = isSearchOpen && searchResults.length > 0 && activeMenu === 'search' && contentRef.current ? contentRef.current.offsetHeight : 0;

    // Prioritize search height if search is active
    const finalHeight = activeMenu === 'search' ? base + searchHeight : base + target;

    containerRef.current.style.height = `${finalHeight}px`;
  }, [activeMenu, items, isSearchOpen, searchResults]);

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/');
    }
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
    setActiveMenu('search'); // Use 'search' as a virtual menu state
    setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
    }, 100);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
        const results = allProducts.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
        setSearchResults(results);
        setActiveMenu('search'); // Ensure menu is open to show results
    } else {
        setSearchResults([]);
    }
  };

  const handleSearchResultClick = (product) => {
    // 1. Navigate to home if not there
    if (location.pathname !== '/') {
        navigate('/');
        // Wait for navigation
        setTimeout(() => scrollToProduct(product), 500);
    } else {
        scrollToProduct(product);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setActiveMenu(null);
  };

  const scrollToProduct = (product) => {
    // Dispatch custom event to ProductSection or handle scroll globally
    // We can use the slug to find the element if we add ids to product cards
    const element = document.getElementById(`product-${product.slug}`);
    if (element) {
        // Scroll window to the section containing the product
        // The element is inside a horizontal scroll container.
        // We need to find the container.
        const container = element.closest('.overflow-x-auto');
        if (container) {
            // Scroll window to container
            const containerRect = container.getBoundingClientRect();
            const absoluteTop = window.scrollY + containerRect.top - 100; // Offset for navbar
            
            if (window.lenis && typeof window.lenis.scrollTo === 'function') {
                window.lenis.scrollTo(absoluteTop);
            } else {
                window.scrollTo({ top: absoluteTop, behavior: 'smooth' });
            }

            // Scroll horizontal container to product
            const elementRect = element.getBoundingClientRect();
            const containerLeft = container.getBoundingClientRect().left;
            const scrollLeft = element.offsetLeft - (container.clientWidth / 2) + (element.clientWidth / 2);
            
            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });

            // Trigger attention animation
            // Dispatch event
            const event = new CustomEvent('highlight-product', { detail: { slug: product.slug } });
            window.dispatchEvent(event);
        }
    }
  };

  const handleBlur = (e) => {
      // Delay closing to allow click on results
      setTimeout(() => {
          if (!document.activeElement || document.activeElement !== searchInputRef.current) {
            // setIsSearchOpen(false);
            // setActiveMenu(null);
          }
      }, 200);
  };

  return (
    <nav ref={navRef} className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] md:z-50" onMouseLeave={scheduleClose}>
      <div
        ref={containerRef}
        className="w-[900px] max-w-[90vw] md:max-w-[90vw] rounded-3xl bg-white/10 backdrop-blur-md border border-black/10 shadow-md overflow-hidden transition-all duration-300 ease-out"
        style={{ height: (minHeight && typeof window !== 'undefined' && window.innerWidth >= 768) ? `${minHeight}px` : undefined }}
      >
        {/* Desktop Navigation */}
        <div ref={headerRef} className="px-12 py-3 hidden md:block">
          <div className="flex items-center justify-between gap-8 text-black">
            <a
              href="#collection"
              className={`font-bold transition hover:opacity-70 text-black ${isSearchOpen ? 'hidden md:block' : ''}`}
              onMouseEnter={() => openMenu('collection')}
              onMouseLeave={scheduleClose}
            >
              Collection
            </a>
            <a
              href="#about"
              className={`font-bold transition hover:opacity-70 text-black ${isSearchOpen ? 'hidden md:block' : ''}`}
              onMouseEnter={() => openMenu('about')}
              onMouseLeave={scheduleClose}
            >
              About
            </a>
            <img src={logo} alt="Logo" className="h-8 cursor-pointer" onClick={handleLogoClick} />
            
            {isSearchOpen ? (
                <div className="flex-1 max-w-xs relative">
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onBlur={() => {
                            // Only close if we didn't click a result
                            setTimeout(() => {
                                setIsSearchOpen(false);
                                if (activeMenu === 'search') setActiveMenu(null);
                            }, 200);
                        }}
                        placeholder="Search products..."
                        className="w-full bg-transparent border-b-2 border-black text-black font-bold outline-none px-2 py-1 placeholder-black/50"
                    />
                </div>
            ) : (
                <button 
                    className="font-bold transition hover:opacity-70 text-black"
                    onClick={handleSearchClick}
                >
                    Search
                </button>
            )}

            <div className="relative" onMouseEnter={() => openMenu('cart')} onMouseLeave={scheduleClose}>
              <a
                href="#cart"
                className="font-bold transition hover:opacity-70 text-black relative inline-block"
              >
                Cart
                {items.length > 0 && (
                  <span className="pointer-events-none absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden px-4 py-3 relative z-[61]">
          <div className="flex items-center justify-center gap-4">
            {/* Cart Icon */}
            <button
              onClick={toggleMobileCart}
              aria-label="Open cart"
              aria-expanded={isMobileCartOpen}
              aria-controls="mobile-cart-panel"
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-black relative touch-manipulation"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2L6 9H3l3 7h12l3-7h-3l-3-7z"/>
                <path d="M9 2v7"/>
                <path d="M15 2v7"/>
              </svg>
              {items.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Logo - Centered */}
            <img src={logo} alt="Faisan Kaka" className="h-8 cursor-pointer" onClick={handleLogoClick} />

            {/* Hamburger / Close toggle */}
            <button
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-panel"
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-black touch-manipulation transition-transform duration-200"
            >
              {isMobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="4" y1="4" x2="20" y2="20"/>
                  <line x1="20" y1="4" x2="4" y2="20"/>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Desktop dropdown panel — hidden on mobile to prevent layout height bleed */}
        <div
          ref={contentRef}
          className={`hidden md:block px-12 pb-12 pt-6 max-h-[360px] overflow-y-auto no-scrollbar transition-all duration-300 ease-in-out ${activeMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'} ${activeMenu && activeMenu !== 'collection' ? 'bg-white/80 rounded-2xl p-6 backdrop-blur-md shadow-lg' : ''}`}
          onMouseEnter={() => activeMenu && openMenu(activeMenu)}
          onMouseLeave={scheduleClose}
        >
          {/* Search Results */}
          <div className={`${activeMenu === 'search' ? 'block' : 'hidden'}`}>
             {searchResults.length > 0 ? (
                 <div className="flex flex-col gap-3">
                     {searchResults.map(product => (
                         <div 
                            key={product.slug} 
                            className="flex items-center gap-4 p-2 hover:bg-black/5 rounded-lg cursor-pointer transition-colors"
                            onClick={() => handleSearchResultClick(product)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur
                         >
                             <div className="w-12 h-12 rounded bg-gray-200 overflow-hidden flex-shrink-0">
                                 <img src={product.backImage || product.frontImage} alt={product.name} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex flex-col">
                                 <span className="font-bold text-sm">{product.name}</span>
                                 <span className="text-xs text-black/60">{currency === 'NPR' ? `Rs. ${product.priceNPR}` : `₹${product.priceINR}`}</span>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="text-center py-4 text-black/50 font-medium">
                     {searchQuery ? 'No products found' : 'Type to search...'}
                 </div>
             )}
          </div>

          <div className={`${activeMenu === 'collection' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col gap-6 w-full">
              <div className="w-full bg-black text-white rounded-2xl py-8 text-center text-xl font-bold">T-Shirt</div>
              <div className="w-full bg-black text-white rounded-2xl py-8 text-center text-xl font-bold">Hoodie</div>
              <div className="w-full bg-black text-white rounded-2xl py-8 text-center text-xl font-bold">Pants</div>
            </div>
          </div>
          <div className={`${activeMenu === 'about' ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full h-full">
              <div className="flex flex-col justify-between h-full p-2">
                <p className="text-sm text-black/80 leading-relaxed">
                  Faisan Kaka is a premium Indian clothing brand dedicated to crafting timeless essentials
                  with a focus on quality, comfort, and clean silhouettes. We believe in thoughtful design,
                  refined materials, and everyday wearability that feels elevated yet effortless. Our collections
                  aim to blend modern minimalism with meticulous detailing for pieces that stand the test of time.
                </p>
                <p className="text-sm text-black/80 leading-relaxed mt-4">
                  Inspired by contemporary culture and classic form, every garment is designed for balance:
                  durability without compromise, simplicity with intention, and style that fits seamlessly into
                  daily life.
                </p>
              </div>
              <div className="flex flex-col justify-center h-full p-2 text-white">
                <div className="flex flex-col gap-3 items-stretch">
                  <a href="#instagram" className="flex items-center gap-3 rounded-2xl bg-black font-bold px-5 py-3 transition hover:opacity-90 w-full">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>
                    Instagram
                  </a>
                  <a href="mailto:info@example.com" className="flex items-center gap-3 rounded-2xl bg-black font-bold px-5 py-3 transition hover:opacity-90 w-full">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                    Email
                  </a>
                  <a href="#whatsapp" className="flex items-center gap-3 rounded-2xl bg-black font-bold px-5 py-3 transition hover:opacity-90 w-full">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
                <div className="flex items-center justify-end gap-4 mt-6">
                  <a href="https://instagram.com/saurabh" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
                    <img src="https://i.pravatar.cc/96?img=12" alt="Saurabh" className="w-14 h-14 rounded-full border-2 border-black" />
                    <span className="text-xs font-bold text-black leading-tight">Saurabh</span>
                    <span className="text-[10px] text-black/70 leading-tight">Founder</span>
                  </a>
                  <a href="https://instagram.com/rishavchaudhary" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
                    <img src="https://i.pravatar.cc/96?img=15" alt="Rishav" className="w-14 h-14 rounded-full border-2 border-black" />
                    <span className="text-xs font-bold text-black leading-tight">Rishav</span>
                    <span className="text-[10px] text-black/70 leading-tight">Co-Founder</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className={`${activeMenu === 'cart' ? 'block' : 'hidden'}`}>
            <div className="flex flex-col gap-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center w-full py-6">
                  <p className="text-sm font-bold text-black">No Items Added Yet</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    {items.map((i) => {
                      const imgSrc = imageMap[i.id]?.back || imageMap[i.id]?.front;
                      return (
                        <div key={i.id} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-black/10 overflow-hidden">
                              {imgSrc ? (
                                <img src={imgSrc} alt={i.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-black">{i.title}</span>
                              <span className="text-xs text-black/70">
                                {currency === 'NPR' ? `Rs. ${i.priceNPR}` : `₹${i.priceINR}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="relative w-8 h-8 flex items-center justify-center bg-white text-black border border-black rounded hover:bg-gray-100 transition-colors text-lg after:absolute after:-inset-[6px] after:content-['']"
                              onClick={() => updateQuantity(i.id, Math.max(1, i.quantity - 1))}
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-sm font-bold text-black">{i.quantity}</span>
                            <button
                              className="relative w-8 h-8 flex items-center justify-center bg-white text-black border border-black rounded hover:bg-gray-100 transition-colors text-lg after:absolute after:-inset-[6px] after:content-['']"
                              onClick={() => updateQuantity(i.id, i.quantity + 1)}
                            >
                              +
                            </button>
                            <button
                              className="ml-2 w-8 h-8 flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: '#ef4444' }}
                              onClick={() => removeItem(i.id)}
                              aria-label="Remove"
                              title="Remove"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-black">Total</span>
                    <span className="text-sm font-bold text-black">
                      {currency === 'NPR' ? `Rs. ${total.toFixed(2)}` : `₹${total.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      className="rounded-xl bg-black text-black font-bold px-6 py-3 transition hover:opacity-90"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        <div
          id="mobile-menu-panel"
          role="menu"
          aria-label="Site navigation"
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
        >
          <div className="border-t border-black/10 bg-white/90 backdrop-blur-md">

            {/* ── Collection ──────────────────────────── */}
            <div>
              <button
                role="menuitem"
                aria-expanded={mobileSubmenu === 'collection'}
                aria-controls="mobile-submenu-collection"
                onClick={() => toggleMobileSubmenu('collection')}
                className={`w-full flex items-center justify-between px-5 py-4 min-h-[52px] font-bold text-black transition-colors active:bg-black/5 ${mobileSubmenu === 'collection' ? 'opacity-100' : 'opacity-80'}`}
              >
                <span>Collection</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-300 ${mobileSubmenu === 'collection' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div
                id="mobile-submenu-collection"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  mobileSubmenu === 'collection' ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-4 flex flex-col gap-2">
                  {['T-Shirt', 'Hoodie', 'Pants'].map(cat => (
                    <button
                      key={cat}
                      role="menuitem"
                      onClick={() => { navigate('/#collection'); closeMobileMenus(); }}
                      className="w-full text-left font-bold text-white bg-black rounded-2xl px-5 py-4 min-h-[52px] transition-opacity active:opacity-70"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── About ───────────────────────────────── */}
            <div className="border-t border-black/5">
              <button
                role="menuitem"
                aria-expanded={mobileSubmenu === 'about'}
                aria-controls="mobile-submenu-about"
                onClick={() => toggleMobileSubmenu('about')}
                className={`w-full flex items-center justify-between px-5 py-4 min-h-[52px] font-bold text-black transition-colors active:bg-black/5 ${mobileSubmenu === 'about' ? 'opacity-100' : 'opacity-80'}`}
              >
                <span>About</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-300 ${mobileSubmenu === 'about' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div
                id="mobile-submenu-about"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  mobileSubmenu === 'about' ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 flex flex-col gap-4">
                  <p className="text-sm text-black/70 leading-relaxed">
                    Faisan Kaka is a premium Indian clothing brand dedicated to crafting timeless essentials
                    with a focus on quality, comfort, and clean silhouettes.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a href="#instagram" className="flex items-center gap-3 rounded-2xl bg-black text-white font-bold px-5 py-3 min-h-[48px] active:opacity-70 transition-opacity">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/></svg>
                      Instagram
                    </a>
                    <a href="mailto:info@example.com" className="flex items-center gap-3 rounded-2xl bg-black text-white font-bold px-5 py-3 min-h-[48px] active:opacity-70 transition-opacity">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                      Email
                    </a>
                    <a href="#whatsapp" className="flex items-center gap-3 rounded-2xl bg-black text-white font-bold px-5 py-3 min-h-[48px] active:opacity-70 transition-opacity">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                      WhatsApp
                    </a>
                  </div>
                  <div className="flex gap-6 justify-center pt-1">
                    <a href="https://instagram.com/saurabh" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
                      <img src="https://i.pravatar.cc/96?img=12" alt="Saurabh" className="w-12 h-12 rounded-full border-2 border-black" />
                      <span className="text-xs font-bold text-black">Saurabh</span>
                      <span className="text-[10px] text-black/60">Founder</span>
                    </a>
                    <a href="https://instagram.com/rishavchaudhary" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
                      <img src="https://i.pravatar.cc/96?img=15" alt="Rishav" className="w-12 h-12 rounded-full border-2 border-black" />
                      <span className="text-xs font-bold text-black">Rishav</span>
                      <span className="text-[10px] text-black/60">Co-Founder</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Search ──────────────────────────────── */}
            <div className="border-t border-black/5">
              <button
                role="menuitem"
                aria-expanded={mobileSubmenu === 'search'}
                aria-controls="mobile-submenu-search"
                onClick={() => toggleMobileSubmenu('search')}
                className={`w-full flex items-center justify-between px-5 py-4 min-h-[52px] font-bold text-black transition-colors active:bg-black/5 ${mobileSubmenu === 'search' ? 'opacity-100' : 'opacity-80'}`}
              >
                <span>Search</span>
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-300 ${mobileSubmenu === 'search' ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div
                id="mobile-submenu-search"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  mobileSubmenu === 'search' ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-4 flex flex-col gap-3">
                  <div className="relative">
                    <input
                      ref={mobileSearchInputRef}
                      type="search"
                      value={mobileSearchQuery}
                      onChange={handleMobileSearchChange}
                      placeholder="Search products…"
                      aria-label="Search products"
                      className="w-full bg-transparent border-b-2 border-black text-black font-bold outline-none px-2 py-2 placeholder-black/40 text-sm"
                    />
                  </div>
                  {mobileSearchQuery.trim().length > 0 && (
                    <div className="flex flex-col gap-1 max-h-48 overflow-y-auto no-scrollbar">
                      {mobileSearchResults.length > 0 ? mobileSearchResults.map(product => (
                        <button
                          key={product.slug}
                          role="option"
                          aria-selected="false"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => handleMobileResultClick(product)}
                          className="flex items-center gap-3 p-2 rounded-xl active:bg-black/5 transition-colors text-left w-full min-h-[48px]"
                        >
                          <div className="w-10 h-10 rounded-lg bg-black/10 overflow-hidden flex-shrink-0">
                            <img src={product.backImage || product.frontImage} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-black">{product.name}</span>
                            <span className="text-[11px] text-black/55">{currency === 'NPR' ? `Rs. ${product.priceNPR}` : `₹${product.priceINR}`}</span>
                          </div>
                        </button>
                      )) : (
                        <p className="text-center text-black/40 text-xs py-3">No products found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Cart Dropdown */}
        <div id="mobile-cart-panel" className={`md:hidden transition-all duration-300 ease-in-out ${isMobileCartOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}>
          <div className="px-4 py-4 bg-white/80 backdrop-blur-md border-t border-black/10">
            <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center w-full py-6">
                  <p className="text-sm font-bold text-black">No Items Added Yet</p>
                </div>
              ) : (
                <>
                  {items.map((i) => {
                    const imgSrc = imageMap[i.id]?.back || imageMap[i.id]?.front;
                    return (
                      <div key={i.id} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-black/10 overflow-hidden">
                            {imgSrc ? (
                              <img src={imgSrc} alt={i.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-black">{i.title}</span>
                            <span className="text-xs text-black/70">
                              {currency === 'NPR' ? `Rs. ${i.priceNPR}` : `₹${i.priceINR}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="relative w-6 h-6 flex items-center justify-center bg-white text-black border border-black rounded hover:bg-gray-100 transition-colors text-xs"
                            onClick={() => updateQuantity(i.id, Math.max(1, i.quantity - 1))}
                          >
                            -
                          </button>
                          <span className="w-4 text-center text-xs font-bold text-black">{i.quantity}</span>
                          <button
                            className="relative w-6 h-6 flex items-center justify-center bg-white text-black border border-black rounded hover:bg-gray-100 transition-colors text-xs"
                            onClick={() => updateQuantity(i.id, i.quantity + 1)}
                          >
                            +
                          </button>
                          <button
                            className="ml-1 w-6 h-6 flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: '#ef4444' }}
                            onClick={() => removeItem(i.id)}
                            aria-label="Remove"
                            title="Remove"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 border-t border-black/20">
                    <span className="text-sm font-bold text-black">Total</span>
                    <span className="text-sm font-bold text-black">
                      {currency === 'NPR' ? `Rs. ${total.toFixed(2)}` : `₹${total.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      className="rounded-xl bg-black text-white font-bold px-4 py-2 transition hover:opacity-90 text-sm"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
