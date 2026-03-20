import type { MetadataRoute } from 'next';
import { getAllProductSlugs } from './lib/sanity';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://faisankaka.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/print`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/shipping-returns`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/sizing-guide`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const products = await getAllProductSlugs();
  const productRoutes: MetadataRoute.Sitemap = products
    .filter((item) => item?.slug?.current)
    .map((item) => ({
      url: `${siteUrl}/product/${item.slug.current}`,
      lastModified: item._updatedAt ? new Date(item._updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  return [...staticRoutes, ...productRoutes];
}
