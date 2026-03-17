import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../Components/footer.jsx';

const sections = [
  {
    title: 'Orders',
    body: 'Orders are confirmed after payment approval and availability verification. If an item becomes unavailable before dispatch, Faisan Kaka may cancel or partially fulfil the order and issue the appropriate refund.',
  },
  {
    title: 'Pricing',
    body: 'Prices are shown in INR or NPR based on the storefront currency selection logic. Taxes, shipping charges, and payment details shown at checkout are considered part of the final payable amount.',
  },
  {
    title: 'Accountability',
    body: 'Customers are responsible for entering accurate contact, address, and delivery details. Delays or failed deliveries caused by incorrect information may require additional verification before re-dispatch.',
  },
  {
    title: 'Product Presentation',
    body: 'We aim to display product colours, prints, and finishes as accurately as possible. Slight visual variation may still occur across screens, lighting conditions, and production batches.',
  },
  {
    title: 'Misuse',
    body: 'Any fraudulent transaction attempt, chargeback abuse, or policy misuse may result in order cancellation, restricted purchasing access, or further review before future orders are accepted.',
  },
];

const TermsOfServicePage = () => {
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
            Terms of Service
          </h1>
          <p className="max-w-2xl mt-5 text-sm md:text-base text-black/60 font-medium leading-relaxed">
            These terms govern how orders are placed, reviewed, and fulfilled through Faisan Kaka. By continuing to checkout, you agree to the conditions below.
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
            to="/shipping-returns"
            className="inline-flex items-center justify-center rounded-full border border-black px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-black hover:text-white"
          >
            Shipping & Return Policy
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

export default TermsOfServicePage;