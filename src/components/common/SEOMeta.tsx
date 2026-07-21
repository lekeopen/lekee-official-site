import React from 'react';
import { Helmet } from 'react-helmet-async';
import { buildStructuredData } from '../../seo/structuredData';
import { absoluteImageUrl, canonicalUrl, DEFAULT_OG_IMAGE } from '../../seo/site';

interface SEOMetaProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
  kind?: 'page' | 'article' | 'project';
  datePublished?: string;
}

const SEOMeta: React.FC<SEOMetaProps> = ({
  title,
  description,
  url,
  image,
  type = 'article',
  siteName = '乐可开源',
  kind = type === 'article' ? 'article' : 'page',
  datePublished,
}) => {
  const detectImageType = (value: string) => {
    if (/\.png($|\?)/i.test(value)) return 'image/png';
    if (/\.jpe?g($|\?)/i.test(value)) return 'image/jpeg';
    if (/\.webp($|\?)/i.test(value)) return 'image/webp';
    return 'image/png';
  };
  
  const fullUrl = canonicalUrl(url || '/');
  const ogImage = absoluteImageUrl(image);
  const ogImageType = detectImageType(ogImage);
  const ogImageWidth = ogImage === DEFAULT_OG_IMAGE ? 600 : undefined;
  const ogImageHeight = ogImage === DEFAULT_OG_IMAGE ? 600 : undefined;
  const twitterCard = ogImage === DEFAULT_OG_IMAGE ? 'summary' : 'summary_large_image';
  
  // 截取描述前 120 字
  const truncatedDesc = description.length > 120 
    ? description.substring(0, 120) + '...' 
    : description;

  return (
    <Helmet>
      {/* 基础 Meta */}
      <title>{title}</title>
      <meta name="description" content={truncatedDesc} />
      <link rel="canonical" href={fullUrl} />
      <script type="application/ld+json">
        {JSON.stringify(buildStructuredData({ title, description: truncatedDesc, canonical: fullUrl, image: ogImage, kind, datePublished }))}
      </script>
      
      {/* OpenGraph Meta */}
      <meta property="fb:app_id" content="1202485368502369" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDesc} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:secure_url" content={ogImage} />
      <meta property="og:image:type" content={ogImageType} />
      {ogImageWidth && <meta property="og:image:width" content={String(ogImageWidth)} />}
      {ogImageHeight && <meta property="og:image:height" content={String(ogImageHeight)} />}
      
      {/* Twitter Card Meta */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOMeta;
