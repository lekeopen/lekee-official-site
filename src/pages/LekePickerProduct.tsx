import React from 'react';
import { ExternalLink, Monitor, ShieldCheck, Users } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import DownloadSection from '../components/products/DownloadSection';
import ProductFaq from '../components/products/ProductFaq';
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
    <section data-product-hero className="border-b border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-100 py-16 lg:py-20">
      <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">乐可开源出品 · v{product.version}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">乐可点名</h1>
          <p className="mt-5 text-2xl font-semibold text-gray-900">{product.tagline}</p>
          <p className="mt-4 max-w-xl leading-7 text-gray-600">{product.summary}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/products/leke-picker/app/" onClick={() => trackProductEvent('product_leke_picker_online_use')} className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500">立即在线使用</a>
            <a href="#downloads" onClick={() => trackProductEvent('product_leke_picker_download_section')} className="inline-flex min-h-11 items-center rounded-lg border border-blue-300 bg-white px-6 py-3 font-semibold text-blue-800 hover:border-blue-500">下载 Windows 版</a>
          </div>
        </div>
        <div data-product-hero-media className="overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl shadow-blue-900/10">
          <video
            className="aspect-video w-full"
            controls
            playsInline
            preload="metadata"
            poster="/images/products/leke-picker/main.webp"
            aria-label="乐可点名 v1.1 产品演示视频"
          >
            <source
              src="/videos/products/leke-picker/leke-picker-v1.1-horizontal-natural-voice-final.mp4"
              type="video/mp4"
            />
            当前浏览器无法播放视频。你可以
            <a href="/videos/products/leke-picker/leke-picker-v1.1-horizontal-natural-voice-final.mp4">直接打开演示视频</a>。
          </video>
        </div>
      </div>
    </section>

    <section id="quick-start" className="border-b border-gray-200 bg-gray-50 py-14" aria-labelledby="quick-start-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="quick-start-title" className="text-3xl font-bold text-gray-950">30 秒上手</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {['粘贴或导入学生名单', '选择每次抽取人数', '点击“点名”或按空格键'].map((step, index) => (
            <div key={step} className="rounded-xl border border-gray-200 bg-white p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">{index + 1}</span>
              <p className="mt-4 text-lg font-semibold text-gray-950">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

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

    <DownloadSection
      title="Windows 下载"
      intro="选择与系统版本和位数匹配的安装包。安装包均不要求 Node.js、Git 或开发工具。"
      downloads={[...product.downloads]}
      featuredDownloadId="windows-modern-x64"
      legacyDownloadIds={['windows-7-x64', 'windows-7-x86']}
      stats={{
        owner: 'lekeopen',
        repo: 'leke-picker',
        tag: 'v1.1.0',
        allowedAssets: product.downloads.map((download) => download.assetName),
      }}
    />

    <section id="windows-install-help" className="border-t border-gray-200 bg-gray-50 py-16" aria-labelledby="install-help-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="install-help-title" className="text-3xl font-bold text-gray-950">Windows 10/11 安装帮助</h2>
        <p className="mt-4 max-w-3xl leading-7 text-gray-600">安装包暂未代码签名。请只使用本页链接的官方 Release，并在运行前核对文件名、版本和 SHA-256。</p>
        <ol className="mt-8 grid gap-5 md:grid-cols-2">
          {[
            '从上方推荐卡片下载 Windows 10/11 安装包。',
            '核对安装包文件名、版本以及本页公布的 SHA-256。',
            '若 SmartScreen 出现提示，选择“更多信息”，再次确认文件名后选择“仍要运行”。',
            '完成安装后，从 Windows 开始菜单启动乐可点名。',
          ].map((step, index) => <li key={step} className="rounded-xl border border-gray-200 bg-white p-6 leading-7 text-gray-700"><strong className="mr-2 text-blue-700">{index + 1}.</strong>{step}</li>)}
        </ol>
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-6 leading-7 text-blue-950">
          <strong>不需要、也不建议关闭 Windows 安全中心、SmartScreen 或杀毒软件。</strong>
          <p className="mt-2">如果无法确认文件来源或校验结果，请停止安装并联系我们。</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <a href="https://github.com/lekeopen/leke-picker/issues/new" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:text-blue-900">安装遇到问题：提交 GitHub Issue</a>
          <a href="/contact/" className="font-semibold text-blue-700 hover:text-blue-900">没有 GitHub 账号：联系乐可开源</a>
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-500">反馈时请提供 Windows 版本、安装包文件名和错误截图；请勿提交学生名单或其他隐私信息。</p>
      </div>
    </section>

    <section className="border-y border-gray-200 bg-blue-50 py-16">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-950">版本与系统要求</h2>
          <ul className="mt-5 space-y-3 leading-7 text-gray-700">
            <li>当前正式版本：v{product.version}</li>
            <li>Windows 10/11：64 位系统</li>
            <li>Windows 7：必须为 SP1，支持 64 位和 32 位</li>
            <li>在线版：建议使用当前仍受支持的现代浏览器</li>
            <li>Mac、Linux 和平板用户可直接使用在线版；目前不提供 Mac、Linux 或平板安装版</li>
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
      { question: 'Mac、Linux 或平板可以使用吗？', answer: '可以直接使用在线版；目前不提供 Mac、Linux 或平板安装版，在线版需要受支持的现代浏览器。' },
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
