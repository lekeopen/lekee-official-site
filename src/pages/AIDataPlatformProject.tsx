import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Eye,
  FileCheck2,
  Files,
  FileSearch,
  HardDrive,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  WifiOff,
} from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';

const description = 'AI Data Platform 把散落在 Excel、Word、PDF 和图片中的业务资料，整理成可审核、可查询、可追溯的可信数据。';
const imageRoot = '/images/projects/ai-data-platform';

const painPoints = [
  ['资料散落', 'Excel、Word、PDF 和图片分散在不同人员、电脑与目录中。'],
  ['统计耗时', '临时统计需要多人反复查找、核对和汇总。'],
  ['口径不一', '同一设备在不同资料中的名称、数量和状态可能不一致。'],
  ['回答无据', '只给结论而没有原始资料依据，难以审核和确认。'],
];

const workflow = [
  [Files, '原始资料'],
  [Sparkles, 'AI 提取'],
  [UserCheck, '人工审核'],
  [Database, '可信台账'],
  [Search, '智能查询'],
  [FileSearch, '来源追溯'],
] as const;

const roles = [
  [Building2, '校领导', '快速查看资产总览、校区分布和关键规模数据。'],
  [Search, '信息化负责人', '用自然语言查询资料，并核对每个结果的来源。'],
  [ClipboardCheck, '资产管理员', '管理原始资料、设备台账、候选审核与可信发布。'],
] as const;

const capabilities = [
  [Files, '多格式资料汇集', '统一整理 Excel、Word、PDF 和图片资料。'],
  [Eye, 'Office 原版式查看', '保留 Word、Excel 原文件的版式与上下文。'],
  [FileSearch, '结构化内容查看', '将长文档和表格转换为更容易核对的内容。'],
  [Sparkles, 'AI 提取候选数据', '从原始资料中提取候选字段，等待人工确认。'],
  [UserCheck, '人工审核与发布', '审核通过后，数据才进入可信台账。'],
  [FileCheck2, '查询来源追溯', '从查询结果回到对应原文、原表或原始图片。'],
  [HardDrive, '本地与私有部署', '资料可保留在机构可控的运行环境中。'],
] as const;

