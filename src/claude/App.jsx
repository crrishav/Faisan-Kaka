import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/navBar.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import PageTransition from './components/PageTransition.jsx';

// Import your page components
import HomePage from './pages/HomePage.jsx';
import CollectionsPage from './pages/CollectionsPage.jsx';
// import ProductPage from './pages/ProductPage.jsx';
// import AboutPage from './pages/AboutPage.jsx';
// ... add all your routes here

// ─── AppRoutes ────────────────────────────────────────────────────────────────
// Separated so it can access the router context (useLocation lives here).
// PageTransition must be INSIDE <BrowserRouter> so it can call useLocation().

const AppRoutes = () => {
  // PageTransition needs to observe location, so it wraps Routes here.
  // NOTE: We do NOT use location as AnimatePresence key — PageTransition
  // handles that internally by swapping displayLocation at the midpoint.
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        {/* <Route path="/product/:slug" element={<ProductPage />} /> */}
        {/* <Route path="/about" element={<AboutPage />} /> */}
      </Routes>
    </PageTransition>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Mark app as loaded once assets/fonts are ready
  useEffect(() => {
    const handleLoad = () => setIsLoaded(true);

    if (document.readyState === 'complete') {
      // Already loaded (e.g. fast reload)
      setIsLoaded(true);
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <BrowserRouter>
      {/* Initial loading screen — only shown once on first load */}
      <LoadingScreen isLoaded={isLoaded} />

      {/* Persistent navbar sits outside PageTransition so it's never unmounted */}
      <NavBar />

      {/* All routes + page transition overlay */}
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
