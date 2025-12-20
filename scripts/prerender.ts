
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content/news');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SITE_URL = 'https://lekeopen.com';

async function prerender() {
  console.log('🏗️  Starting SEO Prerendering...');

  // 1. 读取构建好的 index.html 模板
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found. Please run "npm run build" first.');
    process.exit(1);
  }
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');

  // 2. 扫描所有新闻文章
  const newsFiles = await glob(`${CONTENT_DIR}/*.md`);
  console.log(`📄 Found ${newsFiles.length} news articles.`);

  for (const file of newsFiles) {
    const filename = path.basename(file, '.md');
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);

    // 准备 Meta 数据
    const title = data.title || '乐可开源';
    const description = (data.summary && data.summary[0]) || data.description || '专注 AI 与工程实践';
    const image = data.cover
      ? (data.cover.startsWith('http') ? data.cover : `${SITE_URL}${data.cover}`)
      : `${SITE_URL}/og-default.png`;
    const url = `${SITE_URL}/news/${filename}`;

    // 3. 使用 Cheerio 修改 HTML
    const $ = cheerio.load(templateHtml);

    // 移除现有的 helmet 注入的标签（如果有的话，虽然静态构建通常没有）
    $('title').text(title);
    $('meta[name="description"]').attr('content', description);

    // 更新或注入 Open Graph 标签
    const setMeta = (property: string, content: string) => {
      if ($(`meta[property="${property}"]`).length > 0) {
        $(`meta[property="${property}"]`).attr('content', content);
      } else {
        $('head').append(`<meta property="${property}" content="${content}">`);
      }
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:url', url);
    setMeta('og:image', image);
    setMeta('og:type', 'article');
    setMeta('og:site_name', '乐可开源');
    setMeta('fb:app_id', '1202485368502369');

    // Twitter Card
    const setNameMeta = (name: string, content: string) => {
      if ($(`meta[name="${name}"]`).length > 0) {
        $(`meta[name="${name}"]`).attr('content', content);
      } else {
        $('head').append(`<meta name="${name}" content="${content}">`);
      }
    };
    setNameMeta('twitter:card', 'summary_large_image');
    setNameMeta('twitter:title', title);
    setNameMeta('twitter:description', description);
    setNameMeta('twitter:image', image);


    // 4. 写入文件
    // 目标路径: dist/news/<slug>/index.html
    // 这样用户访问 /news/<slug> 时，服务器会返回这个 index.html
    const outDir = path.join(DIST_DIR, 'news', filename);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(path.join(outDir, 'index.html'), $.html());
    console.log(`✅ Generated SEO page for: ${filename}`);
  }

  console.log('🎉 Prerendering complete!');
}

prerender().catch(err => {
  console.error(err);
  process.exit(1);
});
