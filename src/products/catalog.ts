export type ProductSlug = 'leke-picker' | 'guigelei';
export type DownloadAvailability = 'available' | 'pending';
import type { ProductEventName } from '../analytics/productEvents';

export interface ProductDownload {
  id: string;
  label: string;
  platform: string;
  architecture: string;
  availability: DownloadAvailability;
  assetName: string;
  url?: string;
  sha256: string;
  sizeBytes: number;
  warning?: string;
  analyticsEvent?: ProductEventName;
}

export interface ProductDefinition {
  slug: ProductSlug;
  name: string;
  tagline: string;
  summary: string;
  version: string;
  platforms: string[];
  cover: string;
  downloads: ProductDownload[];
  repository?: string;
  releaseNotes: string;
}

export const PRODUCTS: readonly ProductDefinition[] = [
  {
    slug: 'leke-picker',
    name: '乐可点名',
    tagline: '点名更轻松，课堂更专注',
    summary: '面向课堂的本地优先随机点名工具，支持一轮内不重复、多人抽取、名单导入导出和全屏展示。',
    version: '1.1.0',
    platforms: ['在线版', 'Windows 10/11', 'Windows 7 SP1'],
    cover: '/images/products/leke-picker/og.png',
    repository: 'https://github.com/lekeopen/leke-picker',
    releaseNotes: 'https://github.com/lekeopen/leke-picker/releases/tag/v1.1.0',
    downloads: [
      {
        id: 'windows-modern-x64',
        label: 'Windows 10/11 64 位',
        platform: 'Windows 10/11',
        architecture: 'x64',
        availability: 'available',
        assetName: 'leke-picker_1.1.0_x64-setup.exe',
        url: 'https://github.com/lekeopen/leke-picker/releases/download/v1.1.0/leke-picker_1.1.0_x64-setup.exe',
        sha256: '72681a950ee190d9d97c836ad0d1e950c3475554f4d625c595660d256a87b44c',
        sizeBytes: 214599979,
        warning: '安装包尚未进行代码签名，Windows 可能显示未知发布者提示。',
        analyticsEvent: 'product_leke_picker_download_modern',
      },
      {
        id: 'windows-7-x64',
        label: 'Windows 7 SP1 64 位',
        platform: 'Windows 7 SP1',
        architecture: 'x64',
        availability: 'available',
        assetName: 'leke-picker-Win7-x64-Offline.exe',
        url: 'https://github.com/lekeopen/leke-picker/releases/download/v1.1.0/leke-picker-Win7-x64-Offline.exe',
        sha256: 'b729fd01a9d2ae8dbb916e787c3a566a9376120e5564938728e6af1b00843319',
        sizeBytes: 68383372,
        warning: '仅用于确有需要的旧电脑；Windows 7 与内置 Electron 22 运行时均已结束安全维护。',
        analyticsEvent: 'product_leke_picker_download_win7_x64',
      },
      {
        id: 'windows-7-x86',
        label: 'Windows 7 SP1 32 位',
        platform: 'Windows 7 SP1',
        architecture: 'x86',
        availability: 'available',
        assetName: 'leke-picker-Win7-x86-Offline.exe',
        url: 'https://github.com/lekeopen/leke-picker/releases/download/v1.1.0/leke-picker-Win7-x86-Offline.exe',
        sha256: 'c14ed8a476457a23ecaf4a1490fb7c3c0373f77494269627814d336e646e1380',
        sizeBytes: 64752688,
        warning: '仅用于确有需要的旧电脑；Windows 7 与内置 Electron 22 运行时均已结束安全维护。',
        analyticsEvent: 'product_leke_picker_download_win7_x86',
      },
    ],
  },
  {
    slug: 'guigelei',
    name: '归个类',
    tagline: '文件乱了，归个类',
    summary: '完全在本地运行的文件整理工具，先预览、再确认，支持自定义整理方案、重名保护和一键撤销。',
    version: '1.5.0',
    platforms: ['macOS 12+', 'Apple Silicon'],
    cover: '/images/products/guigelei/og.png',
    releaseNotes: 'https://github.com/lekeopen/guigelei-releases/releases/tag/v1.5.0',
    downloads: [
      {
        id: 'macos-arm64',
        label: 'macOS Apple Silicon',
        platform: 'macOS 12+',
        architecture: 'arm64',
        availability: 'available',
        assetName: 'guigelei-1.5.0-arm64.dmg',
        url: 'https://github.com/lekeopen/guigelei-releases/releases/download/v1.5.0/guigelei-1.5.0-arm64.dmg',
        sha256: '655daf297121b2fcff8ef56c25e7745c41a381667d58728e87abdd4a2a83834a',
        sizeBytes: 120968070,
        warning: '当前 DMG 尚未使用 Apple Developer ID 签名，也未经过 Apple 公证；请核对 SHA-256，并按 macOS 提示人工允许打开。',
        analyticsEvent: 'product_guigelei_download_macos',
      },
    ],
  },
] as const;

export function getProduct(slug: ProductSlug): ProductDefinition {
  const product = PRODUCTS.find((item) => item.slug === slug);
  if (!product) throw new Error(`Unknown product: ${slug}`);
  return product;
}

export function validateProductCatalog(products: readonly ProductDefinition[]): string[] {
  const errors: string[] = [];
  const slugs = new Set<string>();

  for (const product of products) {
    if (slugs.has(product.slug)) errors.push(`${product.slug}: duplicate product slug`);
    slugs.add(product.slug);

    const downloadIds = new Set<string>();
    for (const download of product.downloads) {
      const prefix = `${product.slug}/${download.id}`;
      if (downloadIds.has(download.id)) {
        errors.push(`${product.slug}: duplicate download id "${download.id}"`);
      }
      downloadIds.add(download.id);

      if (download.availability === 'available') {
        try {
          if (!download.url || new URL(download.url).protocol !== 'https:') throw new Error();
        } catch {
          errors.push(`${prefix}: available download requires an HTTPS url`);
        }
      } else if (download.url !== undefined) {
        errors.push(`${prefix}: pending download must not expose a url`);
      }

      if (!/^[a-f0-9]{64}$/.test(download.sha256)) {
        errors.push(`${prefix}: sha256 must be 64 lowercase hexadecimal characters`);
      }
      if (!Number.isSafeInteger(download.sizeBytes) || download.sizeBytes <= 0) {
        errors.push(`${prefix}: sizeBytes must be a positive safe integer`);
      }
    }
  }

  return errors;
}
