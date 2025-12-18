import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Code, Terminal, ChevronRight, Rss, Github, Mail } from 'lucide-react';
import { getAllNews, getAllProjects } from '../lib/content';

const Home: React.FC = () => {
  const newsData = getAllNews();
  const projects = getAllProjects().slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            AI 驱动的技术服务与应用开发团队
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
            我们致力于通过前沿的人工智能技术与专业的软件开发能力，为客户解决复杂问题，创造无限价值。
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/contact"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 rounded-md font-semibold text-lg transition-colors"
            >
              联系我们
            </Link>
            <Link
              to="/services"
              className="border border-white text-white hover:bg-white/10 px-8 py-3 rounded-md font-semibold text-lg transition-colors"
            >
              了解更多
            </Link>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">核心能力</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="bg-blue-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Brain className="text-blue-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">AI 应用与智能体</h3>
            <p className="text-gray-600 mb-4">
              基于大模型与智能体技术，为不同场景定制 AI 应用解决方案。
              涵盖智能助手、自动化流程、知识库系统等，
              让 AI 成为真正可用、可持续的生产力工具。
            </p>
            <Link to="/services" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              了解详情 <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="bg-indigo-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Code className="text-indigo-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">定制软件开发</h3>
            <p className="text-gray-600 mb-4">
              提供从需求分析、系统设计到开发交付与长期维护的全流程服务。
              我们关注系统的 <span className="font-semibold text-gray-800">可扩展性、稳定性与可维护性</span> ，
              而不仅仅是“把功能做出来”。
            </p>
            <Link to="/services" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              了解详情 <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
            <div className="bg-teal-100 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
              <Terminal className="text-teal-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">技术咨询与运维支持</h3>
            <p className="text-gray-600 mb-4">
              为已有系统提供架构优化、性能调优与技术决策支持。
              同时提供持续运维与技术陪伴服务，
              帮助客户降低技术风险，专注业务本身。
            </p>
            <Link to="/services" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              了解详情 <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Projects Showcase */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">产品与实验室</h2>
              <p className="text-gray-600">探索我们的创新产品与实验性项目</p>
            </div>
            <Link to="/products" className="hidden md:inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
              查看全部 <ChevronRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link 
                key={project.id}
                to={`/projects/${project.id}`} 
                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className={`h-48 ${project.image_bg || 'bg-gray-200'} flex items-center justify-center relative overflow-hidden`}>
                  {project.cover ? (
                    <img src={project.cover} alt={project.name} className="w-full h-full object-cover absolute inset-0" />
                  ) : (
                    <span className="text-gray-400 font-medium text-center px-4">
                      {project.name} <br/>
                      <span className="text-xs opacity-75">项目预览图占位</span>
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="mt-8 text-center md:hidden">
            <Link to="/products" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
              查看全部 <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Technical Updates */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 pt-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">公司动态</h2>
              <p className="text-gray-500 text-sm">Technical Updates & Milestones</p>
            </div>
            <div className="mt-4 md:mt-0">
               {/* Social Links Context Note */}
               <span className="text-xs text-gray-400">
                 更多技术细节将同步至 GitHub 与技术博客
               </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 gap-6">
                {newsData.slice(0, 2).map((news) => (
                  <Link 
                    key={news.id} 
                    to={`/news/${news.id}`}
                    className="group flex flex-col md:flex-row gap-6 p-6 rounded-lg border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all items-start"
                  >
                    {/* Content */}
                    <div className="flex-grow order-2 md:order-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded
                          ${news.category === 'Site Update' ? 'bg-blue-50 text-blue-600' : 
                            news.category === 'Project' ? 'bg-indigo-50 text-indigo-600' : 
                            'bg-gray-100 text-gray-600'}`}>
                          {news.category}
                        </span>
                        <time className="text-sm text-gray-400 font-mono">{news.date}</time>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {news.title}
                      </h3>
                      
                      <div className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {news.summary.join(' ')}
                      </div>
                    </div>

                    {/* Cover Image (Optional) */}
                    {news.cover && (
                      <div className="w-full md:w-48 h-32 md:h-32 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 order-1 md:order-2">
                         <img src={news.cover} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}
                  </Link>
                ))}
              </div>
              
              <div className="mt-8 text-left">
                <Link to="/news" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  查看全部动态 <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3 space-y-8">
              {/* Quick Links */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">关注我们</h3>
                 <div className="space-y-3">
                   <a href="https://github.com/lekeopen" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                       <Github size={16} />
                     </div>
                     <span className="text-sm font-medium">GitHub / lekeopen</span>
                   </a>
                   <Link to="/contact" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                       <Mail size={16} />
                     </div>
                     <span className="text-sm font-medium">联系我们</span>
                   </Link>
                 </div>
              </div>

              {/* Subscribe Card */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Rss size={18} className="mr-2 text-orange-500" /> 订阅更新
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  通过 RSS 阅读器订阅我们的最新技术动态，第一时间获取项目进展与技术分享。
                </p>
                <a 
                  href="/rss.xml" 
                  target="_blank" 
                  className="w-full block text-center bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  获取 RSS 链接
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            如果你正在考虑 AI 应用、系统开发，<br className="hidden md:block" />
            或需要长期可靠的技术支持团队，<br className="hidden md:block" />
            欢迎与我们联系，一起把想法变成现实。
          </p>
          <Link
            to="/contact"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-semibold text-lg transition-colors inline-block"
          >
            立即联系我们
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
