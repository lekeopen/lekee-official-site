import fs from 'fs';
import path from 'path';
import frontMatter from 'front-matter';

const RSS_PATH = path.join(process.cwd(), 'public', 'rss.xml');
const NEWS_DIR = path.join(process.cwd(), 'content', 'news');
const SITE_URL = 'https://lekeopen.com';

// Helper to parse news from markdown
const getNews = () => {
  if (!fs.existsSync(NEWS_DIR)) return [];

  const files = fs.readdirSync(NEWS_DIR).filter(file => file.endsWith('.md'));

  return files.map(file => {
    const content = fs.readFileSync(path.join(NEWS_DIR, file), 'utf-8');
    const { attributes } = frontMatter(content) as { attributes: { title: string; date: string; summary: string; category: string; status?: string } };
    const id = file.replace('.md', '');
    return {
      id,
      ...attributes
    };
  })
    .filter((item: { status?: string }) => item.status === 'published')
    .sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const generateRSS = () => {
  const newsData = getNews();
  const rssItems = newsData.map((item: { title: string; id: string; date: string; summary: string; category: string; cover?: string }) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${SITE_URL}/news/${item.id}</link>
      <guid>${SITE_URL}/news/${item.id}</guid>
      <pubDate>${new Date(item.date + (item.date.includes('T') ? '' : 'T00:00:00.000Z')).toUTCString()}</pubDate>
      <description><![CDATA[${Array.isArray(item.summary) ? item.summary.join(' ') : item.summary}]]></description>
      <category>${item.category}</category>
      ${item.cover ? `<enclosure url="${SITE_URL}${item.cover}" length="0" type="image/png" />` : ''}
    </item>
  `).join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>乐可开源 - 技术动态</title>
    <link>${SITE_URL}</link>
    <description>lekeopen.com 官方技术与开源内容发布源</description>
    <language>zh-cn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;

  fs.writeFileSync(RSS_PATH, rssFeed);
  console.log(`✅ RSS Feed generated at: ${RSS_PATH}`);
};

generateRSS();
