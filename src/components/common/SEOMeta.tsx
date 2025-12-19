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
  
  const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image || DEFAULT_IMAGE;
  
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
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={truncatedDesc} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter Card Meta */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOMeta;
