import { useState, useEffect } from 'react';
import { sanityClient } from '../lib/sanityClient';

const normalizeToArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

const normalizeTextValue = (value) => {
  if (typeof value === 'string') return value.trim();
  if (value == null) return '';
  if (typeof value === 'number') return String(value).trim();
  if (typeof value === 'object') {
    if (typeof value.title === 'string') return value.title.trim();
    if (typeof value.name === 'string') return value.name.trim();
    if (typeof value.current === 'string') return value.current.trim();
    if (typeof value.value === 'string') return value.value.trim();
    if (typeof value.hex === 'string') return value.hex.trim();
    if (typeof value.color === 'string') return value.color.trim();
    if (typeof value.text === 'string') return value.text.trim();
  }
  return '';
};

const normalizeTextList = (value) => (
  normalizeToArray(value)
    .map(normalizeTextValue)
    .filter(Boolean)
);

const useProducts = ({ includeOutOfStock = false } = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = includeOutOfStock
          ? `*[_type == "product"]{
          _id,
          title,
          category,
          priceINR,
          priceNPR,
          stock,
          description,
          sizes,
          colors,
          inStock,
          publishedAt,
          "mainImageUrl": mainImage.asset->url,
          "images": images[].asset->url,
          "slug": slug.current
        }`
          : `*[_type == "product" && inStock == true]{
          _id,
          title,
          category,
          priceINR,
          priceNPR,
          stock,
          description,
          sizes,
          colors,
          inStock,
          publishedAt,
          "mainImageUrl": mainImage.asset->url,
          "images": images[].asset->url,
          "slug": slug.current
        }`;

        const data = await sanityClient.fetch(query);

        // Map Sanity data to match ProductCard expectations
        const mappedProducts = data.map((item) => {
          const stock = typeof item.stock === 'number' ? item.stock : null;
          const normalizedSizes = normalizeTextList(item.sizes);
          const normalizedColors = normalizeTextList(item.colors);
          const isAvailable = item.inStock !== false && (stock === null || stock > 0);

          return {
          _id: item._id,
          name: item.title,
          slug: item.slug || item.title.toLowerCase().replace(/\s+/g, '-'),
          category: item.category,
          priceINR: item.priceINR?.toString(),
          priceNPR: item.priceNPR?.toString(),
          stock,
          description: item.description,
          sizes: normalizedSizes,
          colors: normalizedColors,
          inStock: isAvailable,
          publishedAt: item.publishedAt || null,
          // Use mainImage as front, first additional image as back (or same if no additional)
          frontImage: item.mainImageUrl,
          backImage: item.images?.[0] || item.mainImageUrl,
          // Preload all images
          allImages: [item.mainImageUrl, ...(item.images || [])].filter(Boolean),
          };
        });

        // Consistent sorting (hash-based like original)
        const hash = (s) => {
          let h = 0;
          for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
          return h;
        };

        const sortedProducts = mappedProducts.sort((a, b) => hash(a.slug) - hash(b.slug));

        setProducts(sortedProducts);
      } catch (err) {
        console.error('Error fetching products from Sanity:', err);
        setError(err.message || 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [includeOutOfStock]);

  return { products, loading, error };
};

export default useProducts;
