import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Github, Linkedin, Rss } from 'lucide-react'; 

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white pt-10 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="mb-4">
              <img src="/logo_footer.png" alt="乐可开源 Footer Logo" className="h-16 w-auto object-contain" />
            </div>
            <h3 className="text-xl font-bold mb-2">乐可开源</h3>
            <p className="text-gray-400 mb-4">
              专注 AI 与复杂系统工程实践的技术团队，通过技术创新为客户创造价值。
            </p>
            <p className="text-xs text-gray-500">
              天水乐可信息技术有限公司
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/services" className="text-gray-400 hover:text-white transition-colors">
                  能力与服务
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-white transition-colors">
                  产品与项目
                </Link>
              </li>
              <li>
                <Link to="/solutions" className="text-gray-400 hover:text-white transition-colors">
                  解决方案
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  关于我们
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">联系我们</h3>
            <ul className="space-y-2 text-gray-400">
              <li>地址：天水市秦州区安居小区</li>
              <li>电话：19219381342</li>
              <li>邮箱：info@lekee.cc</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 text-gray-400 text-sm flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Left: Copyright & ICP */}
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-2 md:space-y-0 md:space-x-4 flex-wrap">
            <span>&copy; {new Date().getFullYear()} 天水乐可信息技术有限公司. All rights reserved.</span>
            <span className="hidden md:inline">|</span>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              陇ICP备15002697号-1
            </a>
            <span className="hidden md:inline">|</span>
            <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=62050202000217" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center">
              <img src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" alt="备案图标" className="w-4 h-4 mr-1" />
              甘公网安备 62050202000217号
            </a>
          </div>

          {/* Right: Social Links */}
          <div className="flex space-x-4">
            <a href="https://github.com/lekeopen" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
              <Github size={20} />
            </a>
            <a href="https://www.facebook.com/lekeopen/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="https://weibo.com/lekeopen" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Weibo">
              {/* Custom Weibo Icon using SVG directly since lucide-react might not have it */}
              <svg viewBox="0 0 24 24" fill="currentColor" height="20" width="20">
                <path d="M20.12 10.79c-.31-.07-.62.13-.69.44-.48 2.12-2.4 3.69-4.66 3.69-2.76 0-5-2.24-5-5s2.24-5 5-5c1.07 0 2.05.35 2.84.94.25.19.61.14.8-.11.19-.25.14-.61-.11-.8C17.29 4.14 16.18 3.73 15 3.73 11.13 3.73 8 6.87 8 10.5S11.13 17.27 15 17.27c2.97 0 5.51-1.92 6.36-4.67.07-.31-.13-.62-.44-.69zM12 10.5c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </a>
            <a href="/rss.xml" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-colors" aria-label="RSS Feed">
              <Rss size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
