import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getAllNews } from '../lib/content';

const News: React.FC = () => {
  const newsData = getAllNews();

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-20">
      <Helmet>
        <title>公司动态 - 天水乐可信息技术有限公司</title>
        <meta name="description" content="天水乐可信息技术有限公司的技术动态、更新日志与里程碑记录。" />
      </Helmet>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium text-sm group"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">公司动态</h1>
          <p className="text-xl text-gray-500 font-light">
            Technical Updates & Milestones
          </p>
        </header>

        {/* News List */}
        <div className="grid grid-cols-1 gap-6">
          {newsData.map((news) => (
            <Link 
              key={news.id} 
              to={`/news/${news.id}`}
              className="group flex flex-col md:flex-row gap-6 p-6 rounded-lg border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all items-start"
            >
              {/* Content */}
              <div className="flex-grow order-2 md:order-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded
                    ${news.category === 'Site Update' ? 'bg-blue-50 text-blue-600' : 
                      news.category === 'Project' ? 'bg-indigo-50 text-indigo-600' : 
                      'bg-gray-100 text-gray-600'}`}>
                    <Tag size={10} className="mr-1" />
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
      </div>
    </div>
  );
};

export default News;