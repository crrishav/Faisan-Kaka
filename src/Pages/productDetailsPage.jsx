import React, { useMemo, useEffect } from 'react';
import ProductDetails from '../Components/productDetails.jsx';
import NavBar from '../Components/navBar.jsx';
import Footer from '../Components/footer.jsx';
import { useParams } from 'react-router-dom';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const products = useMemo(() => {
    const files = import.meta.glob('/src/assets/Collection/**/*.{png,jpg,jpeg,webp}', { eager: true, as: 'url' });
    const map = {};
    for (const [path, url] of Object.entries(files)) {
      const parts = path.split('/');
      const idx = parts.indexOf('Collection');
      const category = parts[idx + 1];
      const filename = parts[parts.length - 1];
      const cleaned = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '').replace(/^\d+\.\s*/, '');
      
      // Enhanced regex to handle both formats: "Name (variant) (price1, price2)" and "Name (price1, price2)"
      const rx = /^(.*?)(?:\s*\((front|back|Front|Back)\))?\s*\(([^,]+)\s*,\s*([^)]+)\)\s*$/i;
      const m = cleaned.match(rx);
      
      let name, variant, priceINR, priceNPR;
      
      if (m) {
        name = m[1].trim();
        variant = (m[2] || '').toLowerCase();
        priceINR = m[3].trim();
        priceNPR = m[4].trim();
      } else {
        // Fallback for files without price info
        name = cleaned.replace(/\s*\(.*\)\s*$/, '').trim();
        variant = '';
        priceINR = undefined;
        priceNPR = undefined;
      }
      
      const s = name.toLowerCase().replace(/\s+/g, '-');
      const key = `${category}:${s}`;
      
      if (!map[key]) map[key] = { category, name, slug: s, priceINR: undefined, priceNPR: undefined, images: {} };
      
      if (priceINR && !map[key].priceINR) map[key].priceINR = priceINR;
      if (priceNPR && !map[key].priceNPR) map[key].priceNPR = priceNPR;
      
      if (variant === 'front') map[key].images.front = url;
      else if (variant === 'back') map[key].images.back = url;
      else map[key].images.back = map[key].images.back || url;
    }
    return Object.values(map);
  }, []);
  const product = products.find(p => p.slug === slug) || { name: 'Product', priceINR: '0', priceNPR: '0', images: {} };
  const backImg = product.images?.back || product.images?.front;
  const frontImg = product.images?.front || product.images?.back;
  const description = `${product.name} is crafted with premium materials and designed for everyday comfort, durability, and clean style.`;
  useEffect(() => {
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [slug]);
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <NavBar />
      <div className="flex-1 px-8 pt-28">
        <div className="max-w-7xl mx-auto flex items-start justify-center gap-8 h-screen pt-12">
          <div className="w-[600px] grid grid-cols-2 gap-8">
            <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#1f3c34]">
              <img src={backImg} alt={product.name} className="w-full h-[420px] object-cover" />
            </div>
            <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#27443b]">
              <img src={frontImg} alt={product.name} className="w-full h-[420px] object-cover" />
            </div>
          </div>
          <div className="flex-shrink-0 w-[440px]">
            <ProductDetails title={product.name} priceINR={product.priceINR} priceNPR={product.priceNPR} description={description} slug={product.slug} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
