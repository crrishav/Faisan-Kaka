import { createClient } from '@sanity/client';

const SANITY_PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.VITE_SANITY_DATASET || 'production';

let sanityClient = null;
if (SANITY_PROJECT_ID) {
  sanityClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-03-14',
    useCdn: true,
    perspective: 'published',
  });
} else {
  // In development/demo without Sanity configured, avoid throwing at import time.
  // Consumers should handle empty results when client is null.
  // eslint-disable-next-line no-console
  console.warn('[sanityClient] VITE_SANITY_PROJECT_ID not set — falling back to empty data.');
}
export { sanityClient };

/**
 * GROQ Query: Fetch all products by category
 */
export const getProductsByCategory = async (category) => {
  if (!sanityClient) return [];
  const query = `*[_type == "product" && category == $category && inStock == true && showOnWebsite != false] | order(publishedAt desc) {
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
    stock,
    sizes,
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

const productCache = new Map();

/**
 * GROQ Query: Fetch a single product by slug
 */
export const getProductBySlug = async (slug) => {
  if (productCache.has(slug)) {
    return productCache.get(slug);
  }

  const query = `*[_type == "product" && slug.current == $slug && showOnWebsite != false][0] {
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
    stock,
    sizes,
    featured,
    publishedAt
  }`;

  try {
    if (!sanityClient) return null;
    const product = await sanityClient.fetch(query, { slug });
    if (product) {
      productCache.set(slug, product);
    }
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

export const prefetchProductBySlug = (slug) => {
  if (!productCache.has(slug)) {
    getProductBySlug(slug);
  }
};

/**
 * GROQ Query: Fetch all featured products
 */
export const getFeaturedProducts = async () => {
  if (!sanityClient) return [];
  const query = `*[_type == "product" && featured == true && inStock == true && showOnWebsite != false] | order(publishedAt desc)[0..5] {
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
    stock,
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
  if (!sanityClient) return [];
  const query = `array::unique(*[_type == "product" && showOnWebsite != false].category) | sort()`;
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
  if (!sanityClient) return { unsubscribe: () => {} };
  const query = `*[_type == "product" && category == $category && inStock == true && showOnWebsite != false] | order(publishedAt desc) {
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
    stock,
    inStock
  }`;
  return sanityClient.listen(query, { category }).subscribe(callback);
};
