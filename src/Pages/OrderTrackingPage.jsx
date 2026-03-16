import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../Components/footer.jsx';

/* ─── Validation ────────────────────────────────────────────────── */

const validate = (fields) => {
  const errors = {};
  if (!fields.contact.trim()) {
    errors.contact = 'Required';
  } else {
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^\d{10}$/;
    const isEmail = emailRegex.test(fields.contact);
    const isPhone = phoneRegex.test(fields.contact.replace(/\s/g, ''));
    
    if (!isEmail && !isPhone) {
      errors.contact = 'Enter a valid email or 10-digit phone';
    }
  }
  
  if (!fields.orderId.trim()) {
    errors.orderId = 'Required';
  }
  
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
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
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

/* ─── OrderTrackingPage ────────────────────────────────────────── */

const INITIAL = {
  contact: '',
  orderId: '',
};

const OrderTrackingPage = () => {
  const [fields, setFields] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
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
      contact: fields.contact,
      orderId: fields.orderId,
      timestamp: new Date().toISOString(),
    };

    console.log('[OrderTrackingPage] Submitting payload:', payload);

    // ── Integration point ──────────────────────────────────────
    // Replace this block with your backend API call:
    //
    // try {
    //   const res = await fetch('/api/track-order', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   });
    //   const data = await res.json();
    //   setTrackingData(data);
    // } catch (err) {
    //   console.error(err);
    //   setLoading(false);
    // }
    // ──────────────────────────────────────────────────────────

    // Simulate async for now
    await new Promise((r) => setTimeout(r, 1800));
    setLoading(false);

    // Mock tracking data
    const mockTracking = {
      orderId: fields.orderId,
      status: 'In Transit',
      steps: [
        { label: 'Order Confirmed', completed: true, date: '2 days ago' },
        { label: 'Processing', completed: true, date: '1 day ago' },
        { label: 'Shipped', completed: true, date: 'Yesterday' },
        { label: 'Out for Delivery', completed: true, date: 'Today' },
        { label: 'Delivered', completed: false, date: 'Expected Tomorrow' },
      ],
    };
    setTrackingData(mockTracking);
    setSubmitted(true);
  };

  /* ── Tracking result state ── */
  if (submitted && trackingData) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-16 lg:px-24 pt-32 pb-16 md:pt-40 md:pb-20">
          {/* ── Page heading ── */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
              Order #{trackingData.orderId}
            </p>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black leading-none">
              Track Your Order
            </h1>
          </motion.div>

          {/* ── Status card ── */}
          <motion.div
            className="rounded-3xl bg-[#f5f5f5] p-8 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50 mb-1">
                  Current Status
                </p>
                <p className="text-2xl md:text-3xl font-black text-black">
                  {trackingData.status}
                </p>
              </div>
              <motion.div
                className="w-16 h-16 rounded-full bg-black flex items-center justify-center"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 18,
                  delay: 0.2,
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Timeline ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.2 }}
          >
            <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black mb-8">
              Order Progress
            </p>
            <div className="space-y-0">
              {trackingData.steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="flex gap-6 pb-8 relative"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + index * 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {/* Timeline line and dot */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-3.5 h-3.5 rounded-full ring-4 ${
                        step.completed
                          ? 'bg-black ring-black/10'
                          : 'bg-white ring-black/15 border-2 border-black/30'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 15,
                        delay: 0.3 + index * 0.08,
                      }}
                    />
                    {index < trackingData.steps.length - 1 && (
                      <motion.div
                        className={`w-0.5 h-12 ${
                          step.completed
                            ? 'bg-black/20'
                            : 'bg-black/10'
                        }`}
                        initial={{ height: 0 }}
                        animate={{ height: 48 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.4 + index * 0.08,
                        }}
                      />
                    )}
                  </div>

                  {/* Step details */}
                  <div className="flex-1 pt-1">
                    <p
                      className={`text-sm font-bold ${
                        step.completed
                          ? 'text-black'
                          : 'text-black/50'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-black/40 font-medium mt-0.5">
                      {step.date}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Back button ── */}
          <motion.div
            className="mt-16 flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.6 }}
          >
            <button
              onClick={() => {
                setSubmitted(false);
                setFields(INITIAL);
                setTrackingData(null);
              }}
              className="px-6 py-3 rounded-2xl bg-black text-white text-sm font-bold hover:bg-black/90 transition-colors"
            >
              Search Another Order
            </button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── Form state ── */
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
            Track Your Package
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black leading-none">
            Order Tracking
          </h1>
        </motion.div>

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
            <div className="grid grid-cols-1 gap-y-7 mb-10">
              <Field
                label="Email or Phone Number"
                error={errors.contact}
              >
                <input
                  name="contact"
                  type="text"
                  value={fields.contact}
                  onChange={handleChange}
                  placeholder="your@email.com or 10-digit phone"
                  data-error={!!errors.contact}
                  className={inputCls(!!errors.contact)}
                />
              </Field>

              <Field label="Order ID" error={errors.orderId}>
                <input
                  name="orderId"
                  type="text"
                  value={fields.orderId}
                  onChange={handleChange}
                  placeholder="e.g., #FAI-2024-001"
                  data-error={!!errors.orderId}
                  className={inputCls(!!errors.orderId)}
                />
              </Field>
            </div>

            {/* Track button — mobile only (shows below form on small screens) */}
            <motion.div className="lg:hidden" variants={fieldVariants}>
              <TrackButton loading={loading} />
            </motion.div>
          </motion.form>

          {/* ── Info sidebar ── */}
          <motion.div
            className="w-full lg:w-[320px] lg:sticky lg:top-8 lg:-mt-8 flex-shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2,
            }}
          >
            <div className="rounded-3xl bg-[#f5f5f5] p-6 flex flex-col gap-5">
              <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                How It Works
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">
                      Enter Your Details
                    </p>
                    <p className="text-[0.7rem] text-black/40 font-medium mt-1">
                      Provide the email or phone number associated with your order
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">
                      Enter Order ID
                    </p>
                    <p className="text-[0.7rem] text-black/40 font-medium mt-1">
                      You received this in your confirmation email
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">
                      View Status
                    </p>
                    <p className="text-[0.7rem] text-black/40 font-medium mt-1">
                      Get real-time updates on your package
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-black/10" />

              {/* Track button — desktop sidebar */}
              <div className="hidden lg:block mt-1">
                <TrackButton loading={loading} onClick={handleSubmit} />
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-5 mt-5 flex-wrap">
              {['Fast Updates', '24/7 Support'].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[0.62rem] font-semibold text-black/40">
                    {badge}
                  </span>
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

/* ─── Track button (shared between mobile + sidebar) ──────────── */

const TrackButton = ({ loading, onClick }) => (
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
        Tracking…
      </>
    ) : (
      <>
        Track Order
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </>
    )}
  </motion.button>
);

export default OrderTrackingPage;
