import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { getAllNews } from '../lib/content';
import SEOMeta from '../components/common/SEOMeta';
import type { Components } from 'react-markdown';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const news = getAllNews();
  const newsItem = news.find(item => item.id === id);

  if (!newsItem) {
    return <Navigate to="/" replace />;
  }

  // 自定义 ReactMarkdown 组件，区分站内外链接
  const components: Components = {
    a: ({ node, href, children, ...props }) => {
      const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
      
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      }
      
      return (
        <Link to={href || '#'} {...props}>
          {children}
        </Link>
      );
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-20">
      <SEOMeta
        title={`${newsItem.title} | 乐可开源`}
        description={newsItem.summary.join(' ')}
        url={`/news/${newsItem.id}`}
        image={newsItem.cover}
        type="article"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium text-sm group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          返回首页
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center space-x-4 mb-6">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium
              ${newsItem.category === 'Site Update' ? 'bg-blue-100 text-blue-800' : 
                newsItem.category === 'Project' ? 'bg-indigo-100 text-indigo-800' : 
                'bg-gray-100 text-gray-800'}`}>
              <Tag size={12} className="mr-1.5" />
              {newsItem.category}
            </span>
            <span className="flex items-center text-gray-500 text-sm font-mono">
              <Calendar size={14} className="mr-1.5" />
              {newsItem.date}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {newsItem.title}
          </h1>
        </header>

        {/* Cover Image (Optional) */}
        {newsItem.cover && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-sm bg-gray-100 border border-gray-100">
            <img 
              src={newsItem.cover} 
              alt={newsItem.title} 
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
              {newsItem.content.body}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetail;
