import React from 'react';
import { Rocket, RefreshCw, Bot, Code, Database, Shield, Layout, Server, Smartphone, CheckCircle, Workflow } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';
import { Link } from 'react-router-dom';

const Services: React.FC = () => {
  // 核心业务方向 (New)
  const coreServices = [
    {
      icon: <Rocket className="w-8 h-8 text-blue-600" />,
      title: '从 0 到 1 的产品工程化',
      target: '有业务想法但缺乏完整技术团队的创业者 / 转型期企业',
      problem: '解决“只有想法没有产品”或“外包代码无法维护”的问题。我们不只写代码，还负责技术选型、架构设计直到上线运维。',
      cooperation: '项目制交付（按里程碑验收）',
      features: ['MVP 快速验证', '全栈开发', '长期可维护代码', '部署与运维']
    },
    {
      icon: <RefreshCw className="w-8 h-8 text-indigo-600" />,
      title: '复杂系统重构与优化',
      target: '业务发展快导致技术债堆积、系统不稳定的成长期团队',
      problem: '解决系统经常崩溃、新功能加不进去、数据混乱等“生长痛”。在不中断业务的前提下，理清逻辑，完成架构升级。',
      cooperation: '技术咨询 + 驻场/远程协作',
      features: ['遗留代码重构', '性能瓶颈优化', '数据库迁移', '引入 CI/CD']
    },
    {
      icon: <Bot className="w-8 h-8 text-teal-600" />,
      title: 'AI 智能体 (Agent) 场景落地',
      target: '希望将大模型能力引入具体业务流的企业',
      problem: '解决 Token 成本控制、响应速度、私有数据清洗与 RAG 准确率等工程难题。让 AI 真正进入生产环境。',
      cooperation: 'POC 验证 -> 正式实施',
      features: ['企业知识库搭建', '任务型 Agent 开发', 'Prompt 优化', '私有化部署评估']
    },
    {
      icon: <Workflow className="w-8 h-8 text-cyan-600" />,
      title: 'Codex 开发应用落地',
      target: '希望用 AI 编程提升交付效率、改造内部工具或维护长期项目的团队',
      problem: '解决 AI 只能写片段、难以进入真实工程流程的问题。我们将 Codex 融入需求拆解、代码实现、测试验证、文档同步与发布流程。',
      cooperation: '研发流程共建 + 项目交付',
      features: ['AI 辅助全栈开发', '旧系统改造', '自动化脚本与内部工具', '代码审查与测试补强']
    }
  ];

  // 基础技术能力 (Old + Refined)
  const capabilities = [
    { icon: <Layout />, title: 'Web 与前端工程', desc: '构建高性能、响应式的现代化 Web 应用与管理后台。' },
    { icon: <Smartphone />, title: '移动端开发', desc: '微信小程序、H5 及跨平台移动应用开发。' },
    { icon: <Server />, title: '后端架构设计', desc: '高可用微服务架构、API 设计与系统集成。' },
    { icon: <Database />, title: '数据处理与分析', desc: 'ETL 数据清洗、结构化处理与可视化报表。' },
    { icon: <Shield />, title: '运维与安全', desc: '服务器托管、自动化部署、安全防护与监控。' },
    { icon: <Code />, title: '技术咨询', desc: '技术选型评估、代码审查与团队工程规范建设。' }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <SEOMeta
        title="能力与服务 | 乐可开源"
        description="乐可开源提供从0到1的产品工程化、复杂系统重构、AI智能体落地、Codex 开发应用落地服务。面向中小企业与创业团队，解决真实的技术痛点。"
        url="/services"
        type="website"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">能力与服务</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            我们提供从顶层业务落地到底层技术实现的完整支持。<br/>
            无论是核心业务系统的建设，还是单项技术能力的补充，我们都能提供专业服务。
          </p>
        </div>

        {/* Part 1: 核心合作模式 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="w-2 h-8 bg-blue-600 rounded-full mr-3"></span>
            核心合作模式
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {coreServices.map((service, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 flex flex-col">
                <div className="bg-blue-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <div className="space-y-4 flex-grow">
                  <p className="text-sm text-gray-600 leading-relaxed">{service.problem}</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">交付内容</h4>
                    <ul className="space-y-1">
                      {service.features.map((f, i) => (
                        <li key={i} className="text-xs text-gray-700 flex items-center">
                          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs font-medium">
                  <span className="text-gray-500">适合：{service.target.split('/')[0].substring(0, 10)}...</span>
                  <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded">{service.cooperation.split(' ')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: 基础技术能力矩阵 */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="w-2 h-8 bg-gray-600 rounded-full mr-3"></span>
            技术能力底座
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, index) => (
              <div key={index} className="flex items-start p-6 bg-white rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                <div className="text-gray-400 mr-4 mt-1">
                  {React.cloneElement(cap.icon as React.ReactElement, { size: 24 })}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">{cap.title}</h3>
                  <p className="text-sm text-gray-600">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 3: OpenClaw 部署服务 */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-10 md:p-14 text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
              <img src="/images/news/openclaw-mascot.svg" alt="OpenClaw" className="w-10 h-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold">OpenClaw / Clawdbot 私有化部署</h2>
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">New</span>
              </div>
              <p className="text-gray-400 text-sm">帮助团队在阿里云、腾讯云等平台上快速拥有自己的 AI 智能体实例</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div>
              <p className="text-gray-300 leading-relaxed mb-6">
                OpenClaw 是目前全球增长最快的开源 AI 助手，能<strong className="text-white">看屏幕、操作应用、执行真实任务</strong>，
                是真正能融入工作流的 AI 智能体。乐可开源团队已在阿里云完成私有化部署并投入实际使用，
                现将这套经过验证的部署经验开放为服务。
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                无需自行处理繁琐的环境配置、Docker 冲突、Python 版本问题，我们为你完成从服务器初始化到
                OpenClaw 稳定运行的全流程交付。
              </p>
            </div>
            <div className="space-y-3">
              {[
                '云服务器环境配置与安全加固',
                'OpenClaw (Clawdbot) 完整安装与调试',
                'Telegram Bot 接入与自定义指令配置',
                'HTTPS 加密与域名绑定（可选）',
                '基础运维文档与使用指南交付',
                '30 天部署后技术支持',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              to="/contact"
              className="inline-flex items-center bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            >
              咨询部署服务
            </Link>
            <Link
              to="/news/2026-03-19-openclaw-adoption"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm font-medium py-3"
            >
              了解我们的使用实践 →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Services;
