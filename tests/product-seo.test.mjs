import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

import { loadSeoRoutes } from '../scripts/seo-routes.mjs';

async function loadTypeScriptModule(pathname) {
  const source = await readFile(new URL(pathname, import.meta.url), 'utf8');
  const javascript = ts.transpileModule(source.replace("import { SITE_URL } from './site';", "const SITE_URL = 'https://lekeopen.com';"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`);
}

test('product routes are software pages and the embedded app stays out of the sitemap manifest', async () => {
  const routes = await loadSeoRoutes(process.cwd());
  const picker = routes.find((route) => route.path === '/products/leke-picker');
  const guigelei = routes.find((route) => route.path === '/products/guigelei');

  assert.equal(picker?.kind, 'software');
  assert.equal(picker?.software?.operatingSystem, 'Windows 7 SP1, Windows 10, Windows 11, Web');
  assert.equal(guigelei?.kind, 'software');
  assert.equal(guigelei?.software?.operatingSystem, 'macOS 12 or later');
  assert.ok(!routes.some((route) => route.path === '/products/leke-picker/app'));
});

test('runtime structured data emits SoftwareApplication and nested product breadcrumbs', async () => {
  const { buildStructuredData } = await loadTypeScriptModule('../src/seo/structuredData.ts');
  const data = buildStructuredData({
    title: '乐可点名｜课堂随机点名工具',
    description: '课堂随机点名工具',
    canonical: 'https://lekeopen.com/products/leke-picker/',
    image: 'https://lekeopen.com/images/products/leke-picker/og.png',
    kind: 'software',
    software: {
      version: '1.1.0',
      operatingSystem: 'Windows 7 SP1, Windows 10, Windows 11, Web',
      applicationCategory: 'EducationalApplication',
    },
  });

  const software = data['@graph'].find((entry) => entry['@type'] === 'SoftwareApplication');
  assert.equal(software.softwareVersion, '1.1.0');
  assert.equal(software.isAccessibleForFree, true);

  const breadcrumb = data['@graph'].find((entry) => entry['@type'] === 'BreadcrumbList');
  assert.deepEqual(breadcrumb.itemListElement.map((item) => item.name), ['首页', '产品与项目', '乐可点名｜课堂随机点名工具']);
});

test('products index runtime breadcrumb contains no duplicate parent item', async () => {
  const { buildStructuredData } = await loadTypeScriptModule('../src/seo/structuredData.ts');
  const data = buildStructuredData({
    title: '产品与项目 | 乐可开源',
    description: '产品与项目',
    canonical: 'https://lekeopen.com/products/',
    image: 'https://lekeopen.com/og-default.png',
  });

  const breadcrumb = data['@graph'].find((entry) => entry['@type'] === 'BreadcrumbList');
  assert.deepEqual(breadcrumb.itemListElement.map((item) => item.name), ['首页', '产品与项目']);
});
