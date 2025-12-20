import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Brain, Code, Terminal, ChevronRight, Rss, Github, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAllNews, getAllProjects } from '../lib/content';
import SEOMeta from '../components/common/SEOMeta';
import TechBackground from '../components/ui/TechBackground';

const Home: React.FC = () => {
  const newsData = getAllNews();
  const projects = getAllProjects().slice(0, 3);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="space-y-16">
      <SEOMeta
        title="乐可开源 | AI 与工程实践"
        description="乐可开源是专注 AI 与工程实践的技术团队，致力于通过前沿的人工智能技术与专业的软件工程能力，为客户解决复杂问题，创造价值。"
        url="/"
        type="website"
      />
      
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white min-h-[600px] flex items-center overflow-hidden">
        {/* Animated Background */}
        <TechBackground />
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-gray-900/60 to-gray-900/90 z-10 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                乐可开源
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-blue-100/90 mb-4 max-w-3xl mx-auto font-light"
            >
              专注 AI 与工程实践的技术团队
            </motion.p>
            
            <motion.p 
              variants={fadeInUp}
              className="text-base md:text-lg text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              天水乐可信息技术有限公司旗下技术与开源实践平台
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <Link
                to="/contact"
                className="group relative px-8 py-3.5 bg-blue-600 text-white rounded-lg font-medium text-lg overflow-hidden transition-all hover:bg-blue-500 hover:scale-105 shadow-lg shadow-blue-500/25"
              >
                <span className="relative z-10">联系我们</span>
              </Link>
              
              <Link
                to="/services"
                className="group px-8 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg font-medium text-lg hover:bg-white/20 transition-all hover:scale-105"
              >
                了解更多
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12 tracking-tight">核心能力</h2>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Brain className="text-blue-600" size={32} />,
              bg: "bg-blue-50",
              title: "AI 应用与智能体",
              desc: "基于大模型与智能体技术，为不同场景定制 AI 应用解决方案。涵盖智能助手、自动化流程、知识库系统等。"
            },
            {
              icon: <Code className="text-indigo-600" size={32} />,
              bg: "bg-indigo-50",
              title: "定制软件开发",
              desc: "提供从需求分析、系统设计到开发交付的全流程服务。关注系统的可扩展性、稳定性与可维护性。"
            },
            {
              icon: <Terminal className="text-teal-600" size={32} />,
              bg: "bg-teal-50",
              title: "技术咨询与运维",
              desc: "为已有系统提供架构优化、性能调优与技术决策支持。同时提供持续运维与技术陪伴服务。"
            }
          ].map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 group"
            >
              <div className={`${item.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {item.desc}
              </p>
              <Link to="/services" className="inline-flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                了解详情 <ArrowRight size={16} className="ml-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Projects Showcase */}
      <section className="bg-gray-50/50 py-20 border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">产品与实验室</h2>
              <p className="text-gray-500">探索我们的创新产品与实验性项目</p>
            </div>
            <Link to="/products" className="hidden md:inline-flex items-center text-blue-600 hover:text-blue-700 font-medium group">
              查看全部 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link 
                  to={`/projects/${project.id}`} 
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col h-full border border-gray-100 hover:border-blue-100"
                >
                  <div className={`h-48 ${project.image_bg || 'bg-gray-100'} flex items-center justify-center relative overflow-hidden`}>
                    {project.cover ? (
                      <img src={project.cover} alt={project.name} className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <span className="text-gray-400 font-medium text-center px-4">
                        {project.name} <br/>
                        <span className="text-xs opacity-75">项目预览图占位</span>
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {project.summary}
                    </p>
                  </div>
                </Link>
              </motion.div>
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
        <div className="pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">公司动态</h2>
              <p className="text-gray-500 text-sm">Technical Updates & Milestones</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3">
              <div className="grid grid-cols-1 gap-6">
                {newsData.slice(0, 2).map((news, index) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link 
                      to={`/news/${news.id}`}
                      className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-lg transition-all items-start"
                    >
                      {/* Content */}
                      <div className="flex-grow order-2 md:order-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
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
                        <div className="w-full md:w-48 h-32 md:h-32 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 order-1 md:order-2">
                           <img src={news.cover} alt={news.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-8 text-left">
                <Link to="/news" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group">
                  查看全部动态 <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-1/3 space-y-8">
              {/* Quick Links */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
              >
                 <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-gray-400">关注我们</h3>
                 <div className="space-y-3">
                   <a href="https://github.com/lekeopen" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group p-2 hover:bg-gray-50 rounded-lg -mx-2">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                       <Github size={16} />
                     </div>
                     <span className="text-sm font-medium">GitHub / lekeopen</span>
                   </a>
                   <Link to="/contact" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group p-2 hover:bg-gray-50 rounded-lg -mx-2">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                       <Mail size={16} />
                     </div>
                     <span className="text-sm font-medium">联系我们</span>
                   </Link>
                 </div>
              </motion.div>

              {/* Subscribe Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100"
              >
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Rss size={18} className="mr-2 text-orange-500" /> 订阅更新
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  通过 RSS 阅读器订阅我们的最新技术动态，第一时间获取项目进展与技术分享。
                </p>
                <a 
                  href="/rss.xml" 
                  target="_blank" 
                  className="w-full block text-center bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 font-medium py-2.5 rounded-lg transition-all text-sm hover:shadow-sm"
                >
                  获取 RSS 链接
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
           <TechBackground />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">准备好开始了吗？</h2>
            <p className="text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed text-lg">
              如果你正在考虑 AI 应用、系统开发，<br className="hidden md:block" />
              或需要长期可靠的技术支持团队，<br className="hidden md:block" />
              欢迎与我们联系，一起把想法变成现实。
            </p>
            <Link
              to="/contact"
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-blue-600/30 inline-block hover:-translate-y-1"
            >
              立即联系我们
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
