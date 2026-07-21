export const SITE_URL = 'https://lekeopen.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function canonicalUrl(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path.replace(/\/+$/, '')}/`;
}

export function absoluteImageUrl(image?: string): string {
  if (!image || /\.svg($|\?)/i.test(image)) return DEFAULT_OG_IMAGE;
  return image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}
