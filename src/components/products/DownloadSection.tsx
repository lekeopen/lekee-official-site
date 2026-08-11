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
}

const DownloadSection: React.FC<DownloadSectionProps> = ({ title, downloads, intro, stats }) => (
  <section id="downloads" className="py-16" aria-labelledby="download-title">
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <h2 id="download-title" className="text-3xl font-bold text-gray-950">{title}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-gray-600">{intro}</p>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {downloads.map((download) => (
          <article key={download.id} className="flex min-w-0 flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-950">{download.label}</h3>
            <p className="mt-1 text-sm text-gray-500">{download.architecture} · {formatSize(download.sizeBytes)}</p>
            {download.availability === 'available' && download.url ? (
              <a
                href={download.url}
                onClick={() => download.analyticsEvent && trackProductEvent(download.analyticsEvent)}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                <Download className="mr-2" size={18} aria-hidden="true" />
                下载安装包
              </a>
            ) : (
              <span className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-100 px-4 py-3 font-semibold text-gray-500" aria-disabled="true">
                即将开放
              </span>
            )}
            <p className="mt-4 break-all font-mono text-xs leading-5 text-gray-500">SHA-256: {download.sha256}</p>
            {download.warning && <p className="mt-4 text-sm leading-6 text-amber-800">{download.warning}</p>}
          </article>
        ))}
      </div>
      {stats && <DownloadStats {...stats} />}
    </div>
  </section>
);

export default DownloadSection;
