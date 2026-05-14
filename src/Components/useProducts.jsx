import { useEffect, useState } from 'react';
import { getProductsByCategory } from '../lib/sanityClient';

/**
 * Updated useProducts Hook - Fetches from Sanity CMS
 * Replaces the old file-glob based approach with real-time data from Sanity
 */
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch products from all categories
        const categories = ['T-Shirts', 'Hoodies', 'Pants'];
        const allProducts = [];

        for (const category of categories) {
          const categoryProducts = await getProductsByCategory(category);
          allProducts.push(...categoryProducts);
        }

        // Transform Sanity data to match current component expectations
        const transformedProducts = allProducts.map((product) => ({
          _id: product._id,
          name: product.title,
          title: product.title, // Keep both for compatibility
          category: product.category,
          slug: product.slug?.current,
          description: product.description,
          priceINR: product.priceINR,
          priceNPR: product.priceNPR,
          // Use Sanity image URLs instead of local files
          frontImage: product.mainImage?.asset?.url,
          backImage: product.images?.[0]?.asset?.url || product.mainImage?.asset?.url,
          images: product.images || [],
          sizes: product.sizes || [],
          colors: product.colors || [],
          inStock: product.inStock,
          featured: product.featured,
          publishedAt: product.publishedAt,
        }));

        setProducts(transformedProducts);
      } catch (err) {
        console.error('Failed to fetch products from Sanity:', err);
        setError(err.message);
        // Fallback: return empty array instead of crashing
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllProducts();
  }, []);

  return { products, loading, error };
};

export default useProducts;
