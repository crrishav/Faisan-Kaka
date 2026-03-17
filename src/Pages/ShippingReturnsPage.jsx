import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../Components/footer.jsx';

const sections = [
  {
    title: 'Shipping Region',
    body: 'Faisan Kaka currently ships within India. Nepal checkout support is being prepared, but orders with unsupported delivery postcodes cannot be processed yet.',
  },
  {
    title: 'Dispatch Timeline',
    body: 'Most orders are processed within 1 to 3 business days. During drops, launches, or high-volume periods, dispatch may take longer and tracking updates may appear after the parcel is scanned by the carrier.',
  },
  {
    title: 'Delivery Attempts',
    body: 'Customers should ensure someone is available to receive the package at the delivery address. Missed delivery attempts or unserviceable address details may lead to return-to-origin handling.',
  },
  {
    title: 'Returns',
    body: 'Return requests should be raised promptly after delivery. Items must be unused, unwashed, and in their original condition. Approved returns are reviewed against the delivered product state before the final resolution is issued.',
  },
  {
    title: 'Damaged or Incorrect Orders',
    body: 'If a parcel arrives damaged or the wrong item is delivered, contact Faisan Kaka with order details and supporting photos so the issue can be reviewed quickly.',
  },
];

const ShippingReturnsPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 md:px-16 lg:px-24 pt-32 pb-16 md:pt-40 md:pb-20">
        <motion.div
          className="mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40 mb-2">
            Store Policy
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black leading-none">
            Shipping & Return Policy
          </h1>
          <p className="max-w-2xl mt-5 text-sm md:text-base text-black/60 font-medium leading-relaxed">
            This page outlines how deliveries, dispatch timing, support windows, and return requests are handled for Faisan Kaka orders.
          </p>
        </motion.div>

        <motion.div
          className="rounded-3xl bg-[#f5f5f5] p-6 md:p-8 flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          {sections.map((section, index) => (
            <div key={section.title} className={index === sections.length - 1 ? '' : 'border-b border-black/8 pb-6'}>
              <p className="text-[0.65rem] font-bold tracking-[0.18em] uppercase text-black/45 mb-2">
                {section.title}
              </p>
              <p className="text-sm md:text-[0.95rem] text-black/75 font-medium leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <Link
            to="/terms-of-service"
            className="inline-flex items-center justify-center rounded-full border border-black px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-black hover:text-white"
          >
            Terms of Service
          </Link>
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-black text-white px-5 py-2 text-sm font-bold transition-opacity hover:opacity-90"
          >
            Back to Checkout
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ShippingReturnsPage;