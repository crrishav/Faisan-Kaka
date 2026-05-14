import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * AdminGuard: A wrapper component that checks for admin authentication.
 * If not authenticated, redirects to a login page or shows a passcode prompt.
 */
const AdminGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking
  const location = useLocation();

  useEffect(() => {
    // Check localStorage for the session token
    const token = localStorage.getItem('fk_admin_token');
    const expiry = localStorage.getItem('fk_admin_expiry');
    
    // Simple validation: check if token exists and hasn't expired (24h session)
    if (token === 'authenticated' && expiry && Date.now() < parseInt(expiry)) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [location]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to the custom admin login page
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminGuard;
