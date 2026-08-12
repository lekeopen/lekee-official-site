import React from 'react';
import { ExternalLink, Monitor, ShieldCheck, Users } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import DownloadSection from '../components/products/DownloadSection';
import ProductFaq from '../components/products/ProductFaq';
import ProductHero from '../components/products/ProductHero';
import { getProduct } from '../products/catalog';
import { trackProductEvent } from '../analytics/productEvents';

const product = getProduct('leke-picker');

const LekePickerProduct: React.FC = () => (
  <div className="bg-white">
    <SEOMeta
      title="乐可点名｜课堂随机点名工具"
      description={product.summary}
      url="/products/leke-picker"
      image={product.cover}
      type="website"
      kind="software"
      software={{
        version: product.version,
        operatingSystem: 'Windows 7 SP1, Windows 10, Windows 11, Web',
        applicationCategory: 'EducationalApplication',
        downloadUrl: product.releaseNotes,
      }}
    />
    <ProductHero
      product={product}
      primaryAction={{ label: '立即在线使用', href: '/products/leke-picker/app/', analyticsEvent: 'product_leke_picker_online_use' }}
      secondaryAction={{ label: '下载 Windows 版', href: '#downloads', analyticsEvent: 'product_leke_picker_download_section' }}
    />

    <section className="py-16" aria-labelledby="picker-value-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="picker-value-title" className="text-3xl font-bold text-gray-950">为课堂保留注意力</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            [Users, '名单清晰可控', '支持粘贴、导入和导出名单；完全重名的学生仍保持独立身份。'],
            [Monitor, '点名过程直观', '每次抽取 1 至 5 人，一轮内不重复，并支持全屏、快捷键和音效。'],
            [ShieldCheck, '数据留在本机', '名单只在当前浏览器或桌面应用中处理，不上传到服务器。'],
          ].map(([Icon, title, description]) => {
            const ValueIcon = Icon as typeof Users;
            return (
              <article key={String(title)} className="rounded-xl border border-gray-200 p-6">
                <ValueIcon className="text-blue-600" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold text-gray-950">{String(title)}</h3>
                <p className="mt-2 leading-7 text-gray-600">{String(description)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    <section className="border-y border-gray-200 bg-gray-50 py-16" aria-labelledby="picker-demo-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 id="picker-demo-title" className="text-3xl font-bold text-gray-950">60 秒了解乐可点名</h2>
          <p className="mt-4 leading-7 text-gray-600">
            从导入名单到随机点名和课堂控制，一段视频看完整使用流程。
          </p>
        </div>
        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-xl">
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
            poster="/images/products/leke-picker/main.webp"
            aria-label="乐可点名 v1.1 产品演示视频"
          >
            <source
              src="/videos/products/leke-picker/leke-picker-v1.1-horizontal-website-final.mp4"
              type="video/mp4"
            />
            当前浏览器无法播放视频。你可以
            <a href="/videos/products/leke-picker/leke-picker-v1.1-horizontal-website-final.mp4">直接打开演示视频</a>。
          </video>
        </div>
      </div>
    </section>

    <DownloadSection
      title="Windows 下载"
      intro="选择与系统版本和位数匹配的安装包。安装包均不要求 Node.js、Git 或开发工具。"
      downloads={[...product.downloads]}
      stats={{
        owner: 'lekeopen',
        repo: 'leke-picker',
        tag: 'v1.1.0',
        allowedAssets: product.downloads.map((download) => download.assetName),
      }}
    />

    <section className="border-y border-gray-200 bg-blue-50 py-16">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-950">版本与系统要求</h2>
          <ul className="mt-5 space-y-3 leading-7 text-gray-700">
            <li>当前正式版本：v{product.version}</li>
            <li>Windows 10/11：64 位系统</li>
            <li>Windows 7：必须为 SP1，支持 64 位和 32 位</li>
            <li>在线版：建议使用当前仍受支持的现代浏览器</li>
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-950">隐私说明</h2>
          <p className="mt-5 leading-7 text-gray-700">
            名单只在本机处理和保存，不会上传到服务器或任何第三方服务。清除浏览器站点数据，或在桌面版卸载时主动选择删除用户数据，会清除已保存名单；请使用 TXT 导出自行备份。
          </p>
        </div>
      </div>
    </section>

    <ProductFaq items={[
      { question: '我应该下载哪个安装包？', answer: 'Windows 10/11 请选择 64 位版本；Windows 7 必须先确认已安装 SP1，再按系统位数选择 x64 或 x86。' },
      { question: '为什么 Windows 提示未知发布者？', answer: 'v1.1.0 的三个安装器尚未代码签名。请只从本页指向的官方 Release 下载，不要为了安装而关闭 SmartScreen、杀毒软件或其他安全保护。' },
      { question: '学生名单会上传吗？', answer: '不会。网页版和桌面版都只在本机处理名单，不要求账号，也不上传学生姓名。' },
      { question: 'Windows 7 版本仍有安全支持吗？', answer: '没有。它只为确有需要的旧电脑提供离线兼容，Windows 7 和内置 Electron 22 运行时都已结束安全维护。' },
    ]} />

    <section className="py-12">
      <div className="container mx-auto flex max-w-6xl flex-wrap gap-4 px-4 sm:px-6 lg:px-8">
        <a href={product.repository} onClick={() => trackProductEvent('product_leke_picker_github')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-semibold text-blue-700 hover:text-blue-900">
          GitHub 源码 <ExternalLink className="ml-1" size={16} aria-hidden="true" />
        </a>
        <a href={product.releaseNotes} onClick={() => trackProductEvent('product_leke_picker_release_notes')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-semibold text-blue-700 hover:text-blue-900">
          v{product.version} 更新记录 <ExternalLink className="ml-1" size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  </div>
);

export default LekePickerProduct;
