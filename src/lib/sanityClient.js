import { createClient } from 'sanity';

// Initialize Sanity client with environment variables
export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-03-14', // Use current date for latest API
  useCdn: true, // Use CDN for faster reads (disable for real-time data)
  perspective: 'published', // Only fetch published documents
});

/**
 * GROQ Query: Fetch all products by category
 */
export const getProductsByCategory = async (category) => {
  const query = `*[_type == "product" && category == $category && inStock == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    category,
    description,
    mainImage {
      asset -> {
        _id,
        url,
        metadata {
          dimensions {
            height,
            width
          }
        }
      },
      alt,
      hotspot
    },
    images[] {
      asset -> {
        _id,
        url
      },
      alt,
      hotspot
    },
    priceINR,
    priceNPR,
    sizes,
    colors,
    featured,
    publishedAt
  }`;

  try {
    const products = await sanityClient.fetch(query, { category });
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

/**
 * GROQ Query: Fetch a single product by slug
 */
export const getProductBySlug = async (slug) => {
  const query = `*[_type == "product" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    category,
    description,
    mainImage {
      asset -> {
        _id,
        url,
        metadata {
          dimensions {
            height,
            width
          }
        }
      },
      alt,
      hotspot
    },
    images[] {
      asset -> {
        _id,
        url
      },
      alt,
      hotspot
    },
    priceINR,
    priceNPR,
    sizes,
    colors,
    featured,
    publishedAt
  }`;

  try {
    const product = await sanityClient.fetch(query, { slug });
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

/**
 * GROQ Query: Fetch all featured products
 */
export const getFeaturedProducts = async () => {
  const query = `*[_type == "product" && featured == true && inStock == true] | order(publishedAt desc)[0..5] {
    _id,
    title,
    slug,
    category,
    mainImage {
      asset -> {
        _id,
        url
      },
      alt,
      hotspot
    },
    priceINR,
    priceNPR,
    featured
  }`;

  try {
    const products = await sanityClient.fetch(query);
    return products;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
};

/**
 * GROQ Query: Fetch all unique categories
 */
export const getCategories = async () => {
  const query = `array::unique(*[_type == "product"].category) | sort()`;

  try {
    const categories = await sanityClient.fetch(query);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

/**
 * Subscribe to real-time product updates (optional)
 * Use for live inventory updates
 */
export const subscribeToProducts = (category, callback) => {
  const query = `*[_type == "product" && category == $category && inStock == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    category,
    mainImage {
      asset -> {
        _id,
        url
      },
      alt,
      hotspot
    },
    priceINR,
    priceNPR,
    inStock
  }`;

  return sanityClient.listen(query, { category }).subscribe(callback);
};
