import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import { DEFAULT_IMAGE, SITE_URL, loadSeoRoutes } from './seo-routes.mjs';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const ssrDir = path.join(rootDir, '.seo-ssr');

function imageType(url) {
  if (/\.jpe?g($|\?)/i.test(url)) return 'image/jpeg';
  if (/\.webp($|\?)/i.test(url)) return 'image/webp';
  return 'image/png';
}

async function imageDimensions(url) {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== SITE_URL) return {};
    const metadata = await sharp(path.join(rootDir, 'public', decodeURIComponent(parsed.pathname).replace(/^\/+/, ''))).metadata();
    return metadata.width && metadata.height ? { width: metadata.width, height: metadata.height } : {};
  } catch {
    return {};
  }
}

function structuredData(route) {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const graph = [
    { '@type': 'Organization', '@id': organizationId, name: '乐可开源', url: `${SITE_URL}/`, logo: `${SITE_URL}/logo.png` },
    { '@type': 'WebSite', '@id': websiteId, name: '乐可开源', url: `${SITE_URL}/`, publisher: { '@id': organizationId }, inLanguage: 'zh-CN' },
    { '@type': 'WebPage', '@id': `${route.canonical}#webpage`, url: route.canonical, name: route.title, description: route.description, isPartOf: { '@id': websiteId }, inLanguage: 'zh-CN' },
  ];
  if (route.kind === 'article') graph.push({ '@type': 'Article', headline: route.label, description: route.description, image: route.image, datePublished: route.date, mainEntityOfPage: route.canonical, author: { '@id': organizationId }, publisher: { '@id': organizationId }, inLanguage: 'zh-CN' });
  if (route.kind === 'project') graph.push({ '@type': 'CreativeWork', name: route.label, description: route.description, image: route.image, url: route.canonical, creator: { '@id': organizationId }, inLanguage: 'zh-CN' });
  if (route.breadcrumbs.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: route.breadcrumbs.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: item.url })) });
  return { '@context': 'https://schema.org', '@graph': graph };
}

async function applyRoute(template, route, body) {
  const $ = cheerio.load(template);
  const dimensions = await imageDimensions(route.image);
  $('html').attr('lang', 'zh-CN');
  $('#root').html(body);
  $('title').text(route.title);
  $('meta[name="description"]').remove();
  $('link[rel="canonical"]').remove();
  $('script[type="application/ld+json"]').remove();
  $('head').append(`<meta name="description" content="${route.description}">`);
  $('head').append(`<link rel="canonical" href="${route.canonical}">`);
  $('head').append(`<script type="application/ld+json">${JSON.stringify(structuredData(route)).replace(/</g, '\\u003c')}</script>`);
  const properties = {
    'fb:app_id': '1202485368502369', 'og:site_name': '乐可开源',
    'og:type': route.kind === 'article' ? 'article' : 'website', 'og:title': route.title,
    'og:description': route.description, 'og:url': route.canonical, 'og:image': route.image,
    'og:image:secure_url': route.image, 'og:image:type': imageType(route.image),
  };
  if (dimensions.width) properties['og:image:width'] = String(dimensions.width);
  if (dimensions.height) properties['og:image:height'] = String(dimensions.height);
  for (const [property, content] of Object.entries(properties)) $('head').append(`<meta property="${property}" content="${content}">`);
  for (const [name, content] of Object.entries({
    'twitter:card': route.image === DEFAULT_IMAGE ? 'summary' : 'summary_large_image',
    'twitter:title': route.title, 'twitter:description': route.description, 'twitter:image': route.image,
  })) $('head').append(`<meta name="${name}" content="${content}">`);
  return $.html();
}

async function writeRoute(routePath, html) {
  const relative = routePath === '/' ? '' : routePath.replace(/^\/+|\/+$/g, '');
  const directory = path.join(distDir, relative);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, 'index.html'), html);
}

async function main() {
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
  const { renderPath } = await import(`${pathToFileURL(path.join(ssrDir, 'entry-server.js')).href}?v=${Date.now()}`);
  const routes = await loadSeoRoutes(rootDir);
  for (const route of routes) {
    await writeRoute(route.path, await applyRoute(template, route, renderPath(route.path)));
    console.log(`SEO rendered: ${route.path}`);
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((route) => `  <url><loc>${route.canonical}</loc></url>`).join('\n')}\n</urlset>\n`;
  await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
  await fs.writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  await fs.writeFile(path.join(distDir, '404.html'), `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>页面未找到 | 乐可开源</title></head>
<body><main><h1>页面未找到</h1><p>你访问的页面不存在或已经移动。</p><a href="/">返回首页</a></main></body></html>\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => fs.rm(ssrDir, { recursive: true, force: true }));
