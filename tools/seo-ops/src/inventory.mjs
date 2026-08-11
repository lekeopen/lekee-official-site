import * as cheerio from 'cheerio';
import { canonicalUrl as routeCanonicalUrl, SITE_URL } from '../../../scripts/seo-routes.mjs';

const STANDARD_URL_CHILDREN = new Set(['loc', 'lastmod', 'changefreq', 'priority']);
const SITEMAP_NAMESPACE = 'http://www.sitemaps.org/schemas/sitemap/0.9';

function sitemapError() {
  return new TypeError('Expected valid sitemap XML with one urlset root and url/loc structure');
}

function assertValidEntities(value) {
  const withoutEntities = value.replace(/&(amp|lt|gt|apos|quot|#\d+|#x[\da-f]+);/gi, '');
  if (withoutEntities.includes('&')) throw sitemapError();
}

function findTagEnd(xml, start) {
  let quote;
  for (let index = start; index < xml.length; index += 1) {
    const character = xml[index];
    if (quote) {
      if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  return -1;
}

function assertValidAttributes(value) {
  let index = 0;
  while (index < value.length) {
    while (/\s/.test(value[index])) index += 1;
    if (index >= value.length) return;

    const name = value.slice(index).match(/^[A-Za-z_][\w:.-]*/)?.[0];
    if (!name) throw sitemapError();
    index += name.length;
    while (/\s/.test(value[index])) index += 1;
    if (value[index] !== '=') throw sitemapError();
    index += 1;
    while (/\s/.test(value[index])) index += 1;
    const quote = value[index];
    if (quote !== '"' && quote !== "'") throw sitemapError();
    const end = value.indexOf(quote, index + 1);
    if (end < 0) throw sitemapError();
    assertValidEntities(value.slice(index + 1, end));
    index = end + 1;
  }
}

function assertWellFormedXml(xml) {
  if (typeof xml !== 'string' || xml.trim().length === 0) throw sitemapError();
  const stack = [];
  let rootName;
  let seenXmlDeclaration = false;
  let index = 0;

  while (index < xml.length) {
    const open = xml.indexOf('<', index);
    const text = open < 0 ? xml.slice(index) : xml.slice(index, open);
    assertValidEntities(text);
    if (stack.length === 0 && text.trim()) throw sitemapError();
    if (open < 0) break;

    if (xml.startsWith('<!--', open)) {
      const end = xml.indexOf('-->', open + 4);
      if (end < 0) throw sitemapError();
      index = end + 3;
      continue;
    }
    if (xml.startsWith('<![CDATA[', open)) {
      if (stack.length === 0) throw sitemapError();
      const parentName = String(stack.at(-1)).split(':').at(-1);
      if (parentName === 'urlset' || parentName === 'url') throw sitemapError();
      const end = xml.indexOf(']]>', open + 9);
      if (end < 0) throw sitemapError();
      index = end + 3;
      continue;
    }
    if (xml.startsWith('<?', open)) {
      const end = xml.indexOf('?>', open + 2);
      if (end < 0) throw sitemapError();
      const instruction = xml.slice(open + 2, end).trim();
      const target = instruction.match(/^([A-Za-z_][\w:.-]*)/)?.[1];
      if (!target) throw sitemapError();
      if (target.toLowerCase() === 'xml') {
        const declarationOffset = xml.charCodeAt(0) === 0xFEFF ? 1 : 0;
        if (target !== 'xml' || seenXmlDeclaration || rootName !== undefined
          || stack.length > 0 || open !== declarationOffset) throw sitemapError();
        assertValidAttributes(instruction.slice(target.length));
        seenXmlDeclaration = true;
      } else if (stack.length > 0) {
        throw sitemapError();
      }
      index = end + 2;
      continue;
    }
    if (xml.startsWith('<!', open)) throw sitemapError();

    const end = findTagEnd(xml, open + 1);
    if (end < 0) throw sitemapError();
    const rawTag = xml.slice(open + 1, end);
    if (rawTag.startsWith('/')) {
      const match = rawTag.match(/^\/\s*([A-Za-z_][\w:.-]*)\s*$/);
      if (!match || stack.pop() !== match[1]) throw sitemapError();
      index = end + 1;
      continue;
    }

    const selfClosing = /\/\s*$/.test(rawTag);
    const opening = selfClosing ? rawTag.replace(/\/\s*$/, '') : rawTag;
    const name = opening.match(/^\s*([A-Za-z_][\w:.-]*)/)?.[1];
    if (!name) throw sitemapError();
    const nameEnd = opening.indexOf(name) + name.length;
    assertValidAttributes(opening.slice(nameEnd));

    if (stack.length === 0) {
      if (rootName !== undefined) throw sitemapError();
      rootName = name;
    }
    if (!selfClosing) stack.push(name);
    index = end + 1;
  }

  if (stack.length !== 0 || rootName === undefined) throw sitemapError();
}

function elementChildren(element) {
  return (element?.children || []).filter((child) => child.type === 'tag');
}

function hasUnexpectedText(element) {
  return (element?.children || []).some((child) => (
    child.type === 'text' && String(child.data || '').trim().length > 0
  ));
}

function localName(element) {
  return String(element?.name || '').split(':').at(-1);
}

function namespaceUri($, element) {
  const name = String(element?.name || '');
  const separator = name.indexOf(':');
  const attribute = separator < 0 ? 'xmlns' : `xmlns:${name.slice(0, separator)}`;
  let current = element;
  while (current?.type === 'tag') {
    const value = $(current).attr(attribute);
    if (value !== undefined) return value;
    current = current.parent;
  }
  return null;
}

function sitemapLocations(xml) {
  assertWellFormedXml(xml);
  const $ = cheerio.load(xml, { xmlMode: true });
  const roots = $.root().children().toArray().filter((child) => child.type === 'tag');
  if (roots.length !== 1 || localName(roots[0]) !== 'urlset') throw sitemapError();
  const sitemapNamespace = namespaceUri($, roots[0]);
  if (sitemapNamespace !== SITEMAP_NAMESPACE) throw sitemapError();
  if (hasUnexpectedText(roots[0])) throw sitemapError();

  const urlElements = elementChildren(roots[0]);
  if (urlElements.some((element) => localName(element) !== 'url')) throw sitemapError();
  if (urlElements.some((element) => namespaceUri($, element) !== sitemapNamespace)) throw sitemapError();

  return urlElements.map((urlElement) => {
    const children = elementChildren(urlElement);
    if (hasUnexpectedText(urlElement)) throw sitemapError();
    const locations = children.filter((element) => localName(element) === 'loc');
    if (locations.length !== 1 || elementChildren(locations[0]).length > 0
      || $(locations[0]).text().trim().length === 0) throw sitemapError();
    if (namespaceUri($, locations[0]) !== sitemapNamespace) throw sitemapError();
    if (children.some((element) => (
      !String(element.name).includes(':') && !STANDARD_URL_CHILDREN.has(localName(element))
    ))) throw sitemapError();
    return $(locations[0]).text().trim();
  });
}

function canonicalUrl(value) {
  if (typeof value !== 'string') return null;

  try {
    const url = new URL(value);
    if (url.origin !== SITE_URL || url.username || url.password || url.search) return null;
    return routeCanonicalUrl(url.pathname);
  } catch {
    return null;
  }
}

function normalizedUrls(urls) {
  return [...new Set(urls.map(canonicalUrl).filter(Boolean))].sort();
}

export function canonicalUrls(routes) {
  return normalizedUrls(routes.map((route) => route.canonical));
}

export function parseSitemap(xml) {
  return normalizedUrls(sitemapLocations(xml));
}

export function notificationDelta(currentUrls, successfulUrls) {
  const successful = new Set(normalizedUrls(successfulUrls));
  return normalizedUrls(currentUrls).filter((url) => !successful.has(url));
}
