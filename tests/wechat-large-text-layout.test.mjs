import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('viewport supports safe areas without disabling zoom', async () => {
  const html = await read('index.html');

  assert.match(html, /width=device-width, initial-scale=1(?:\.0)?, viewport-fit=cover/);
  assert.doesNotMatch(html, /user-scalable\s*=\s*no/i);
  assert.doesNotMatch(html, /maximum-scale\s*=\s*1/i);
});

test('text containers grow and summary clamping is desktop-only', async () => {
  const solutions = await read('src/pages/Solutions.tsx');
  const news = await read('src/pages/News.tsx');
  const home = await read('src/pages/Home.tsx');

  assert.match(solutions, /text-sm mb-4 min-h-10/);
  assert.doesNotMatch(solutions, /text-sm mb-4 h-10/);
  assert.match(news, /line-clamp-none md:line-clamp-2/);
  assert.match(home, /line-clamp-none md:line-clamp-2/);
  assert.match(home, /Technical Updates \*\/}[\s\S]*?<section className="container mx-auto px-4 sm:px-6 lg:px-8 overflow-x-clip">/);
});

test('compact rows wrap and long contact text can shrink safely', async () => {
  const project = await read('src/pages/ProjectDetail.tsx');
  const newsDetail = await read('src/pages/NewsDetail.tsx');
  const services = await read('src/pages/Services.tsx');
  const contact = await read('src/pages/Contact.tsx');
  const footer = await read('src/components/layout/Footer.tsx');

  assert.match(project, /flex flex-wrap items-center gap-x-3 gap-y-2 mb-4/);
  assert.match(newsDetail, /flex flex-wrap items-center gap-x-4 gap-y-2 mb-6/);
  assert.match(services, /flex flex-wrap items-center gap-3 mb-1/);
  assert.match(contact, /className="min-w-0"/);
  assert.match(contact, /break-all/);
  assert.match(footer, /flex flex-wrap items-center justify-center gap-x-4 gap-y-2/);
});
