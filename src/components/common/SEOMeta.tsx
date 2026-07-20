import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOMetaProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
}

const SEOMeta: React.FC<SEOMetaProps> = ({
  title,
  description,
  url,
  image,
  type = 'article',
  siteName = '乐可开源'
}) => {
  const SITE_URL = 'https://lekeopen.com';
  const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

  const normalizeUrl = (value?: string) => {
    const route = value || '/';
    const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
    const absolute = `${SITE_URL}${normalizedRoute}`;
    if (absolute === SITE_URL || absolute === `${SITE_URL}/`) {
      return `${SITE_URL}/`;
    }
    return absolute.endsWith('/') ? absolute : `${absolute}/`;
  };

  const normalizeImage = (value?: string) => {
    if (!value) {
      return DEFAULT_IMAGE;
    }
    const absolute = value.startsWith('http')
      ? value
      : `${SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;

    // 部分社媒平台（含微信）对 svg 抓取兼容较差，统一回退到 png 封面
    if (/\.svg($|\?)/i.test(absolute)) {
      return DEFAULT_IMAGE;
    }
    return absolute;
  };

  const detectImageType = (value: string) => {
    if (/\.png($|\?)/i.test(value)) return 'image/png';
    if (/\.jpe?g($|\?)/i.test(value)) return 'image/jpeg';
    if (/\.webp($|\?)/i.test(value)) return 'image/webp';
    return 'image/png';
  };
  
  const fullUrl = normalizeUrl(url);
  const ogImage = normalizeImage(image);
  const ogImageType = detectImageType(ogImage);
  const ogImageWidth = ogImage === DEFAULT_IMAGE ? 600 : undefined;
  const ogImageHeight = ogImage === DEFAULT_IMAGE ? 600 : undefined;
  const twitterCard = ogImage === DEFAULT_IMAGE ? 'summary' : 'summary_large_image';
  
  // 截取描述前 120 字
  const truncatedDesc = description.length > 120 
    ? description.substring(0, 120) + '...' 
    : description;

  return (
    <Helmet>
      {/* 基础 Meta */}
      <title>{title}</title>
      <meta name="description" content={truncatedDesc} />
      
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
