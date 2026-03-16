import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './footer.jsx';

/* ─── Validation ────────────────────────────────────────────────── */

const validate = (fields) => {
  const errors = {};
  if (!fields.fullName.trim())              errors.fullName  = 'Required';
  if (!fields.email.trim())                 errors.email     = 'Required';
  else if (!/\S+@\S+\.\S+/.test(fields.email)) errors.email = 'Invalid email';
  if (!fields.phone.trim())                 errors.phone     = 'Required';
  else if (!/^\d{10}$/.test(fields.phone.replace(/\s/g, ''))) errors.phone = 'Must be 10 digits';
  if (!fields.house.trim())                 errors.house     = 'Required';
  if (!fields.area.trim())                  errors.area      = 'Required';
  if (!fields.city.trim())                  errors.city      = 'Required';
  if (!fields.pincode.trim())               errors.pincode   = 'Required';
  else if (!/^\d{6}$/.test(fields.pincode)) errors.pincode   = 'Must be 6 digits';
  return errors;
};

/* ─── Animation variants ────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const errorVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:   { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

/* ─── Field component ───────────────────────────────────────────── */

const Field = ({ label, error, children }) => (
  <motion.div className="flex flex-col gap-1.5" variants={fieldVariants}>
    <label className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
      {label}
    </label>
    {children}
    <AnimatePresence>
      {error && (
        <motion.p
          className="text-[0.7rem] font-semibold text-red-500"
          variants={errorVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </motion.div>
);

/* ─── Input style helper ────────────────────────────────────────── */

const inputCls = (hasError) =>
  `w-full bg-transparent border-b-2 py-2.5 text-black font-semibold text-sm placeholder-black/20 outline-none transition-colors duration-200 ${
    hasError
      ? 'border-red-400 focus:border-red-500'
      : 'border-black/15 focus:border-black'
  }`;

/* ─── CheckoutForm ──────────────────────────────────────────────── */

const INITIAL = {
  fullName: '', email: '', phone: '',
  house: '', area: '', city: '', pincode: '',
};

const CheckoutForm = ({ cartItems = [], total = 0, currency = 'INR' }) => {
  const [fields, setFields]   = useState(INITIAL);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isNepal = currency === 'NPR';
  const displayTotal = isNepal ? `Rs. ${total.toFixed(2)}` : `₹${total.toFixed(2)}`;

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const first = document.querySelector('[data-error="true"]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    const payload = {
      customer: { ...fields },
      order: { items: cartItems, total, currency },
      timestamp: new Date().toISOString(),
    };

    console.log('[CheckoutForm] Submitting payload:', payload);

    // ── Integration point ──────────────────────────────────────
    // Replace this block with your Razorpay + Sanity serverless call:
    //
    // try {
    //   const res = await fetch('/api/create-order', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   });
    //   const { orderId, amount, key } = await res.json();
    //   // Init Razorpay here...
    // } catch (err) {
    //   console.error(err);
    //   setLoading(false);
    // }
    // ──────────────────────────────────────────────────────────

    // Simulate async for now
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSubmitted(true);
  };

  /* ── Success state ── */
  if (submitted) {
    return (
      <motion.div
        className="min-h-screen bg-white flex items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <motion.div
            className="w-16 h-16 rounded-full bg-black flex items-center justify-center"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
          <motion.h2
            className="text-3xl font-black tracking-tighter text-black"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Order Placed
          </motion.h2>
          <motion.p
            className="text-sm text-black/50 font-medium"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            We'll send a confirmation to {fields.email}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-16 lg:px-24 pt-32 pb-16 md:pt-40 md:pb-20">

        {/* ── Page heading ── */}
        <motion.div
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
            Final Step
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black leading-none">
            Checkout
          </h1>
        </motion.div>

        {/* ── Two column layout on desktop ── */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

          {/* ── Form ── */}
          <motion.form
            onSubmit={handleSubmit}
            noValidate
            className="flex-1 w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Section: Contact */}
            <motion.p
              className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black mb-6"
              variants={fieldVariants}
            >
              Contact
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 mb-10">
              <Field label="Full Name" error={errors.fullName}>
                <input
                  name="fullName"
                  type="text"
                  value={fields.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  autoComplete="name"
                  data-error={!!errors.fullName}
                  className={inputCls(!!errors.fullName)}
                />
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  name="email"
                  type="email"
                  value={fields.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  autoComplete="email"
                  data-error={!!errors.email}
                  className={inputCls(!!errors.email)}
                />
              </Field>

              <Field label="Phone" error={errors.phone}>
                <input
                  name="phone"
                  type="tel"
                  value={fields.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  autoComplete="tel"
                  maxLength={10}
                  data-error={!!errors.phone}
                  className={inputCls(!!errors.phone)}
                />
              </Field>
            </div>

            {/* Divider */}
            <motion.div className="w-full h-px bg-black/8 mb-10" variants={fieldVariants} />

            {/* Section: Delivery */}
            <motion.p
              className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black mb-6"
              variants={fieldVariants}
            >
              Delivery Address
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-7 mb-10">
              <Field label="House / Building" error={errors.house}>
                <input
                  name="house"
                  type="text"
                  value={fields.house}
                  onChange={handleChange}
                  placeholder="Flat 4B, Sunrise Apartments"
                  autoComplete="address-line1"
                  data-error={!!errors.house}
                  className={inputCls(!!errors.house)}
                />
              </Field>

              <Field label="Area / Street" error={errors.area}>
                <input
                  name="area"
                  type="text"
                  value={fields.area}
                  onChange={handleChange}
                  placeholder="MG Road, Sector 14"
                  autoComplete="address-line2"
                  data-error={!!errors.area}
                  className={inputCls(!!errors.area)}
                />
              </Field>

              <Field label="City" error={errors.city}>
                <input
                  name="city"
                  type="text"
                  value={fields.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  autoComplete="address-level2"
                  data-error={!!errors.city}
                  className={inputCls(!!errors.city)}
                />
              </Field>

              <Field label="Pincode" error={errors.pincode}>
                <input
                  name="pincode"
                  type="text"
                  value={fields.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  inputMode="numeric"
                  maxLength={6}
                  data-error={!!errors.pincode}
                  className={inputCls(!!errors.pincode)}
                />
              </Field>
            </div>

            {/* Pay Now — mobile only (shows below form on small screens) */}
            <motion.div className="lg:hidden" variants={fieldVariants}>
              <PayButton loading={loading} displayTotal={displayTotal} />
            </motion.div>
          </motion.form>

          {/* ── Order summary sidebar ── */}
          <motion.div
            className="w-full lg:w-[320px] lg:sticky lg:top-24 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          >
            <div className="rounded-3xl bg-[#f5f5f5] p-6 flex flex-col gap-5">
              <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                Order Summary
              </p>

              {/* Items */}
              <div className="flex flex-col gap-3">
                {cartItems.length > 0 ? (
                  cartItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {(item.frontImage || item.backImage) && (
                          <div className="w-10 h-10 rounded-xl bg-black/10 overflow-hidden flex-shrink-0">
                            <img
                              src={item.frontImage || item.backImage}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-black leading-tight">{item.title}</p>
                          {item.size && (
                            <p className="text-[0.65rem] text-black/40 font-medium">Size: {item.size}</p>
                          )}
                          <p className="text-[0.65rem] text-black/40 font-medium">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-black flex-shrink-0">
                        {isNepal
                          ? `Rs. ${(item.priceNPR * item.quantity).toFixed(0)}`
                          : `₹${(item.priceINR * item.quantity).toFixed(0)}`}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/30 font-medium">No items in cart</p>
                )}
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-black/10" />

              {/* Total */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-black">Total</p>
                <p className="text-lg font-black tracking-tight text-black">{displayTotal}</p>
              </div>

              {/* Shipping note */}
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                <p className="text-[0.65rem] text-black/40 font-semibold">Free shipping on all orders</p>
              </div>

              {/* Pay Now — desktop sidebar */}
              <div className="hidden lg:block mt-1">
                <PayButton
                  loading={loading}
                  displayTotal={displayTotal}
                  onClick={handleSubmit}
                />
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-5 mt-5 flex-wrap">
              {['Secure Payment', 'Genuine Products'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[0.62rem] font-semibold text-black/40">{badge}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

/* ─── Pay button (shared between mobile + sidebar) ──────────────── */

const PayButton = ({ loading, displayTotal, onClick }) => (
  <motion.button
    type={onClick ? 'button' : 'submit'}
    onClick={onClick}
    disabled={loading}
    className="w-full py-4 rounded-2xl bg-black text-white text-sm font-bold tracking-tight flex items-center justify-center gap-2 disabled:opacity-60"
    whileHover={!loading ? { scale: 1.02, backgroundColor: '#1a1a1a' } : {}}
    whileTap={!loading ? { scale: 0.98 } : {}}
    transition={{ duration: 0.18 }}
  >
    {loading ? (
      <>
        <motion.span
          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
        />
        Processing…
      </>
    ) : (
      <>
        Pay {displayTotal}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </>
    )}
  </motion.button>
);

export default CheckoutForm;
