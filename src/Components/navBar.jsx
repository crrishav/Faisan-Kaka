import React, { useEffect, useRef, useState } from 'react';
import logo from '../assets/logo.png';
import { useNavigate, useLocation } from 'react-router-dom';

const NavBar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const [minHeight, setMinHeight] = useState(0);
  const closeTimer = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const openMenu = (name) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(name);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveMenu(null), 80);
  };

  useEffect(() => {
    if (headerRef.current) {
      setMinHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || !headerRef.current) return;
    const base = headerRef.current.offsetHeight;
    const target = activeMenu && contentRef.current ? contentRef.current.scrollHeight : 0;
    containerRef.current.style.height = `${base + target}px`;
  }, [activeMenu]);

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

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50" onMouseLeave={scheduleClose}>
      <div
        ref={containerRef}
        className="w-[900px] max-w-[90vw] rounded-3xl bg-white/10 backdrop-blur-md border border-black/10 shadow-md overflow-hidden transition-all duration-300 ease-out"
        style={{ height: minHeight ? `${minHeight}px` : undefined }}
      >
        <div ref={headerRef} className="px-12 py-3">
          <div className="flex items-center justify-between gap-8 text-black">
            <a
              href="#collection"
              className="font-bold transition hover:opacity-70 text-black"
              onMouseEnter={() => openMenu('collection')}
              onMouseLeave={scheduleClose}
            >
              Collection
            </a>
            <a
              href="#about"
              className="font-bold transition hover:opacity-70 text-black"
              onMouseEnter={() => openMenu('about')}
              onMouseLeave={scheduleClose}
            >
              About
            </a>
            <img src={logo} alt="Logo" className="h-8 cursor-pointer" onClick={handleLogoClick} />
            <button className="font-bold transition hover:opacity-70 text-black">Search</button>
            <a
              href="#cart"
              className="font-bold transition hover:opacity-70 text-black"
              onMouseEnter={() => openMenu('cart')}
              onMouseLeave={scheduleClose}
            >
              Cart
            </a>
          </div>
        </div>

        <div
          ref={contentRef}
          className={`px-12 pb-12 pt-6 min-h-[360px] transition-all duration-300 ease-in-out ${activeMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          onMouseEnter={() => activeMenu && openMenu(activeMenu)}
          onMouseLeave={scheduleClose}
        >
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
            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-center w-full py-6">
                <p className="text-sm font-bold text-black">No Items Added Yet</p>
              </div>
              <button className="rounded-xl bg-black text-white font-bold px-6 py-3 transition hover:opacity-90">
                Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
