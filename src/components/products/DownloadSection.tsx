import React from 'react';
import { Download } from 'lucide-react';
import type { ProductDownload } from '../../products/catalog';
import DownloadStats from './DownloadStats';
import type { ReleaseStatsInput } from '../../products/releaseStats';
import { trackProductEvent } from '../../analytics/productEvents';

const formatSize = (sizeBytes: number) => `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;

interface DownloadSectionProps {
  title: string;
  downloads: ProductDownload[];
  intro: string;
  stats?: ReleaseStatsInput;
  featuredDownloadId?: string;
  legacyDownloadIds?: string[];
  legacyTitle?: string;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({
  title,
  downloads,
  intro,
  stats,
  featuredDownloadId,
  legacyDownloadIds = [],
  legacyTitle = '旧电脑兼容下载',
}) => {
  const legacyIds = new Set(legacyDownloadIds);
  const primaryDownloads = downloads.filter((download) => !legacyIds.has(download.id));
  const legacyDownloads = downloads.filter((download) => legacyIds.has(download.id));

  const renderDownloadCard = (download: ProductDownload, featured = false) => (
    <article
      key={download.id}
      data-download-featured={featured ? download.id : undefined}
      className={`flex min-w-0 flex-col rounded-xl bg-white p-6 shadow-sm ${featured ? 'border-2 border-blue-500 ring-1 ring-blue-500' : 'border border-gray-200'}`}
    >
      {featured && <span className="mb-3 w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">推荐</span>}
      <h3 className="text-lg font-bold text-gray-950">{download.label}</h3>
      <p className="mt-1 text-sm text-gray-500">{download.architecture} · {formatSize(download.sizeBytes)}</p>
      {download.availability === 'available' && download.url ? (
        <div className="mt-5 grid gap-3">
          <a
            href={download.url}
            onClick={() => download.analyticsEvent && trackProductEvent(download.analyticsEvent)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Download className="mr-2" size={18} aria-hidden="true" />
            {featured ? '国内高速下载 · Windows 10/11 版' : '国内高速下载'}
          </a>
          {download.fallbackUrl && (
            <a
              href={download.fallbackUrl}
              onClick={() => download.fallbackAnalyticsEvent && trackProductEvent(download.fallbackAnalyticsEvent)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700"
            >
              GitHub 备用下载
            </a>
          )}
        </div>
      ) : (
        <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-500" aria-disabled="true">即将开放</span>
      )}
      <p className="mt-4 break-all font-mono text-xs leading-5 text-gray-500">SHA-256: {download.sha256}</p>
      {download.warning && <p className="mt-4 text-sm leading-6 text-amber-800">{download.warning}</p>}
    </article>
  );

  return (
  <section id="downloads" className="py-16" aria-labelledby="download-title">
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h2 id="download-title" className="text-3xl font-bold text-gray-950">{title}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-gray-600">{intro}</p>
      <div className={`mt-8 grid gap-5 ${primaryDownloads.length > 1 ? 'lg:grid-cols-3' : 'max-w-xl'}`}>
        {primaryDownloads.map((download) => renderDownloadCard(download, download.id === featuredDownloadId))}
      </div>
      {legacyDownloads.length > 0 && (
        <details data-legacy-downloads className="mt-6 rounded-xl border border-amber-200 bg-amber-50">
          <summary className="cursor-pointer px-6 py-5 font-semibold text-gray-950">{legacyTitle}</summary>
          <div className="border-t border-amber-200 px-6 py-6">
            <p className="max-w-3xl leading-7 text-amber-900">Windows 7 与内置 Electron 22 已结束安全维护，仅供确有需要的旧电脑使用。</p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">{legacyDownloads.map((download) => renderDownloadCard(download))}</div>
          </div>
        </details>
      )}
      {stats && <DownloadStats {...stats} />}
    </div>
  </section>
  );
};

export default DownloadSection;
