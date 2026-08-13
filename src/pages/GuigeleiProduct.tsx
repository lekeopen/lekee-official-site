import React from 'react';
import { ExternalLink, Eye, RotateCcw, ShieldCheck } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import DownloadSection from '../components/products/DownloadSection';
import ProductFaq from '../components/products/ProductFaq';
import ProductGallery from '../components/products/ProductGallery';
import ProductHero from '../components/products/ProductHero';
import { getProduct } from '../products/catalog';
import { trackProductEvent } from '../analytics/productEvents';

const product = getProduct('guigelei');
const hasMac = product.downloads.some(({ id }) => id === 'macos-arm64');
const hasWindows = product.downloads.some(({ id }) => id === 'windows-x64');
const operatingSystem = [hasMac && `macOS ${product.minimumSystems?.macos} or later`, hasWindows && `Windows ${product.minimumSystems?.windows}`].filter(Boolean).join(', ');

const GuigeleiProduct: React.FC = () => (
  <div className="bg-white">
    <SEOMeta
      title="归个类｜本地文件整理工具"
      description={product.summary}
      url="/products/guigelei"
      image={product.cover}
      type="website"
      kind="software"
      software={{
        version: product.version,
        operatingSystem,
        applicationCategory: 'UtilitiesApplication',
      }}
    />
    <ProductHero
      product={product}
      primaryAction={{ label: '下载正式版', href: '#downloads', analyticsEvent: 'product_guigelei_download_section' }}
    />

    <section className="py-16" aria-labelledby="guigelei-value-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="guigelei-value-title" className="text-3xl font-bold text-gray-950">整理之前，先让每一步可见</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            [Eye, '先预览再整理', '扫描完成后展示分类、目标路径、匹配原因和重名冲突，确认后才执行移动。'],
            [ShieldCheck, '安全边界明确', '不读取文件正文，不上传文件；重名自动处理，应用包和空目录需要额外确认。'],
            [RotateCcw, '本批次可撤销', '每次整理记录移动结果，支持恢复文件和本批次清理的空目录。'],
          ].map(([Icon, title, description]) => {
            const ValueIcon = Icon as typeof Eye;
            return (
              <article key={String(title)} className="rounded-xl border border-gray-200 p-6">
                <ValueIcon className="text-emerald-600" aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold text-gray-950">{String(title)}</h3>
                <p className="mt-2 leading-7 text-gray-600">{String(description)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    <section className="border-y border-gray-200 bg-emerald-50 py-12" aria-labelledby="workflow-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="workflow-title" className="text-3xl font-bold text-gray-950">安全整理流程</h2>
        <p className="mt-5 break-words text-lg leading-8 text-gray-700">选择文件夹 → 扫描 → 预览与调整 → 人工确认 → 移动 → 查看结果 → 可撤销</p>
      </div>
    </section>

    <ProductGallery items={[
      { title: '整理工作台', description: '从选择文件夹、选择方案到确认操作，完整流程保持在同一工作台。', image: '/images/products/guigelei/overview.webp', alt: '归个类 v1.5 整理工作台界面' },
      { title: '内置整理方案', description: '可按类型、时间或项目整理，也能从内置方案复制后继续编辑。', image: '/images/products/guigelei/plans.webp', alt: '归个类 v1.5 内置整理方案界面' },
      { title: '自定义方案', description: '复制内置方案为“我的方案”，再按实际目录规则调整并复用。', image: '/images/products/guigelei/customize.webp', alt: '归个类 v1.5 自定义方案入口界面' },
      { title: '操作与恢复', description: '整理、撤销上次整理和恢复上次空目录清理均提供独立入口。', image: '/images/products/guigelei/actions.webp', alt: '归个类 v1.5 操作与恢复界面' },
    ]} />

    <DownloadSection
      title="下载安装包"
      intro={`当前正式版本为 v${product.version}。请选择对应平台，从官方 Release 下载并核对 SHA-256。`}
      downloads={[...product.downloads]}
      stats={{
        owner: 'lekeopen',
        repo: 'guigelei-releases',
        tag: `v${product.version}`,
        allowedAssets: product.downloads.map((download) => download.assetName),
      }}
    />

    <section className="border-y border-gray-200 py-16">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-950">版本与系统要求</h2>
          <ul className="mt-5 space-y-3 leading-7 text-gray-700">
            <li>当前正式版本：v{product.version}</li>
            {hasMac && <li>macOS {product.minimumSystems?.macos} 或更高版本；Apple Silicon（M1/M2/M3/M4）</li>}
            {hasWindows && <li>Windows {product.minimumSystems?.windows}；x64</li>}
            {hasMac && <li>当前不支持 Intel Mac</li>}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-950">隐私与文件安全</h2>
          <p className="mt-5 leading-7 text-gray-700">
            归个类完全在本地运行，不上传文件、不读取文件正文，也不使用云端 AI。应用只在你确认后移动所选项目；空目录清理默认不执行，操作前会再次确认并检查目录仍为空。
          </p>
        </div>
      </div>
    </section>

    <ProductFaq items={[
      { question: '为什么 macOS 会阻止首次打开？', answer: '当前 DMG 尚未使用 Apple Developer ID 签名，也未经过 Apple 公证。请只从乐可开源官方 Release 下载，核对 SHA-256 后在 Finder 中选择“打开”，并按系统提示人工确认；不要关闭 Gatekeeper。' },
      { question: '应用会读取或上传文件内容吗？', answer: '不会。分类依据扩展名和文件元数据，不读取文件正文，也不向服务器或第三方上传文件。' },
      { question: '会不会覆盖或删除我的文件？', answer: '移动遇到同名时会自动增加序号，不覆盖原文件。空目录清理是独立、默认关闭且需要二次确认的操作，不会递归删除目录内容。' },
      { question: 'Intel Mac 或 Windows 可以使用吗？', answer: hasWindows ? `当前 v${product.version} 支持 Apple Silicon Mac 和 Windows x64，暂不支持 Intel Mac。` : `当前 v${product.version} 只支持 Apple Silicon Mac，Intel Mac 和 Windows 暂不支持。` },
    ]} />

    <section className="py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <a href={product.releaseNotes} onClick={() => trackProductEvent('product_guigelei_release_notes')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-semibold text-blue-700 hover:text-blue-900">
          v{product.version} 更新记录 <ExternalLink className="ml-1" size={16} aria-hidden="true" />
        </a>
      </div>
    </section>
  </div>
);

export default GuigeleiProduct;
