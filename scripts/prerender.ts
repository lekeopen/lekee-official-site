
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
const PROJECTS_DIR = path.join(ROOT_DIR, 'content/projects');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SITE_URL = 'https://lekeopen.com';

type MetaPayload = {
  title: string;
  description: string;
  image: string;
  url: string;
  type: 'website' | 'article';
};

const normalizeUrl = (route: string) => {
  const normalized = route.startsWith('/') ? route : `/${route}`;
  if (normalized === '/') {
    return `${SITE_URL}/`;
  }
  return `${SITE_URL}${normalized.endsWith('/') ? normalized : `${normalized}/`}`;
};

const normalizeImage = (image?: string) => {
  const fallback = `${SITE_URL}/og-450x300.png`;
  if (!image) {
    return fallback;
  }
  const absolute = image.startsWith('http')
    ? image
    : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;

  if (/\.svg($|\?)/i.test(absolute)) {
    return fallback;
  }
  return absolute;
};

const imageType = (imageUrl: string) => {
  if (/\.png($|\?)/i.test(imageUrl)) return 'image/png';
  if (/\.jpe?g($|\?)/i.test(imageUrl)) return 'image/jpeg';
  if (/\.webp($|\?)/i.test(imageUrl)) return 'image/webp';
  return 'image/png';
};

function applyMeta(templateHtml: string, payload: MetaPayload) {
  const $ = cheerio.load(templateHtml);

  const escapeAttr = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const safeTitle = escapeAttr(payload.title);
  const safeDescription = escapeAttr(payload.description);
  const safeImage = escapeAttr(payload.image);
  const safeUrl = escapeAttr(payload.url);

  $('title').text(payload.title);
  $('meta[name="description"]').attr('content', safeDescription);

  const setMeta = (property: string, content: string) => {
    if ($(`meta[property="${property}"]`).length > 0) {
      $(`meta[property="${property}"]`).attr('content', content);
    } else {
      $('head').append(`<meta property="${property}" content="${content}">`);
    }
  };

  const setNameMeta = (name: string, content: string) => {
    if ($(`meta[name="${name}"]`).length > 0) {
      $(`meta[name="${name}"]`).attr('content', content);
    } else {
      $('head').append(`<meta name="${name}" content="${content}">`);
    }
  };

  setMeta('fb:app_id', '1202485368502369');
  setMeta('og:site_name', '乐可开源');
  setMeta('og:type', payload.type);
  setMeta('og:title', safeTitle);
  setMeta('og:description', safeDescription);
  setMeta('og:url', safeUrl);
  setMeta('og:image', safeImage);
  setMeta('og:image:secure_url', safeImage);
  setMeta('og:image:type', imageType(payload.image));
  setMeta('og:image:width', '1200');
  setMeta('og:image:height', '630');

  setNameMeta('twitter:card', 'summary_large_image');
  setNameMeta('twitter:title', safeTitle);
  setNameMeta('twitter:description', safeDescription);
  setNameMeta('twitter:image', safeImage);

  return $.html();
}

function writeRouteHtml(routePath: string, html: string) {
  const route = routePath === '/' ? '' : routePath.replace(/^\/+|\/+$/g, '');
  const outDir = route ? path.join(DIST_DIR, route) : DIST_DIR;
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

async function prerender() {
  console.log('🏗️  Starting SEO Prerendering...');

  // 1. 读取构建好的 index.html 模板
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error('❌ dist/index.html not found. Please run "npm run build" first.');
    process.exit(1);
  }
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');

  // 2. 预渲染静态页面
  const staticPages: Array<{ route: string; title: string; description: string; type: 'website' | 'article' }> = [
    {
      route: '/',
      title: '乐可开源 | AI 与工程实践',
      description: '乐可开源是专注 AI 与工程实践的技术团队，致力于通过前沿人工智能技术与专业工程能力为客户创造价值。',
      type: 'website',
    },
    {
      route: '/services',
      title: '能力与服务 | 乐可开源',
      description: '乐可开源提供从0到1产品工程化、复杂系统重构、AI智能体落地与 OpenClaw 私有化部署服务。',
      type: 'website',
    },
    {
      route: '/products',
      title: '产品与项目 | 乐可开源',
      description: '展示乐可开源自研产品、实验性项目与内部工具，呈现工程方法与技术实践能力。',
      type: 'website',
    },
    {
      route: '/solutions',
      title: '解决方案 | 乐可开源',
      description: '面向企业效率协作、知识管理和自动化场景的定制化解决方案，支持系统集成与数据资产化。',
      type: 'website',
    },
    {
      route: '/about',
      title: '关于我们 | 乐可开源',
      description: '乐可开源是一支专注 AI 与复杂系统工程实践的技术团队，长期深耕定制开发与系统架构。',
      type: 'website',
    },
    {
      route: '/contact',
      title: '联系我们 | 乐可开源',
      description: '如果你有明确业务目标但缺少可靠技术落地团队，欢迎联系乐可开源。',
      type: 'website',
    },
    {
      route: '/news',
      title: '公司动态 | 乐可开源',
      description: '乐可开源的技术动态、里程碑与工程实践更新。',
      type: 'website',
    },
    {
      route: '/privacy',
      title: '隐私政策 - 乐可开源',
      description: '天水乐可信息技术有限公司隐私政策说明。',
      type: 'website',
    },
  ];

  for (const page of staticPages) {
    const html = applyMeta(templateHtml, {
      title: page.title,
      description: page.description,
      image: `${SITE_URL}/og-450x300.png`,
      url: normalizeUrl(page.route),
      type: page.type,
    });
    writeRouteHtml(page.route, html);
    console.log(`✅ Generated SEO page for: ${page.route}`);
  }

  // 3. 扫描所有新闻文章
  const newsFiles = await glob(`${CONTENT_DIR}/*.md`);
  console.log(`📄 Found ${newsFiles.length} news articles.`);

  for (const file of newsFiles) {
    const filename = path.basename(file, '.md');
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);

    const title = data.title ? `${data.title} | 乐可开源` : '乐可开源';
    const summary = Array.isArray(data.summary) ? data.summary.join(' ') : data.summary;
    const description = summary || data.description || '专注 AI 与工程实践';
    const image = normalizeImage(data.cover);
    const route = `/news/${filename}`;

    const html = applyMeta(templateHtml, {
      title,
      description,
      image,
      url: normalizeUrl(route),
      type: 'article',
    });

    writeRouteHtml(route, html);
    console.log(`✅ Generated SEO page for: ${filename}`);
  }

  // 4. 扫描所有项目文章
  const projectFiles = await glob(`${PROJECTS_DIR}/*.md`);
  console.log(`📦 Found ${projectFiles.length} project articles.`);

  for (const file of projectFiles) {
    const filename = path.basename(file, '.md');
    const content = fs.readFileSync(file, 'utf-8');
    const { data } = matter(content);

    const title = data.name ? `${data.name} | 乐可开源` : '乐可开源';
    const description = data.summary || data.description || '乐可开源项目实践';
    const image = normalizeImage(data.cover);
    const route = `/projects/${filename}`;

    const html = applyMeta(templateHtml, {
      title,
      description,
      image,
      url: normalizeUrl(route),
      type: 'article',
    });

    writeRouteHtml(route, html);
    console.log(`✅ Generated SEO page for project: ${filename}`);
  }

  console.log('🎉 Prerendering complete!');
}

prerender().catch(err => {
  console.error(err);
  process.exit(1);
});
