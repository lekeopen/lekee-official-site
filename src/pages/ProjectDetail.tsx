import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getAllProjects } from '../lib/content';
import SEOMeta from '../components/common/SEOMeta';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projects = getAllProjects();
  const project = projects.find(p => p.id === id);

  if (!project) {
    return <Navigate to="/products" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-20">
      <SEOMeta
        title={`${project.name} | 乐可开源`}
        description={project.summary}
        url={`/projects/${project.id}`}
        image={project.cover}
        type="article"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        {/* Back Link */}
        <Link 
          to="/products" 
          className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-8 font-medium text-sm group"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          返回项目列表
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
              ${project.status === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 
                project.status === 'Alpha' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                'bg-gray-100 text-gray-700 border-gray-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                ${project.status === 'Live' ? 'bg-green-500' : 
                  project.status === 'Alpha' ? 'bg-orange-500' : 
                  'bg-gray-500'}`}></span>
              {project.status}
            </span>
            <span className="text-gray-400 text-sm">|</span>
            <span className="text-gray-500 text-sm font-medium">Project ID: {project.id}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {project.name}
          </h1>
          <p className="text-xl text-gray-500 font-light">
            {project.subtitle}
          </p>
        </header>

        {/* Cover Image (Optional) */}
        {project.cover && (
          <div className="mb-10 rounded-xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100 flex justify-center">
             <img 
               src={project.cover} 
               alt={project.name} 
               className="h-auto max-h-[300px] max-w-full object-contain"
             />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Summary */}
            <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-gray-700 leading-relaxed text-lg">
                {project.summary}
              </p>
            </section>

            {/* Markdown Body */}
            <div className="prose prose-blue max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.content.body}</ReactMarkdown>
            </div>

          </div>

          {/* Right Column: Meta Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-6">
              
              {project.content.links && project.content.links.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2">相关链接</h3>
                  {project.content.links.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink size={14} className="mr-2" />
                      {link.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
