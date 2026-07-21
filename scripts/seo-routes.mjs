import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import matter from 'gray-matter';

export const SITE_URL = 'https://lekeopen.com';
export const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

export function canonicalUrl(pathname) {
  const route = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (route === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${route.replace(/\/+$/, '')}/`;
}

function imageUrl(image) {
  if (!image || /\.svg($|\?)/i.test(image)) return DEFAULT_IMAGE;
  return image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
}

const staticRoutes = [
  ['/', '首页', '乐可开源 | AI 与工程实践', '乐可开源是专注 AI 与工程实践的技术团队，致力于通过前沿人工智能技术与专业工程能力为客户创造价值。'],
  ['/services', '能力与服务', '能力与服务 | 乐可开源', '乐可开源提供从0到1产品工程化、复杂系统重构、AI智能体落地与 OpenClaw 私有化部署服务。'],
  ['/products', '产品与项目', '产品与项目 | 乐可开源', '展示乐可开源自研产品、实验性项目与内部工具，呈现工程方法与技术实践能力。'],
  ['/solutions', '解决方案', '解决方案 | 乐可开源', '面向企业效率协作、知识管理和自动化场景的定制化解决方案，支持系统集成与数据资产化。'],
  ['/about', '关于我们', '关于我们 | 乐可开源', '乐可开源是一支专注 AI 与复杂系统工程实践的技术团队，长期深耕定制开发与系统架构。'],
  ['/contact', '联系我们', '联系我们 | 乐可开源', '如果你有明确业务目标但缺少可靠技术落地团队，欢迎联系乐可开源。'],
  ['/news', '公司动态', '公司动态 | 乐可开源', '乐可开源的技术动态、里程碑与工程实践更新。'],
  ['/privacy', '隐私政策', '隐私政策 | 乐可开源', '天水乐可信息技术有限公司隐私政策说明。'],
];

function baseRoute(pathname, label, title, description) {
  return {
    path: pathname,
    kind: 'page',
    label,
    title,
    description,
    image: DEFAULT_IMAGE,
    canonical: canonicalUrl(pathname),
    breadcrumbs: pathname === '/' ? [] : [{ name: '首页', url: canonicalUrl('/') }, { name: label, url: canonicalUrl(pathname) }],
  };
}

export async function loadSeoRoutes(rootDir = process.cwd()) {
  const routes = staticRoutes.map((route) => baseRoute(...route));
  const newsFiles = await glob(path.join(rootDir, 'content/news/*.md'));
  const projectFiles = await glob(path.join(rootDir, 'content/projects/*.md'));

  for (const file of newsFiles.sort()) {
    const { data } = matter(await readFile(file, 'utf8'));
    if (data.status !== 'published') continue;
    const id = path.basename(file, '.md');
    const pathname = `/news/${id}`;
    const description = Array.isArray(data.summary) ? data.summary.join(' ') : data.summary;
    routes.push({
      path: pathname, kind: 'article', label: data.title, title: `${data.title} | 乐可开源`,
      description, image: imageUrl(data.cover), canonical: canonicalUrl(pathname), date: data.date,
      breadcrumbs: [{ name: '首页', url: canonicalUrl('/') }, { name: '公司动态', url: canonicalUrl('/news') }, { name: data.title, url: canonicalUrl(pathname) }],
    });
  }

  for (const file of projectFiles.sort()) {
    const { data } = matter(await readFile(file, 'utf8'));
    if (data.publishStatus !== 'published') continue;
    const id = path.basename(file, '.md');
    const pathname = `/projects/${id}`;
    routes.push({
      path: pathname, kind: 'project', label: data.name, title: `${data.name} | 乐可开源`,
      description: data.summary, image: imageUrl(data.cover), canonical: canonicalUrl(pathname),
      breadcrumbs: [{ name: '首页', url: canonicalUrl('/') }, { name: '产品与项目', url: canonicalUrl('/products') }, { name: data.name, url: canonicalUrl(pathname) }],
    });
  }

  return routes;
}
