import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './homePage.jsx';
import ProductDetailsPage from './Pages/productDetailsPage.jsx';
import LoadingScreen from './Components/LoadingScreen.jsx';

function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      // Small delay to ensure the animation can be seen
      setTimeout(() => {
        setIsLoaded(true);
      }, 4500); // Wait for the Logo animation duration
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <>
      <LoadingScreen isLoaded={isLoaded} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:slug" element={<ProductDetailsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
