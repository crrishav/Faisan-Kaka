import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

const AdminLoginPage = () => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // The "Hardcoded" passcode - in a real app this should be an env var
  // For now we check VITE_ADMIN_PASSCODE or fallback to 'FK2024'
  const VALID_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'FK2024';

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate a bit of network delay for "security check" feel
    setTimeout(() => {
      if (passcode === VALID_PASSCODE) {
        // Success! Set session for 24 hours
        const expiry = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('fk_admin_token', 'authenticated');
        localStorage.setItem('fk_admin_expiry', expiry.toString());
        
        // Redirect back to admin or home
        const origin = location.state?.from?.pathname || '/admin';
        navigate(origin, { replace: true });
      } else {
        setError('Invalid admin passcode. Access denied.');
        setPasscode('');
      }
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-black/5 overflow-hidden"
      >
        <div className="p-8 sm:p-12">
          {/* Icon Header */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
              <Lock className="text-white w-7 h-7" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-black text-black tracking-tight mb-2">Admin Terminal</h1>
            <p className="text-black/45 text-sm font-medium">Restricted access area. Please enter your authorization passcode to proceed.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full h-14 bg-black/[0.03] border-2 border-transparent rounded-2xl px-6 text-center text-xl font-black tracking-[0.4em] outline-none focus:bg-white focus:border-black transition-all"
                disabled={isLoading}
                autoFocus
              />
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-500 text-xs font-bold mt-3 justify-center"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={isLoading || !passcode}
              className="w-full h-14 bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Authorize <ArrowRight size={18} /></>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="bg-black/[0.02] border-t border-black/5 px-8 py-5 flex items-center justify-center gap-2">
          <ShieldCheck className="text-black/20" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-black/25">Faisan Kaka Security Systems</span>
        </div>
      </motion.div>

      {/* Background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/[0.01] rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-black/[0.01] rounded-full blur-[120px]"></div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
