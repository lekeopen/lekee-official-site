export type ProductSlug = 'leke-picker' | 'guigelei';
export type DownloadAvailability = 'available' | 'pending';
import type { ProductEventName } from '../analytics/productEvents';
import releaseData from './releases.json';

const pickerRelease = releaseData['leke-picker'];
const guigeleiRelease = releaseData.guigelei;

export interface ProductDownload {
  id: string;
  label: string;
  platform: string;
  architecture: string;
  availability: DownloadAvailability;
  assetName: string;
  url?: string;
  fallbackUrl?: string;
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
  minimumSystems?: Record<string, string>;
}

const guigeleiDownloadDefinitions = {
  'macos-arm64': {
    label: 'macOS Apple Silicon', platform: 'macOS', architecture: 'arm64',
    warning: '当前 DMG 尚未使用 Apple Developer ID 签名，也未经过 Apple 公证；请核对 SHA-256，并按 macOS 提示人工允许打开。',
    analyticsEvent: 'product_guigelei_download_macos' as ProductEventName,
  },
  'windows-x64': {
    label: 'Windows 64 位', platform: 'Windows', architecture: 'x64',
    warning: '安装包如未进行代码签名，Windows 可能显示未知发布者提示；请核对 SHA-256。',
    analyticsEvent: 'product_guigelei_download_windows' as ProductEventName,
  },
} as const;

const guigeleiAssets = guigeleiRelease.assets as Record<string, { name: string; url: string; sha256: string; sizeBytes: number }>;
const guigeleiMinimumSystems = ('minimumSystems' in guigeleiRelease ? guigeleiRelease.minimumSystems : { macos: '12.0' }) as Record<string, string>;
const guigeleiDownloads: ProductDownload[] = Object.keys(guigeleiDownloadDefinitions)
  .filter((id) => id in guigeleiAssets)
  .map((id) => {
    const definition = guigeleiDownloadDefinitions[id as keyof typeof guigeleiDownloadDefinitions];
    const asset = guigeleiAssets[id];
    return {
      id,
      ...definition,
      availability: 'available',
      assetName: asset.name,
      url: `https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com/guigelei/${guigeleiRelease.version}/${encodeURIComponent(asset.name)}`,
      fallbackUrl: asset.url,
      sha256: asset.sha256,
      sizeBytes: asset.sizeBytes,
    };
  });

export const PRODUCTS: readonly ProductDefinition[] = [
  {
    slug: 'leke-picker',
    name: '乐可点名',
    tagline: '点名更轻松，课堂更专注',
    summary: '面向课堂的本地优先随机点名工具，支持一轮内不重复、多人抽取、名单导入导出和全屏展示。',
    version: pickerRelease.version,
    platforms: ['在线版', 'Windows 10/11', 'Windows 7 SP1'],
    cover: '/images/products/leke-picker/og.png',
    repository: 'https://github.com/lekeopen/leke-picker',
    releaseNotes: pickerRelease.releaseUrl,
    downloads: [
      {
        id: 'windows-modern-x64',
        label: 'Windows 10/11 64 位',
        platform: 'Windows 10/11',
        architecture: 'x64',
        availability: 'available',
        assetName: pickerRelease.assets['windows-modern-x64'].name,
        url: `https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com/leke-picker/${pickerRelease.version}/${encodeURIComponent(pickerRelease.assets['windows-modern-x64'].name)}`,
        fallbackUrl: pickerRelease.assets['windows-modern-x64'].url,
        sha256: pickerRelease.assets['windows-modern-x64'].sha256,
        sizeBytes: pickerRelease.assets['windows-modern-x64'].sizeBytes,
        warning: '安装包尚未进行代码签名，Windows 可能显示未知发布者提示。',
        analyticsEvent: 'product_leke_picker_download_modern',
      },
      {
        id: 'windows-7-x64',
        label: 'Windows 7 SP1 64 位',
        platform: 'Windows 7 SP1',
        architecture: 'x64',
        availability: 'available',
        assetName: pickerRelease.assets['windows-7-x64'].name,
        url: `https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com/leke-picker/${pickerRelease.version}/${encodeURIComponent(pickerRelease.assets['windows-7-x64'].name)}`,
        fallbackUrl: pickerRelease.assets['windows-7-x64'].url,
        sha256: pickerRelease.assets['windows-7-x64'].sha256,
        sizeBytes: pickerRelease.assets['windows-7-x64'].sizeBytes,
        warning: '仅用于确有需要的旧电脑；Windows 7 与内置 Electron 22 运行时均已结束安全维护。',
        analyticsEvent: 'product_leke_picker_download_win7_x64',
      },
      {
        id: 'windows-7-x86',
        label: 'Windows 7 SP1 32 位',
        platform: 'Windows 7 SP1',
        architecture: 'x86',
        availability: 'available',
        assetName: pickerRelease.assets['windows-7-x86'].name,
        url: `https://lekeopen-downloads.oss-cn-beijing.aliyuncs.com/leke-picker/${pickerRelease.version}/${encodeURIComponent(pickerRelease.assets['windows-7-x86'].name)}`,
        fallbackUrl: pickerRelease.assets['windows-7-x86'].url,
        sha256: pickerRelease.assets['windows-7-x86'].sha256,
        sizeBytes: pickerRelease.assets['windows-7-x86'].sizeBytes,
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
    version: guigeleiRelease.version,
    platforms: [
      ...(guigeleiAssets['macos-arm64'] ? [`macOS ${guigeleiMinimumSystems.macos}+`, 'Apple Silicon'] : []),
      ...(guigeleiAssets['windows-x64'] ? [`Windows ${guigeleiMinimumSystems.windows}`, 'Windows x64'] : []),
    ],
    cover: '/images/products/guigelei/og.png',
    releaseNotes: guigeleiRelease.releaseUrl,
    minimumSystems: guigeleiMinimumSystems,
    downloads: guigeleiDownloads,
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
        if (download.fallbackUrl !== undefined) {
          try {
            if (new URL(download.fallbackUrl).protocol !== 'https:') throw new Error();
          } catch {
            errors.push(`${prefix}: fallbackUrl must use HTTPS`);
          }
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
