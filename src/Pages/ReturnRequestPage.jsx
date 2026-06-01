import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Footer from '../Components/footer.jsx';
import { listOrders, updateOrderReturn } from '../lib/ordersService.js';
import { RETURN_REASON_OPTIONS, buildEkartTrackingUrl, isReturnEligibleStatus, normalizeOrderIdInput, normalizePhoneInput } from '../lib/returnWorkflow.js';

const validateReturnFields = (fields) => {
  const errors = {};
  if (!fields.orderId.trim()) errors.orderId = 'Order ID is required';
  if (!fields.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\d{10}$/.test(fields.phone.replace(/\s/g, ''))) {
    errors.phone = 'Must be a 10-digit number';
  }
  return errors;
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const ReturnRequestPage = () => {
  const navigate = useNavigate();

  // Search Step State
  const [searchFields, setSearchFields] = useState({ orderId: '', phone: '' });
  const [searchErrors, setSearchErrors] = useState({});
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [validatedOrder, setValidatedOrder] = useState(null);

  // Return Details Form State
  const [reason, setReason] = useState(RETURN_REASON_OPTIONS[0]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchFields(prev => ({ ...prev, [name]: value }));
    if (searchErrors[name]) setSearchErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    const errs = validateReturnFields(searchFields);
    if (Object.keys(errs).length > 0) {
      setSearchErrors(errs);
      return;
    }

    setLoadingOrder(true);
    try {
      const orders = await listOrders();
      const enteredOrderId = normalizeOrderIdInput(searchFields.orderId);
      const enteredPhone = normalizePhoneInput(searchFields.phone);

      const foundOrder = orders.find(o => {
        const orderIdMatch = normalizeOrderIdInput(o.id) === enteredOrderId;

        const phoneMatch = normalizePhoneInput(o.phone) === enteredPhone ||
                           normalizePhoneInput(o.raw?.customer?.phone) === enteredPhone;

        return orderIdMatch && phoneMatch;
      });

      if (!foundOrder) {
        setSearchErrors({ orderId: 'No matching order found with these credentials.' });
      } else {
        if (!isReturnEligibleStatus(foundOrder.status)) {
          setSearchErrors({
            orderId: `Return unavailable. Order is currently in '${foundOrder.status}' status (must be Delivered or Shipped).`
          });
        } else {
          setValidatedOrder(foundOrder);
        }
      }
    } catch (err) {
      console.error(err);
      setSearchErrors({ orderId: 'Verification failed. Please try again later.' });
    } finally {
      setLoadingOrder(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setCompressing(true);
    try {
      const compressedList = await Promise.all(files.map(file => compressImage(file)));
      setImages(prev => [...prev, ...compressedList]);
    } catch (err) {
      console.error('Image compression error:', err);
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!validatedOrder) return;

    setSubmittingReturn(true);
    try {
      await updateOrderReturn(validatedOrder.id, {
        returnStatus: 'Pending Approval',
        returnReason: [reason, additionalDetails].filter(Boolean).join('\n\n'),
        returnImages: images,
        ekartReturnTrackingId: '',
      });
      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit return request. Please try again.');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleReset = () => {
    setValidatedOrder(null);
    setSearchFields({ orderId: '', phone: '' });
    setReason(RETURN_REASONS[0]);
    setAdditionalDetails('');
    setImages([]);
    setSubmitSuccess(false);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-16 lg:px-24 pt-32 pb-16 md:pt-40 md:pb-20">
        
        {/* Page Header */}
        <motion.div
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
            Returns & Exchanges
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black leading-none">
            Return Request
          </h1>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          {/* Main Form/Success Content */}
          <div className="flex-grow w-full">
            <AnimatePresence mode="wait">
              {submitSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-white rounded-3xl border-2 border-black/8 p-8 md:p-10 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-black tracking-tight mb-3">Return Request Submitted</h2>
                  <p className="text-sm font-semibold text-black/60 leading-relaxed mb-6">
                    Your request for Order #{validatedOrder?.id} has been received and is currently **Pending Approval**. Our customer support team will review the request within 24 to 48 hours. 
                  </p>
                  
                  {validatedOrder?.tracking && (
                    <div className="bg-black/5 rounded-2xl p-4 mb-6">
                      <p className="text-xs font-black tracking-wider text-black/45 mb-1">ORIGINAL SHIPMENT TRACKING</p>
                      <p className="text-sm font-bold text-black mb-3">Carrier: Ekart Logistics</p>
                      <a
                          href={buildEkartTrackingUrl(validatedOrder.tracking)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-black tracking-wider uppercase text-black hover:underline"
                      >
                        Track Original Shipment ↗
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="px-6 py-3 rounded-2xl bg-black text-white text-xs font-black tracking-wider uppercase hover:opacity-90 transition-opacity"
                  >
                    Start Another Return
                  </button>
                </motion.div>
              ) : !validatedOrder ? (
                // Step 1: Validate Order and Phone
                <motion.form
                  key="search"
                  onSubmit={handleSearchSubmit}
                  noValidate
                  className="grid grid-cols-1 gap-y-7"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                      Order ID
                    </label>
                    <input
                      name="orderId"
                      type="text"
                      value={searchFields.orderId}
                      onChange={handleSearchChange}
                      placeholder="e.g. ORD-123456-ABCD"
                      className={`w-full bg-transparent border-b-2 py-2.5 text-black font-semibold text-sm placeholder-black/20 outline-none transition-colors duration-200 ${
                        searchErrors.orderId ? 'border-red-400 focus:border-red-500' : 'border-black/15 focus:border-black'
                      }`}
                    />
                    {searchErrors.orderId && (
                      <p className="text-[0.7rem] font-semibold text-red-500 mt-1">{searchErrors.orderId}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="text"
                      value={searchFields.phone}
                      onChange={handleSearchChange}
                      placeholder="10-digit number"
                      className={`w-full bg-transparent border-b-2 py-2.5 text-black font-semibold text-sm placeholder-black/20 outline-none transition-colors duration-200 ${
                        searchErrors.phone ? 'border-red-400 focus:border-red-500' : 'border-black/15 focus:border-black'
                      }`}
                    />
                    {searchErrors.phone && (
                      <p className="text-[0.7rem] font-semibold text-red-500 mt-1">{searchErrors.phone}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loadingOrder}
                    className="mt-4 w-full py-4 rounded-2xl bg-black text-white text-sm font-bold tracking-tight flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingOrder ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Validating Order…
                      </>
                    ) : (
                      <>Verify Order Details</>
                    )}
                  </button>
                </motion.form>
              ) : (
                // Step 2: Input Return Reason & Details
                <motion.form
                  key="details"
                  onSubmit={handleReturnSubmit}
                  className="grid grid-cols-1 gap-y-7"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="bg-black/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black tracking-wider text-black/45">ORDER VALIDATED</p>
                      <p className="text-sm font-bold text-black">{validatedOrder.id} · {validatedOrder.customer}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-black text-black hover:bg-black/5 transition-colors"
                    >
                      Change Order
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                      Reason for Return
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-[#f5f5f5] rounded-2xl border-2 border-black/10 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors"
                    >
                      {RETURN_REASON_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                      Additional Details
                    </label>
                    <textarea
                      rows={4}
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                      placeholder="Please describe the size mismatch, defect details, or reason for return..."
                      className="w-full bg-[#f5f5f5] rounded-2xl border-2 border-black/10 px-4 py-3 text-sm font-semibold outline-none focus:border-black transition-colors resize-y min-h-[100px]"
                    />
                  </div>

                  {/* Secure proof uploader */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                      Upload Proof Images (Required for damaged/wrong items)
                    </label>
                    <div className="w-full border-2 border-dashed border-black/15 rounded-2xl p-6 bg-black/[0.01] flex flex-col items-center justify-center hover:bg-black/[0.03] transition-colors relative cursor-pointer group">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/35 mb-2 group-hover:text-black transition-colors">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-xs font-bold text-black/60 group-hover:text-black transition-colors">Drag and drop or browse files</span>
                      <span className="text-[10px] text-black/30 font-medium mt-1">JPEG, PNG up to 10MB</span>
                    </div>

                    {/* Compressed Previews */}
                    {images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                        {images.map((imgUrl, i) => (
                          <div key={i} className="relative rounded-xl border border-black/10 overflow-hidden bg-white aspect-square group">
                            <img src={imgUrl} alt="Upload preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeImage(i)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {compressing && (
                      <p className="text-xs font-bold text-black/40 mt-2 flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Processing images...
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReturn || compressing}
                    className="mt-4 w-full py-4 rounded-2xl bg-black text-white text-sm font-bold tracking-tight flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submittingReturn ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting Request…
                      </>
                    ) : (
                      <>Submit Return Request</>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Info Sidebar */}
          <div className="w-full lg:w-[320px] lg:sticky lg:top-24 flex-shrink-0">
            <div className="rounded-3xl bg-[#f5f5f5] p-6 flex flex-col gap-5">
              <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/50">
                Return Guidelines
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">14</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">14-Day Return Window</p>
                    <p className="text-[0.7rem] text-black/40 font-medium mt-1">
                      Return requests must be initiated within 14 days of order delivery.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">★</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">Unworn & Original Condition</p>
                    <p className="text-[0.7rem] text-black/40 font-medium mt-1">
                      Items must be returned unworn, unwashed, and with all original tags attached.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">📦</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-black">Ekart Return Shipping</p>
                    <p className="text-[0.7rem] text-black/40 font-medium mt-1">
                      Once approved, you will receive an Ekart Return Tracking ID to ship back the package.
                    </p>
                  </div>
                </div>
              </div>

              {validatedOrder?.tracking && (
                <>
                  <div className="w-full h-px bg-black/10" />
                  <div>
                    <p className="text-xs font-bold text-black mb-1">Track original order:</p>
                    <a
                      href={buildEkartTrackingUrl(validatedOrder.tracking)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-black/60 hover:text-black underline font-semibold"
                    >
                      Track Shipment on Ekart ↗
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default ReturnRequestPage;
