import React from 'react';
import { XCircle, CheckCircle, Server, Database, GitMerge, Zap, BookOpen, Settings, ShieldCheck, Activity, FileText } from 'lucide-react';
import SEOMeta from '../components/common/SEOMeta';

const Solutions: React.FC = () => {
  // 业务场景解决方案 (Old Refined)
  const businessSolutions = [
    {
      icon: <Zap className="text-yellow-600" />,
      title: '企业效率与协作优化',
      desc: '打通信息孤岛，重塑工作流。',
      tags: ['审批流程自动化', '移动办公集成', '数据看板']
    },
    {
      icon: <BookOpen className="text-blue-600" />,
      title: '知识管理与内容体系',
      desc: '让经验可沉淀，文档可检索。',
      tags: ['企业 Wiki', 'AI 智能问答', '文档版本控制']
    },
    {
      icon: <Settings className="text-green-600" />,
      title: '自动化工具 (RPA)',
      desc: '替代重复人工操作，降低错误率。',
      tags: ['数据自动录入', '跨系统同步', '定时任务脚本']
    }
  ];

  return (
    <div className="py-16 bg-white">
      <SEOMeta title="解决方案 | 乐可开源" description="..." url="/solutions" type="website" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">解决方案</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            拒绝“万能模板”。我们提供基于真实工程经验的定制化解决方案，<br/>
            既解决当下的业务痛点，又兼顾未来的技术演进。
          </p>
        </div>

        {/* 1. 我们的原则 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
            <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center"><XCircle className="mr-2" /> 我们不做</h2>
            <ul className="space-y-2 text-red-900 text-sm">
              <li>• 纯套模板的展示型网站（价值太低）</li>
              <li>• 只为“拿融资”的 PPT 项目（无法落地）</li>
              <li>• 无法长期维护的一次性代码</li>
            </ul>
          </div>
          <div className="bg-green-50 p-8 rounded-2xl border border-green-100">
            <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center"><CheckCircle className="mr-2" /> 我们擅长</h2>
            <ul className="space-y-2 text-green-900 text-sm">
              <li>• 复杂的 B 端业务逻辑系统</li>
              <li>• 异构系统集成与老旧系统改造</li>
              <li>• 非结构化数据的清洗与资产化</li>
            </ul>
          </div>
        </div>

        {/* 2. 业务场景解决方案 */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">业务场景解决方案</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {businessSolutions.map((item, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl border border-gray-100 hover:shadow-md transition-all">
                <div className="mb-4 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  {React.cloneElement(item.icon as React.ReactElement, { size: 24 })}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm mb-4 h-10">{item.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((t, i) => (
                    <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 技术攻坚与工程标准 (Combined) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">底层技术攻坚</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <Server className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">高并发与高可用</h3>
                  <p className="text-sm text-gray-600 mt-1">处理真实 QPS 洪峰，通过缓存、MQ 保障系统稳定。</p>
                </div>
              </div>
              <div className="flex gap-4">
                <GitMerge className="w-10 h-10 text-purple-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">遗留系统改造</h3>
                  <p className="text-sm text-gray-600 mt-1">建立测试防护网，平滑剥离业务逻辑，重构“屎山”代码。</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Database className="w-10 h-10 text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">数据资产化</h3>
                  <p className="text-sm text-gray-600 mt-1">ETL 管道搭建与数据仓库建设，为 AI 准备高质量数据。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-2xl">
            <h2 className="text-xl font-bold mb-6">交付标准</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <ShieldCheck className="text-green-400" />
                <span className="text-sm text-gray-300">自动化测试覆盖核心逻辑</span>
              </div>
              <div className="flex items-center gap-4">
                <Activity className="text-blue-400" />
                <span className="text-sm text-gray-300">完善的监控与报警机制</span>
              </div>
              <div className="flex items-center gap-4">
                <FileText className="text-yellow-400" />
                <span className="text-sm text-gray-300">交付完整的架构设计与运维文档</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Solutions;