const AIDataPlatformProject: React.FC = () => (
  <div className="bg-white">
    <SEOMeta
      title="AI Data Platform | 乐可开源"
      description={description}
      url="/projects/ai-data-platform"
      image={`${imageRoot}/ai-data-platform-og.png`}
      type="article"
      kind="project"
    />

    <header className="border-b border-gray-200 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-700">可信数据治理 · 演示阶段</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl">AI Data Platform</h1>
          <p className="mt-5 text-2xl font-semibold leading-9 text-gray-800">把分散资料变成可信、可查询、可追溯的数据</p>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
            面向学校历史资料整理与数据治理，把散落的表格、文档、PDF 和图片转化为经过人工审核、能够回到原始依据的可信数据。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="https://demo.lekeopen.com"
              className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
            >
              在线体验 <ArrowRight className="ml-2" size={18} aria-hidden="true" />
            </a>
            <a href="#haichuan-demo" className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-800 transition-colors hover:border-blue-400 hover:text-blue-700">
              了解海川 Demo <ArrowRight className="ml-2" size={18} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">公网 Demo 仅提供虚构数据与只读体验，不支持上传、真实审批或发布。</p>
        </div>

        <figure className="overflow-hidden rounded-3xl border border-blue-100 bg-white p-2 shadow-2xl shadow-blue-950/10">
          <img
            src={`${imageRoot}/ai-data-platform-dashboard.png`}
            alt="海川实验学校虚构 Demo 的资产总览，显示 100 台设备和 635,800 元资产"
            className="h-auto w-full rounded-2xl"
            width="720"
            height="720"
          />
          <figcaption className="flex items-center justify-between gap-4 px-4 py-3 text-xs text-gray-500">
            <span>真实 Golden Demo · 校领导视角</span>
            <span>全部校区</span>
          </figcaption>
        </figure>
      </div>
    </header>

    <section className="py-16" aria-labelledby="pain-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-blue-700">学校真实痛点</p>
          <h2 id="pain-title" className="mt-2 text-3xl font-bold text-gray-950">资料很多，真正需要时却难以确认</h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-950">{title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="border-y border-gray-200 bg-gray-50 py-16" aria-labelledby="workflow-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-blue-700">产品怎么工作</p>
          <h2 id="workflow-title" className="mt-2 text-3xl font-bold text-gray-950">从原始资料到有依据的回答</h2>
          <p className="mt-4 leading-7 text-gray-600">AI 负责提高整理效率，人工审核负责决定什么能够成为可信数据。</p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {workflow.map(([Icon, label], index) => (
            <li key={label} className="relative rounded-2xl border border-gray-200 bg-white p-5">
              <Icon className="text-blue-600" aria-hidden="true" />
              <span className="mt-5 block text-xs font-semibold text-gray-400">步骤 {index + 1}</span>
              <span className="mt-1 block font-bold text-gray-950">{label}</span>
              {index < workflow.length - 1 && <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 text-gray-300 lg:block" size={24} aria-hidden="true" />}
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
          <strong>审核边界：</strong>AI 不绕过人工审核，候选数据只有经过确认后才能发布为可信数据。
        </div>
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-700">智能查询与来源追溯</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-950">回答不仅给结论，还能回到证据</h3>
            <p className="mt-4 leading-7 text-gray-600">信息化负责人可以直接查询资产编号、校区或状态，并从核验结果继续查看对应来源。</p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-950/5">
            <img
              src={`${imageRoot}/ai-data-platform-query.png`}
              alt="信息化负责人查询 PC-2025-018 并查看来源追溯的真实 Demo 页面"
              className="h-auto w-full rounded-xl"
              width="720"
              height="650"
              loading="lazy"
            />
            <figcaption className="px-3 py-2 text-xs text-gray-500">真实查询：PC-2025-018 · 结果可查看来源</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section id="haichuan-demo" className="scroll-mt-24 py-16" aria-labelledby="demo-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-wide text-blue-700">Golden Demo</p>
            <h2 id="demo-title" className="mt-2 text-3xl font-bold text-gray-950">海川实验学校设备资产台账</h2>
            <p className="mt-4 leading-7 text-gray-600">海川实验学校为虚构演示数据，仅用于说明产品能力，不代表真实学校或真实资产。</p>
          </div>
          <span className="w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">虚构演示数据</span>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['100 台设备', '设备规模'],
            ['635,800 元', '资产总额'],
            ['3 个校区', '校区范围'],
            ['9 份原始资料', '资料来源'],
            ['136 条已发布可信数据', '审核后发布'],
          ].map(([value, label]) => (
            <article key={value} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-2xl font-bold text-blue-700">{value}</p>
              <p className="mt-2 text-sm text-gray-500">{label}</p>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-gray-500">补充数据：6 个采购批次、18 条维修记录、12 个地点。</p>
        <div className="mt-12 grid items-center gap-8 lg:grid-cols-[1.18fr_0.82fr]">
          <figure className="order-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-950/5 lg:order-1">
            <img
              src={`${imageRoot}/ai-data-platform-governance.png`}
              alt="从 AI 候选数据经过人工审核并发布为 136 条可信数据的治理页面"
              className="h-auto w-full rounded-xl"
              width="720"
              height="820"
              loading="lazy"
            />
          </figure>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold tracking-wide text-blue-700">人工审核与可信发布</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-950">136 条，是审核后发布的业务数据</h3>
            <p className="mt-4 leading-7 text-gray-600">设备、采购、维修和地点共同组成可信台账。页面保留数据质量提醒与来源证据，让发布过程能够被复核。</p>
          </div>
        </div>
      </div>
    </section>

    <section className="border-y border-gray-200 bg-blue-50 py-16" aria-labelledby="roles-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="roles-title" className="text-3xl font-bold text-gray-950">三种角色，各自看到需要的信息</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {roles.map(([Icon, title, text]) => (
            <article key={title} className="rounded-2xl border border-blue-100 bg-white p-7">
              <Icon className="text-blue-600" aria-hidden="true" />
              <h3 className="mt-5 text-xl font-bold text-gray-950">{title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="py-16" aria-labelledby="capabilities-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-blue-700">核心能力</p>
          <h2 id="capabilities-title" className="mt-2 text-3xl font-bold text-gray-950">围绕可信数据，而不是只做一次 AI 回答</h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(([Icon, title, text]) => (
            <article key={title} className="rounded-2xl border border-gray-200 p-6">
              <Icon className="text-blue-600" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-gray-950">{title}</h3>
              <p className="mt-2 leading-7 text-gray-600">{text}</p>
            </article>
          ))}
        </div>
        <div className="mt-12 grid items-center gap-8 rounded-3xl border border-gray-200 bg-gray-50 p-5 sm:p-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-700">多格式资料 · Office 原版式查看</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-950">核对表格时，保留原文件的版式语境</h3>
            <p className="mt-4 leading-7 text-gray-600">资产管理员可以在原文件预览与结构化预览之间切换，也能下载原文件继续核对。</p>
          </div>
          <figure className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-lg shadow-gray-950/5">
            <img
              src={`${imageRoot}/ai-data-platform-office-preview.png`}
              alt="固定资产台账 Excel 工作簿的 Office 原文件版式预览真实页面"
              className="h-auto w-full rounded-xl"
              width="1110"
              height="934"
              loading="lazy"
            />
            <figcaption className="px-3 py-2 text-xs text-gray-500">真实 XLSX · 原文件预览与结构化预览</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section className="border-y border-gray-200 bg-gray-950 py-16 text-white" aria-labelledby="boundary-title">
      <div className="container mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-blue-300">产品边界</p>
          <h2 id="boundary-title" className="mt-2 text-3xl font-bold">明确什么适合，什么暂时不做</h2>
          <p className="mt-4 leading-7 text-gray-300">AI Data Platform 更适合历史资料整理、数据治理和现有查询能力补充。</p>
        </div>
        <ul className="space-y-4">
          {[
            '当前不是完整资产管理系统。',
            '不替代学校现有系统，也不承诺覆盖采购、领用等全部业务流程。',
            'AI 不绕过人工审核，不能把未经确认的候选数据直接发布。',
          ].map((text) => (
            <li key={text} className="flex gap-3 rounded-xl border border-gray-700 bg-gray-900 p-4 leading-7 text-gray-200">
              <CheckCircle2 className="mt-1 shrink-0 text-blue-400" size={20} aria-hidden="true" />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </section>

    <section className="py-16" aria-labelledby="security-title">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-blue-700">部署与安全</p>
          <h2 id="security-title" className="mt-2 text-3xl font-bold text-gray-950">资料可控，结果有据</h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [LockKeyhole, '本地/私有部署', '根据机构要求部署在可控环境。'],
            [WifiOff, '可离线运行', '完整 Demo 可在 MacBook Air 断网环境演示。'],
            [ShieldCheck, '原始资料保留', '处理后仍能回到原文件核对。'],
            [FileCheck2, '结果可追溯', '查询结论关联对应资料来源。'],
          ].map(([Icon, title, text]) => {
            const ItemIcon = Icon as typeof ShieldCheck;
            return (
              <article key={String(title)} className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <ItemIcon className="text-blue-600" aria-hidden="true" />
                <h3 className="mt-4 font-bold text-gray-950">{String(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{String(text)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>

    <section className="border-t border-gray-200 bg-blue-50 py-16" aria-labelledby="cta-title">
      <div className="container mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <Users className="mx-auto text-blue-600" aria-hidden="true" />
        <h2 id="cta-title" className="mt-5 text-3xl font-bold text-gray-950">让一批真实资料先变得可查、可信</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">如希望使用真实资料进行小范围试跑，请联系乐可开源。</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/contact/" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-blue-700">
            联系乐可开源 <ArrowRight className="ml-2" size={18} aria-hidden="true" />
          </Link>
          <a href="https://demo.lekeopen.com" className="inline-flex min-h-11 items-center rounded-lg border border-blue-200 bg-white px-5 py-3 font-semibold text-blue-700 transition-colors hover:border-blue-400 hover:bg-white">
            在线体验 <ArrowRight className="ml-2" size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  </div>
);

export default AIDataPlatformProject;
