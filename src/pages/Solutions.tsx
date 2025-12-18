import React from 'react';
import { Zap, BookOpen, Cpu, Settings } from 'lucide-react';

const Solutions: React.FC = () => {
  const solutions = [
    {
      id: 'efficiency',
      icon: <Zap className="w-10 h-10 text-yellow-600" />,
      title: '企业效率提升与协作优化',
      description: (
        <>
          <p className="mb-4">
            随着业务复杂度提升，企业往往会遇到流程分散、信息割裂、协作成本高的问题。
            我们通过数字化工具与系统整合，帮助企业重塑工作流，让信息真正流动起来。
          </p>
          <div className="mb-4">
            <p className="font-semibold text-gray-800 mb-2 text-sm">我们通常会这样做：</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>梳理核心业务流程与协作节点</li>
              <li>构建统一的流程与任务管理系统</li>
              <li>打通系统间的数据接口，减少重复操作</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-800 mb-2 text-sm">可落地的能力包括：</p>
            <div className="flex flex-wrap gap-2">
              {['流程自动化与审批系统', '移动办公与多端协作', '数据驱动的智能报表与看板'].map((item, idx) => (
                <span key={idx} className="bg-yellow-50 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-100">{item}</span>
              ))}
            </div>
          </div>
        </>
      )
    },
    {
      id: 'knowledge',
      icon: <BookOpen className="w-10 h-10 text-blue-600" />,
      title: '知识与内容管理解决方案',
      description: (
        <>
          <p className="mb-4">
            知识分散、文档混乱、经验难以传承，是许多组织的长期痛点。
            我们通过结构化设计与 AI 技术，帮助企业构建真正可用的知识体系。
          </p>
          <div className="mb-4">
            <p className="font-semibold text-gray-800 mb-2 text-sm">解决的问题包括：</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>文档难查、版本混乱</li>
              <li>新成员学习成本高</li>
              <li>经验无法复用</li>
            </ul>
          </div>
          <div className="mb-3">
            <p className="font-semibold text-gray-800 mb-2 text-sm">解决方案能力：</p>
            <div className="flex flex-wrap gap-2">
              {['企业级 Wiki 与知识库系统', 'AI 问答与智能检索', '文档版本管理与权限控制'].map((item, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-800 text-xs px-2 py-1 rounded border border-blue-100">{item}</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">* 乐教库等项目正是这一方案的实践基础。</p>
        </>
      )
    },
    {
      id: 'intelligence',
      icon: <Cpu className="w-10 h-10 text-purple-600" />,
      title: '内部系统的 AI 智能化升级',
      description: (
        <>
          <p className="mb-4">
            AI 并不是推翻原有系统，而是让已有系统“更聪明”。
            我们帮助企业在现有业务系统中，逐步引入 AI 能力，实现智能化升级。
          </p>
          <div className="mb-4">
            <p className="font-semibold text-gray-800 mb-2 text-sm">典型应用场景：</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>智能客服与自动回复</li>
              <li>智能审核与辅助决策</li>
              <li>数据分析与预测支持</li>
            </ul>
          </div>
          <div className="mb-3">
            <p className="font-semibold text-gray-800 mb-2 text-sm">我们的做法：</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>评估现有系统结构与数据质量</li>
              <li>设计 AI 能力嵌入方式</li>
              <li>控制成本与复杂度，避免一次性重构</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500 italic">* 小乐等 AI 实践项目，为此类方案提供了真实验证。</p>
        </>
      )
    },
    {
      id: 'automation',
      icon: <Settings className="w-10 h-10 text-green-600" />,
      title: '自动化工具与 RPA 方案',
      description: (
        <>
          <p className="mb-4">
            针对规则明确、重复性高的工作任务，我们提供自动化与脚本化解决方案，
            帮助团队释放人力，减少人为错误。
          </p>
          <div className="mb-4">
            <p className="font-semibold text-gray-800 mb-2 text-sm">适用场景：</p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>数据批处理与定时任务</li>
              <li>多系统间的数据同步</li>
              <li>日常运维与管理操作自动化</li>
            </ul>
          </div>
          <div className="mb-3">
            <p className="font-semibold text-gray-800 mb-2 text-sm">解决方案形式：</p>
            <div className="flex flex-wrap gap-2">
              {['定制化 RPA 机器人', '自动化脚本与工具', '可视化流程编排（实验性）'].map((item, idx) => (
                <span key={idx} className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded border border-green-100">{item}</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 italic">* SmartFlow 等实验项目正用于验证这些能力的边界。</p>
        </>
      )
    }
  ];

  return (
    <div className="py-16 bg-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面顶部说明 */}
        <div className="text-center mb-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">解决方案</h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            我们不局限于特定行业，而是围绕企业与团队在发展过程中普遍遇到的共性问题，<br className="hidden md:block"/>
            提供基于真实项目经验与技术实践的解决方案。<br className="hidden md:block"/>
            <span className="text-base text-gray-500 mt-2 block">这些方案并不是固定模板，而是可根据实际情况灵活组合、持续演进的技术路径。</span>
          </p>
        </div>

        {/* 解决方案列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          {solutions.map((solution) => (
            <div key={solution.id} className="flex flex-col sm:flex-row gap-6 bg-gray-50 p-8 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="p-4 bg-white rounded-xl shadow-sm">
                  {solution.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{solution.title}</h3>
                <div className="text-gray-600 leading-relaxed">
                  {solution.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 实践说明 (替代原案例展示) */}
        <div className="bg-blue-50 rounded-2xl p-8 md:p-12 border border-blue-100">
          <div className="md:flex items-start justify-between gap-12">
            <div className="md:w-1/3 mb-8 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">实践说明</h2>
              <p className="text-gray-700 leading-relaxed">
                我们参与过多类型的软件与系统项目，包括政务系统、行业内部系统、企业级工具与长期运维项目。
                这些实践让我们积累了宝贵的经验。
              </p>
            </div>
            <div className="md:w-2/3">
              <h3 className="font-semibold text-gray-900 mb-4">这些经验构成了我们当前解决方案与 AI 实践的重要基础：</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <div className="font-bold text-blue-800 mb-1">复杂需求</div>
                  <div className="text-sm text-gray-600">拆解与落地</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <div className="font-bold text-blue-800 mb-1">长周期系统</div>
                  <div className="text-sm text-gray-600">稳定运行保障</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                  <div className="font-bold text-blue-800 mb-1">工程实现</div>
                  <div className="text-sm text-gray-600">多角色、多权限系统</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Solutions;
