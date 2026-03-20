const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const apiVersion = '2024-03-14';

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID');
}

type SanitySlug = { current?: string | null } | null;
type SanityImageAsset = { url?: string | null } | null;
type SanityImage = { asset?: SanityImageAsset; alt?: string | null } | null;

export type SanityProduct = {
  _id: string;
  title?: string | null;
  slug?: SanitySlug;
  category?: string | null;
  description?: string | null;
  mainImage?: SanityImage;
  images?: SanityImage[] | null;
  _updatedAt?: string;
};

async function sanityFetch<T>(query: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({
    query,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [`$${k}`, v])),
  });

  const res = await fetch(
    `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?${searchParams.toString()}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) {
    throw new Error(`Sanity fetch failed: ${res.status}`);
  }

  const json = await res.json();
  return json.result as T;
}

export async function getProductBySlug(slug: string): Promise<SanityProduct | null> {
  const query = `*[_type == "product" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    category,
    description,
    _updatedAt,
    mainImage{asset->{url}, alt},
    images[]{asset->{url}, alt}
  }`;

  return sanityFetch<SanityProduct | null>(query, { slug });
}

export async function getAllProductSlugs(): Promise<Array<{ slug: { current: string }; _updatedAt?: string }>> {
  const query = `*[_type == "product" && defined(slug.current)]{
    "slug": slug,
    _updatedAt
  }`;

  return sanityFetch<Array<{ slug: { current: string }; _updatedAt?: string }>>(query);
}
