import { useMemo } from 'react';

const useProducts = () => {
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
      
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const key = `${category}:${slug}`;
      
      if (!map[key]) {
        map[key] = { category, name, slug, priceINR: undefined, priceNPR: undefined, backImage: undefined, frontImage: undefined };
      }
      
      if (priceINR && !map[key].priceINR) map[key].priceINR = priceINR;
      if (priceNPR && !map[key].priceNPR) map[key].priceNPR = priceNPR;
      
      if (variant === 'front') {
        map[key].frontImage = url;
      } else if (variant === 'back') {
        map[key].backImage = url;
      } else {
        map[key].backImage = map[key].backImage || url;
      }
    }
    
    const list = Object.values(map);
    const hash = (s) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
      return h;
    };
    return list.sort((a, b) => hash(a.slug) - hash(b.slug));
  }, []);

  return products;
};

export default useProducts;
