import React, { useEffect, useState } from 'react';
import { fetchReleaseDownloadStats, type ReleaseStatsInput } from '../../products/releaseStats';

interface DownloadStatsProps extends ReleaseStatsInput {
  label?: string;
}

type ViewState =
  | { status: 'loading' }
  | { status: 'ready'; total: number; fetchedAt: string }
  | { status: 'unavailable' };

const DownloadStats: React.FC<DownloadStatsProps> = ({ label = '正式安装包累计下载', owner, repo, tag, allowedAssets }) => {
  const [state, setState] = useState<ViewState>({ status: 'loading' });
  const allowedAssetsKey = allowedAssets.join('\n');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetchReleaseDownloadStats({ owner, repo, tag, allowedAssets: allowedAssetsKey.split('\n') }, fetch, controller.signal)
      .then((stats) => {
        if (active) setState({ status: 'ready', total: stats.total, fetchedAt: stats.fetchedAt });
      })
      .catch(() => {
        if (active) setState({ status: 'unavailable' });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [owner, repo, tag, allowedAssetsKey]);

  if (state.status !== 'ready') return null;

  return (
    <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600" aria-live="polite">
      <strong className="text-gray-950">{label}：{state.total.toLocaleString('zh-CN')}</strong>
      <span className="ml-2">查询于 {new Date(state.fetchedAt).toLocaleString('zh-CN')}</span>
    </div>
  );
};

export default DownloadStats;
