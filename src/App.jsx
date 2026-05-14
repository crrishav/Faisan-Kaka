import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './homePage.jsx';
import ProductDetailsPage from './Pages/productDetailsPage.jsx';
import CollectionsPage from './Components/CollectionsPage.jsx';
import LoadingScreen from './Components/LoadingScreen.jsx';
import PageTransition from './Components/PageTransition.jsx';
import NavBar from './Components/navBar.jsx';
import CheckoutForm from './Components/CheckoutForm.jsx';
import OrderTrackingPage from './Pages/OrderTrackingPage.jsx';
import PrintStudioPage from './claude/PrintStudioPage.jsx';
import AdminPage from './Pages/adminPage.jsx';
import AdminLoginPage from './Pages/AdminLoginPage.jsx';
import AdminGuard from './Components/AdminGuard.jsx';
import ShippingReturnsPage from './Pages/ShippingReturnsPage.jsx';
import SizingGuidePage from './Pages/SizingGuidePage.jsx';
import TermsOfServicePage from './Pages/TermsOfServicePage.jsx';
import { Studio } from 'sanity';
import config from '../sanity.config';
import AppErrorBoundary from './Components/AppErrorBoundary.jsx';

const withRouteBoundary = (element, fallbackTitle) => (
  <AppErrorBoundary fallbackTitle={fallbackTitle}>
    {element}
  </AppErrorBoundary>
);

const AppRoutes = () => {
  return (
    <AppErrorBoundary fallbackTitle="We could not render this page transition.">
      <PageTransition>
        <Routes>
          <Route path="/" element={withRouteBoundary(<HomePage />, 'Home page is unavailable right now.')} />
          <Route path="/collections" element={withRouteBoundary(<CollectionsPage />, 'Collections page is unavailable right now.')} />
          <Route path="/product/:slug" element={withRouteBoundary(<ProductDetailsPage />, 'Product details are unavailable right now.')} />
          <Route path="/checkout" element={withRouteBoundary(<CheckoutForm />, 'Checkout is temporarily unavailable.')} />
          <Route path="/terms-of-service" element={withRouteBoundary(<TermsOfServicePage />, 'Terms page is unavailable right now.')} />
          <Route path="/shipping-returns" element={withRouteBoundary(<ShippingReturnsPage />, 'Shipping and returns page is unavailable right now.')} />
          <Route path="/sizing-guide" element={withRouteBoundary(<SizingGuidePage />, 'Sizing guide is unavailable right now.')} />
          <Route path="/track-order" element={withRouteBoundary(<OrderTrackingPage />, 'Order tracking is unavailable right now.')} />
          <Route path="/print" element={withRouteBoundary(<PrintStudioPage />, 'Print studio is unavailable right now.')} />
          <Route path="/admin" element={withRouteBoundary(<AdminGuard><AdminPage /></AdminGuard>, 'Admin page is unavailable right now.')} />
          <Route path="/admin/login" element={withRouteBoundary(<AdminLoginPage />, 'Login is unavailable right now.')} />
          <Route path="/studio/*" element={withRouteBoundary(<Studio config={config} />, 'Studio is unavailable right now.')} />
        </Routes>
      </PageTransition>
    </AppErrorBoundary>
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
      <AppErrorBoundary fallbackTitle="We hit an unexpected rendering issue.">
        <AppRoutes />
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
