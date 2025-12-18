import React from 'react';
import { Target, Code2, Rocket, Briefcase, Handshake } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="pb-16 min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-6">关于天水乐可</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            一家专注于 AI 与复杂系统工程实践的技术团队
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 border border-gray-100">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">公司简介</h2>
            <div className="text-gray-600 text-lg leading-relaxed space-y-6">
              <p>
                天水乐可信息技术有限公司是一支以 <strong>工程能力与长期交付</strong> 为核心的技术团队。
                我们由多名具有多年一线开发经验的软件工程师与 AI 技术实践者组成，长期深耕于 <strong>定制软件开发、系统架构设计与人工智能应用落地</strong> 领域。
              </p>
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-blue-600">
                <p className="font-semibold text-gray-800 mb-3">我们并不追求“概念领先”，而更关注：</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>技术是否真正解决问题</li>
                  <li>系统是否可以长期稳定运行</li>
                  <li>产品是否能够持续演进而不是一次性交付</li>
                </ul>
              </div>
              <p>
                在过去的项目实践中，我们服务过不同行业与组织形态，参与过 <strong>复杂业务系统、内部管理平台、长期运维型项目</strong>，并逐步沉淀出一套以工程可靠性为核心的方法论。
              </p>
              <p className="font-bold text-center text-gray-900 pt-4 text-xl">
                我们的目标很简单：成为客户在技术层面可以长期信任的合作伙伴。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Philosophy */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">技术理念</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex p-8 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-shrink-0 mr-6">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Code2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">开源精神</h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  我们高度认同并积极拥抱开源文化。在项目中广泛使用成熟的开源技术栈，同时持续关注社区的发展与最佳实践。
                </p>
                <div>
                  <p className="font-semibold text-gray-800 mb-2 text-sm">对我们而言，开源不是“省成本”，而是：</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>更透明的技术选择</li>
                    <li>更可持续的系统演进</li>
                    <li>更健康的工程生态</li>
                  </ul>
                </div>
                <p className="text-sm italic">
                  * 在合适的场景下，我们也会将实践经验与工具以开源或技术分享的方式回馈社区。
                </p>
              </div>
            </div>
          </div>
          <div className="flex p-8 bg-gray-50 rounded-xl border border-gray-100">
            <div className="flex-shrink-0 mr-6">
              <div className="bg-green-100 p-3 rounded-lg">
                <Target className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">工程实践</h3>
              <div className="text-gray-600 space-y-4">
                <p>
                  我们坚信：优秀的软件来自稳定的工程体系，而不是个人英雄主义。
                </p>
                <div>
                  <p className="font-semibold text-gray-800 mb-2 text-sm">在日常开发中，我们坚持：</p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>清晰的需求拆解与技术设计</li>
                    <li>可维护、可扩展的系统架构</li>
                    <li>自动化测试与 CI/CD 流程</li>
                    <li>代码审查与技术复盘机制</li>
                  </ul>
                </div>
                <p className="font-medium text-gray-800">
                  我们关注的不只是“功能完成”，而是系统在半年、一年甚至更长时间后依然可控、可演进。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What we do */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12">
             <div className="md:w-1/3">
                <div className="inline-block p-3 bg-purple-100 rounded-lg mb-4">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">我们在做什么</h2>
                <p className="text-gray-600">
                  我们当前的工作重点主要集中在以下方向，部分方向已通过自研项目与实验性产品进行持续验证。
                </p>
             </div>
             <div className="md:w-2/3">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'AI 应用与智能体（Agent）系统实践',
                    '企业与团队内部系统的智能化升级',
                    '复杂业务流程的工程化与自动化实现',
                    '长期运维型系统的稳定性与演进支持'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-100 text-gray-800 font-medium">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      {item}
                    </li>
                  ))}
                </ul>
             </div>
          </div>
        </div>
      </div>

      {/* Cooperation */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-blue-50 rounded-xl p-8 md:p-12 border border-blue-100">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
              <Handshake className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">合作方式</h2>
            <p className="text-gray-600 mt-2">我们更倾向于长期合作关系，而非一次性交付。</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              '需要长期演进的业务系统',
              '对系统稳定性和可维护性有要求的团队',
              '希望逐步引入 AI 能力，而非一次性重构的项目',
              '缺乏完整技术团队，但需要可靠技术伙伴的组织'
            ].map((text, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm text-center flex items-center justify-center h-full">
                <p className="text-gray-800 font-medium">{text}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <p className="text-lg font-semibold text-blue-800">
              如果你希望的是一个 “能一起把事情长期做好”的技术团队，我们很乐意成为你的选择之一。
            </p>
          </div>
        </div>
      </div>

      {/* Future Direction */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-2xl p-8 md:p-16 text-white text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <Rocket className="w-16 h-16 mx-auto mb-6 text-blue-400" />
            <h2 className="text-3xl font-bold mb-6">未来发展方向</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <p className="text-xl text-blue-100 font-light">
                未来，我们将持续向 <span className="font-bold text-white">AI Native</span> 的方向演进
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base">
                <span className="bg-white/10 px-4 py-2 rounded-full border border-white/20">探索 AI 与业务系统的深度融合</span>
                <span className="bg-white/10 px-4 py-2 rounded-full border border-white/20">构建人机协作的新型工作流</span>
                <span className="bg-white/10 px-4 py-2 rounded-full border border-white/20">推动 AI 从“工具”走向“可靠的系统能力”</span>
              </div>
              <p className="text-lg text-blue-200 mt-8 pt-6 border-t border-white/10">
                “我们相信，真正有价值的 AI，不在于炫技，而在于是否能长期稳定地服务真实世界的问题。”
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
