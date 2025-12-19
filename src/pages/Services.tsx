import React from 'react';
import { Brain, Code, Server, Layout, Database, Shield } from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: 'AI 应用与智能体',
      description: (
        <>
          <p className="mb-4">面向真实业务场景，基于大语言模型与智能体技术，为个人、团队及企业定制 <strong>可落地、可维护</strong> 的 AI 应用。</p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">适用场景：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>企业内部知识库 / 智能问答</li>
              <li>智能客服与自动回复系统</li>
              <li>自动化流程 Agent（信息整理、任务执行）</li>
              <li>私有化 AI 应用与定制模型接入</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">交付结果：</p>
            <p>一个真正能用、能持续迭代的 AI 系统，而不是 Demo。</p>
          </div>
        </>
      )
    },
    {
      icon: <Code className="w-8 h-8 text-indigo-600" />,
      title: '软件定制开发',
      description: (
        <>
          <p className="mb-4">针对具体业务需求，提供从需求分析到长期维护的 <strong>全流程定制开发服务</strong>。</p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">我们擅长：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Web 系统 / 管理后台 / 工具型应用</li>
              <li>业务系统重构与性能优化</li>
              <li>从 0 到 1 的产品原型与 MVP 实现</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">我们的关注点：</p>
            <p>系统可扩展性与可维护性；不是“写完就走”，而是长期可用。</p>
          </div>
        </>
      )
    },
    {
      icon: <Server className="w-8 h-8 text-teal-600" />,
      title: '技术架构咨询',
      description: (
        <>
          <p className="mb-4">为初创团队、转型期企业或技术负责人提供 <strong>清晰、可执行</strong> 的技术决策支持。</p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">服务内容包括：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>系统架构设计与技术选型建议</li>
              <li>AI / 云服务 / 开源技术引入评估</li>
              <li>系统演进路线规划</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">你将获得：</p>
            <p>一份结合你现状与未来发展的技术判断，而不是“随大流”的方案。</p>
          </div>
        </>
      )
    },
    {
      icon: <Layout className="w-8 h-8 text-purple-600" />,
      title: '前端工程化与体验',
      description: (
        <>
          <p className="mb-4">构建现代化、高性能、易维护的前端系统，让产品不仅“能用”，而且“好用、耐用”。</p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-gray-800">服务内容：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>前端架构设计与工程化建设</li>
              <li>多端适配（Web / 移动端）</li>
              <li>交互体验与性能优化</li>
            </ul>
            <p className="mt-2 text-gray-500 italic">适合对产品体验有要求的项目。</p>
          </div>
        </>
      )
    },
    {
      icon: <Database className="w-8 h-8 text-orange-600" />,
      title: '数据处理与分析',
      description: (
        <>
          <p className="mb-4">帮助你把零散的数据，转化为 <strong>可理解、可决策</strong> 的信息。</p>
          <div className="space-y-2 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>数据清洗与结构化处理</li>
              <li>数据存储与查询优化</li>
              <li>数据可视化与分析报表</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">目标很简单：</p>
            <p>让数据真正为业务决策服务。</p>
          </div>
        </>
      )
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: '运维与安全支持',
      description: (
        <>
          <p className="mb-4">为系统的长期稳定运行提供可靠保障。</p>
          <div className="space-y-2 text-sm">
            <ul className="list-disc pl-5 space-y-1">
              <li>服务器部署与云环境配置</li>
              <li>CI/CD 持续集成与部署</li>
              <li>系统监控、备份与安全防护</li>
            </ul>
            <p className="font-semibold text-gray-800 mt-2">适合：</p>
            <p>没有专职运维人员的团队；希望系统“有人长期管”的项目。</p>
          </div>
        </>
      )
    }
  ];

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">能力与服务</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            乐可开源是一支以 <strong>AI 技术与软件工程能力为核心</strong> 的技术服务团队。<br className="hidden md:block" />
            不论你是正在探索新想法，还是已有系统需要升级优化，我们都可以作为你的长期技术伙伴，<br className="hidden md:block" />
            把想法落地为真正可用、可持续演进的系统。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gray-50 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <div className="text-gray-600 leading-relaxed">
                {service.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
