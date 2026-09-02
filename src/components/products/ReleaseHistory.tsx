import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { ProductRelease } from '../../products/catalog';

interface ReleaseHistoryProps {
  releases: ProductRelease[];
  limit?: number;
}

const formatPublishedDate = (publishedAt: string) => new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'Asia/Shanghai',
}).format(new Date(publishedAt));

const ReleaseHistory: React.FC<ReleaseHistoryProps> = ({ releases, limit = 3 }) => {
  const visibleReleases = releases.slice(0, limit);
  if (visibleReleases.length === 0) return null;

  return (
    <section data-release-history className="border-t border-gray-200 bg-gray-50 py-14" aria-labelledby="release-history-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="release-history-title" className="text-3xl font-bold text-gray-950">版本记录</h2>
        <p className="mt-3 max-w-3xl leading-7 text-gray-600">官网展示当前版本和最近的稳定版本；完整发行历史及附件以 GitHub Releases 为准。</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {visibleReleases.map((release, index) => (
            <article key={release.tag} data-release={release.tag} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-gray-950">v{release.version}</h3>
                {index === 0 && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">当前版本</span>}
              </div>
              <p className="mt-3 text-sm text-gray-500">发布于 {formatPublishedDate(release.publishedAt)}</p>
              <a href={release.releaseUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center font-semibold text-blue-700 hover:text-blue-900">
                查看更新记录 <ExternalLink className="ml-1" size={15} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReleaseHistory;
