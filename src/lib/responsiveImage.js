const SANITY_CDN_HOST_PATTERN = /\.cdn\.sanity\.io$/i;

export function isSanityImageUrl(url) {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return SANITY_CDN_HOST_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

export function buildSanityImageUrl(url, options = {}) {
  if (!isSanityImageUrl(url)) return url;

  const {
    width,
    height,
    quality = 78,
    fit = 'max',
    auto = 'format',
    dpr,
  } = options;

  try {
    const parsed = new URL(url);

    if (Number.isFinite(width) && width > 0) {
      parsed.searchParams.set('w', String(Math.round(width)));
    }

    if (Number.isFinite(height) && height > 0) {
      parsed.searchParams.set('h', String(Math.round(height)));
    }

    if (Number.isFinite(quality) && quality > 0) {
      parsed.searchParams.set('q', String(Math.round(quality)));
    }

    if (fit) {
      parsed.searchParams.set('fit', fit);
    }

    if (auto) {
      parsed.searchParams.set('auto', auto);
    }

    if (Number.isFinite(dpr) && dpr > 0) {
      parsed.searchParams.set('dpr', String(dpr));
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function buildResponsiveSrcSet(url, widths, options = {}) {
  if (!url || !Array.isArray(widths) || widths.length === 0) return undefined;
  if (!isSanityImageUrl(url)) return undefined;

  const uniqueWidths = [...new Set(widths)]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  if (uniqueWidths.length === 0) return undefined;

  return uniqueWidths
    .map((width) => `${buildSanityImageUrl(url, { ...options, width })} ${width}w`)
    .join(', ');
}

export function getResponsiveImageProps({
  src,
  alt = '',
  widths = [320, 480, 640, 800, 960, 1200],
  sizes = '100vw',
  fallbackWidth,
  quality = 78,
  fit = 'max',
  auto = 'format',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
} = {}) {
  if (!src) {
    return {
      src: '',
      alt,
      loading,
      decoding,
    };
  }

  const baseOptions = { quality, fit, auto };
  const srcSet = buildResponsiveSrcSet(src, widths, baseOptions);
  const safeFallbackWidth = Number.isFinite(fallbackWidth) && fallbackWidth > 0
    ? fallbackWidth
    : (Array.isArray(widths) && widths.length > 0 ? Math.max(...widths) : undefined);

  const resolvedSrc = isSanityImageUrl(src) && safeFallbackWidth
    ? buildSanityImageUrl(src, { ...baseOptions, width: safeFallbackWidth })
    : src;

  return {
    src: resolvedSrc,
    srcSet,
    sizes: srcSet ? sizes : undefined,
    alt,
    loading,
    decoding,
    fetchPriority,
  };
}