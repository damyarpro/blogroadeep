import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'بلاگ رودیپ';
const DEFAULT_DESCRIPTION =
  'بلاگ رودیپ؛ مقالات، یادداشت‌ها و تحلیل‌های تازه به زبان فارسی.';
const SITE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export interface SeoProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string | null;
  type?: 'website' | 'article';
  keywords?: string | null;
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image,
  type = 'website',
  keywords,
  jsonLd,
  noIndex = false,
}: SeoProps) {
  const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonicalPath
    ? `${SITE_URL}${canonicalPath}`
    : typeof window !== 'undefined'
      ? window.location.href
      : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="fa_IR" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}

export { SITE_NAME, DEFAULT_DESCRIPTION };
