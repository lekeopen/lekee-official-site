import { ExternalLink, MapPin } from 'lucide-react';

const OFFICE_ADDRESS = '天水市秦州区安居小区 E 区';
const AMAP_LINK = `https://uri.amap.com/search?keyword=${encodeURIComponent(OFFICE_ADDRESS)}&view=map&src=lekeopen`;

const OfficeMap = () => (
  <section className="mt-12 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-gray-900">办公位置</h2>
          <p className="mt-1 text-sm text-gray-600 sm:text-base">{OFFICE_ADDRESS}</p>
        </div>
      </div>
      <a href={AMAP_LINK} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline sm:self-auto">
        在高德地图中打开
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>

    <div className="h-[280px] border-t border-gray-100 bg-gray-100 md:h-[360px]">
      <img
        src="/images/office-map.webp"
        alt={`天水市秦州区安居小区 E 区位置地图`}
        loading="lazy"
        width="1200"
        height="420"
        className="h-full w-full object-cover"
      />
    </div>
  </section>
);

export default OfficeMap;
