import fs from 'fs';
import path from 'path';
import frontMatter from 'front-matter';

const RSS_PATH = path.join(process.cwd(), 'public', 'rss.xml');
const NEWS_DIR = path.join(process.cwd(), 'content', 'news');
const SITE_URL = 'https://lekee.cc';

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
  const rssItems = newsData.map((item: { title: string; id: string; date: string; summary: string; category: string }) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${SITE_URL}/news/${item.id}</link>
      <guid>${SITE_URL}/news/${item.id}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <description><![CDATA[${Array.isArray(item.summary) ? item.summary.join(' ') : item.summary}]]></description>
      <category>${item.category}</category>
    </item>
  `).join('');

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>天水乐可信息技术有限公司 - 公司动态</title>
    <link>${SITE_URL}</link>
    <description>AI 驱动的技术服务与应用开发团队技术动态与更新日志</description>
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
