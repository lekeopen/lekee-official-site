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
  
  // 确保 URL 统一（避免循环跳转警告）
  let fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  // 如果不是根路径且不以斜杠结尾，加上斜杠 (GitHub Pages 默认行为)
  if (fullUrl !== SITE_URL && !fullUrl.endsWith('/')) {
    fullUrl = `${fullUrl}/`;
  }
  
  let ogImage = DEFAULT_IMAGE;
  if (image) {
    if (image.startsWith('http')) {
      ogImage = image;
    } else {
      ogImage = `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
    }
  }
  
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
      
      {/* Twitter Card Meta */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={truncatedDesc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEOMeta;
