import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Footer from '../Components/footer.jsx';

const rows = [
  { size: 'S', chest: '36-38 in', length: '26 in', fit: 'Slim to Regular' },
  { size: 'M', chest: '38-40 in', length: '27 in', fit: 'Regular' },
  { size: 'L', chest: '40-42 in', length: '28 in', fit: 'Regular to Relaxed' },
  { size: 'XL', chest: '42-44 in', length: '29 in', fit: 'Relaxed' },
  { size: 'XXL', chest: '44-46 in', length: '30 in', fit: 'Relaxed to Oversized' },
];

const SizingGuidePage = () => {
  const location = useLocation();
  const fromProduct = location.state?.fromProduct;
  const continueShoppingTo =
    typeof fromProduct === 'string' && fromProduct.startsWith('/product/')
      ? fromProduct
      : '/collections';

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
            Product Help
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-black leading-none">
            Sizing Guide
          </h1>
          <p className="max-w-2xl mt-5 text-sm md:text-base text-black/60 font-medium leading-relaxed">
            Use this quick guide to choose your best fit. For oversized styling, go one size up. If you are between two sizes, choose based on how relaxed you want the silhouette.
          </p>
        </motion.div>

        <motion.div
          className="rounded-3xl bg-[#f5f5f5] p-4 md:p-6 overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        >
          <table className="w-full min-w-[540px] border-collapse text-left">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-3 px-3 text-[0.68rem] font-bold tracking-[0.16em] uppercase text-black/50">Size</th>
                <th className="py-3 px-3 text-[0.68rem] font-bold tracking-[0.16em] uppercase text-black/50">Chest</th>
                <th className="py-3 px-3 text-[0.68rem] font-bold tracking-[0.16em] uppercase text-black/50">Length</th>
                <th className="py-3 px-3 text-[0.68rem] font-bold tracking-[0.16em] uppercase text-black/50">Fit Profile</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.size} className="border-b border-black/8 last:border-b-0">
                  <td className="py-3 px-3 text-sm font-black text-black">{row.size}</td>
                  <td className="py-3 px-3 text-sm font-semibold text-black/70">{row.chest}</td>
                  <td className="py-3 px-3 text-sm font-semibold text-black/70">{row.length}</td>
                  <td className="py-3 px-3 text-sm font-semibold text-black/70">{row.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
        >
          <Link
            to="/shipping-returns"
            className="inline-flex items-center justify-center rounded-full border border-black px-5 py-2 text-sm font-bold text-black transition-colors hover:bg-black hover:text-white"
          >
            Shipping & Returns
          </Link>
          <Link
            to={continueShoppingTo}
            className="inline-flex items-center justify-center rounded-full border border-black/10 bg-black text-white px-5 py-2 text-sm font-bold transition-opacity hover:opacity-90"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default SizingGuidePage;