import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '../../lib/sanity';

type PageProps = {
  params: Promise<{ slug: string }>;
};

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback;
  if (value == null) return fallback;
  return String(value).trim() || fallback;
}

function pickProductImageUrl(product: Awaited<ReturnType<typeof getProductBySlug>>): string | null {
  if (!product) return null;
  const main = product.mainImage?.asset?.url;
  if (typeof main === 'string' && main) return main;

  const gallery = Array.isArray(product.images) ? product.images : [];
  for (const img of gallery) {
    const url = img?.asset?.url;
    if (typeof url === 'string' && url) return url;
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found on Faisan Kaka.',
      robots: { index: false, follow: false },
    };
  }

  const title = asText(product.title, 'Product');
  const category = asText(product.category, 'Streetwear');
  const description = asText(
    product.description,
    `${title} by Faisan Kaka. Premium ${category.toLowerCase()} designed for everyday wear.`
  );

  const image = pickProductImageUrl(product);
  const canonicalPath = `/product/${slug}`;

  return {
    title: `${title} Hoodie`,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: 'product',
      url: canonicalPath,
      title: `${title} Hoodie | Faisan Kaka`,
      description,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: `${title} hoodie by Faisan Kaka`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${title} Hoodie | Faisan Kaka`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <main>
      <h1>{asText(product.title, 'Product')}</h1>
    </main>
  );
}
