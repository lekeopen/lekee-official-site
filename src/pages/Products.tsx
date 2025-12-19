import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllProjects } from '../lib/content';

const Products: React.FC = () => {
  const products = getAllProjects();

  const experiences = [
    { title: '政务 / 行业系统', desc: '深度参与复杂业务逻辑梳理与系统实现，确保数据安全与流程合规。' },
    { title: '企业级内部系统', desc: '构建高可用、易扩展的管理后台，支撑企业核心业务流转。' },
    { title: '长期运维与系统集成', desc: '提供从部署到监控的全生命周期保障，解决异构系统集成难题。' }
  ];

  return (
    <div className="py-16 min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面顶部说明 */}
        <div className="mb-16 border-l-4 border-blue-600 pl-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">产品与项目</h1>
          <p className="text-xl text-gray-600 max-w-4xl leading-relaxed">
            这里展示的是乐可开源的自研产品、实验性项目与内部工具。<br />
            我们不以“卖产品”为核心，而是通过这些项目，展示<span className="font-semibold text-gray-900">技术实践能力、工程方法与思考方式</span>。<br />
            它们是我们解决复杂问题的“样板”，也是技术持续演进的见证。
          </p>
        </div>

        {/* 核心项目展示 */}
        <div className="space-y-12 mb-20">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 transition-colors flex flex-col lg:flex-row">
              {/* 左侧：项目预览占位 */}
              <div className={`lg:w-1/3 min-h-[240px] ${product.image_bg} flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 relative overflow-hidden`}>
                {product.cover ? (
                   <img src={product.cover} alt={product.name} className="w-full h-full object-cover absolute inset-0" />
                ) : (
                   <span className="text-gray-400 font-medium text-lg px-8 text-center relative z-10">{product.name} <br/><span className="text-sm opacity-75">项目预览图占位</span></span>
                )}
              </div>
              
              {/* 右侧：项目信息 */}
              <div className="p-8 lg:w-2/3 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-gray-200">
                    {product.category}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                    product.status === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 
                    product.status === 'Alpha' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {product.status}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h3>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                  {product.summary}
                </p>

                <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-2">💡 核心理念</h4>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {product.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.tech_stack.map((tech, idx) => (
                      <span key={idx} className="text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-200">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Link to={`/projects/${product.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    了解项目详情 <ExternalLink size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 过往项目经验 */}
        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">过往项目经验沉淀</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {experiences.map((exp, index) => (
              <div key={index}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{exp.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {exp.desc}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center md:text-left">
            <p className="text-sm text-gray-500 italic">
              * 这些过往经验是乐可开源构建当前 AI 与复杂系统能力的重要基石。
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Products;
