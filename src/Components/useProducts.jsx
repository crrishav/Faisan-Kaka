import { useState, useEffect } from 'react';
import { sanityClient } from '../lib/sanityClient';

const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const query = `*[_type == "product" && inStock == true]{
          _id,
          title,
          category,
          priceINR,
          priceNPR,
          description,
          "mainImageUrl": mainImage.asset->url,
          "images": images[].asset->url,
          "slug": slug.current
        }`;

        const data = await sanityClient.fetch(query);

        // Map Sanity data to match ProductCard expectations
        const mappedProducts = data.map((item) => ({
          _id: item._id,
          name: item.title,
          slug: item.slug || item.title.toLowerCase().replace(/\s+/g, '-'),
          category: item.category,
          priceINR: item.priceINR?.toString(),
          priceNPR: item.priceNPR?.toString(),
          description: item.description,
          // Use mainImage as front, first additional image as back (or same if no additional)
          frontImage: item.mainImageUrl,
          backImage: item.images?.[0] || item.mainImageUrl,
          // Preload all images
          allImages: [item.mainImageUrl, ...(item.images || [])].filter(Boolean),
        }));

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
  }, []);

  return { products, loading, error };
};

export default useProducts;
