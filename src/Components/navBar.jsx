import React, { useEffect, useRef, useState } from 'react';
import logo from '../assets/Logo.png';

const NavBar = () => {
  const [activeMenu, setActiveMenu] = useState(null);
  const containerRef = useRef(null);
  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const [minHeight, setMinHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const closeTimer = useRef(null);

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
    setContentHeight(target);
    containerRef.current.style.height = `${base + target}px`;
  }, [activeMenu]);

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
            <a href="#about" className="font-bold transition hover:opacity-70 text-black">About</a>
            <img src={logo} alt="Logo" className="h-8" />
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
          className={`px-12 pb-12 transition-all duration-300 ease-in-out ${activeMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
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
