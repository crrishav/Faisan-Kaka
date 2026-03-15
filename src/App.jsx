import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './homePage.jsx';
import ProductDetailsPage from './Pages/productDetailsPage.jsx';
import CollectionsPage from './Components/CollectionsPage.jsx';
import LoadingScreen from './Components/LoadingScreen.jsx';
import PageTransition from './Components/PageTransition.jsx';
import NavBar from './Components/navBar.jsx';
import ScrollToTop from './Components/ScrollToTop.jsx';
import { Studio } from 'sanity';
import config from '../sanity.config';

const AppRoutes = () => {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/product/:slug" element={<ProductDetailsPage />} />
        <Route path="/studio/*" element={<Studio config={config} />} />
      </Routes>
    </PageTransition>
  );
};

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    let animationTimer;
    let safetyTimer;

    const handleLoad = () => {
      // Small delay to ensure the animation can be seen
      animationTimer = setTimeout(() => {
        setIsLoaded(true);
      }, 4500); // Wait for the Logo animation duration
    };

    // Safety fallback: if the load event or animation takes too long,
    // ensure the site becomes visible after a maximum duration.
    safetyTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 7000); // 7s safety threshold

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => {
        window.removeEventListener('load', handleLoad);
        clearTimeout(animationTimer);
        clearTimeout(safetyTimer);
      };
    }
  }, []);
  
  return (
    <BrowserRouter>
      <LoadingScreen isLoaded={isLoaded} />
      <NavBar />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
