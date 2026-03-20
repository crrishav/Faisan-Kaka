import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://faisankaka.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Faisan Kaka | Premium Streetwear',
    template: '%s | Faisan Kaka',
  },
  description:
    'Faisan Kaka creates premium streetwear with clean silhouettes, quality fabrics, and limited drops. Shop hoodies, t-shirts, and pants built for everyday wear.',
  keywords: [
    'Faisan Kaka',
    'streetwear',
    'premium hoodies',
    'graphic t-shirts',
    'minimal fashion',
    'Nepal fashion',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Faisan Kaka',
    title: 'Faisan Kaka | Premium Streetwear',
    description:
      'Premium streetwear label by Faisan Kaka. Explore hoodies, t-shirts, and pants with elevated everyday fit and finish.',
    images: [
      {
        url: '/og/faisan-kaka-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Faisan Kaka premium streetwear collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Faisan Kaka | Premium Streetwear',
    description:
      'Shop premium hoodies, t-shirts, and pants from Faisan Kaka.',
    images: ['/og/faisan-kaka-og.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
