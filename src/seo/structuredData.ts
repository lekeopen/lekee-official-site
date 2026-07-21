import { SITE_URL } from './site';

export interface StructuredDataInput {
  title: string;
  description: string;
  canonical: string;
  image: string;
  kind?: 'page' | 'article' | 'project';
  datePublished?: string;
}

export function buildStructuredData(input: StructuredDataInput) {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization', '@id': organizationId, name: '乐可开源',
      url: `${SITE_URL}/`, logo: `${SITE_URL}/logo.png`,
    },
    {
      '@type': 'WebSite', '@id': websiteId, name: '乐可开源',
      url: `${SITE_URL}/`, publisher: { '@id': organizationId }, inLanguage: 'zh-CN',
    },
    {
      '@type': 'WebPage', '@id': `${input.canonical}#webpage`, url: input.canonical,
      name: input.title, description: input.description, isPartOf: { '@id': websiteId }, inLanguage: 'zh-CN',
    },
  ];

  if (input.kind === 'article') {
    graph.push({
      '@type': 'Article', headline: input.title, description: input.description,
      image: input.image, datePublished: input.datePublished, mainEntityOfPage: input.canonical,
      author: { '@id': organizationId }, publisher: { '@id': organizationId }, inLanguage: 'zh-CN',
    });
  } else if (input.kind === 'project') {
    graph.push({
      '@type': 'CreativeWork', name: input.title, description: input.description,
      image: input.image, url: input.canonical, creator: { '@id': organizationId }, inLanguage: 'zh-CN',
    });
  }

  if (input.canonical !== `${SITE_URL}/`) {
    const segment = new URL(input.canonical).pathname.split('/').filter(Boolean)[0];
    const parent = segment === 'news' ? ['公司动态', `${SITE_URL}/news/`] : segment === 'projects' ? ['产品与项目', `${SITE_URL}/products/`] : null;
    const items = [{ '@type': 'ListItem', position: 1, name: '首页', item: `${SITE_URL}/` }];
    if (parent) items.push({ '@type': 'ListItem', position: 2, name: parent[0], item: parent[1] });
    items.push({ '@type': 'ListItem', position: items.length + 1, name: input.title.replace(/ \| 乐可开源$/, ''), item: input.canonical });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: items });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
