import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Github, Linkedin, Rss, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-10 pb-6 border-t border-gray-900">
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
            <a href="https://www.linkedin.com/company/%E5%A4%A9%E6%B0%B4%E4%B9%90%E5%8F%AF%E4%BF%A1%E6%81%AF%E6%8A%80%E6%9C%AF%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="https://www.facebook.com/lekeopen/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            {/* WeChat with Hover QR Code */}
            <div className="relative group">
              <button className="text-gray-400 hover:text-green-500 transition-colors focus:outline-none flex items-center" aria-label="WeChat">
                <MessageCircle size={20} />
              </button>
              
              {/* QR Code Popup */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 hidden group-hover:block z-50 w-36">
                <div className="bg-white p-2 rounded-lg shadow-xl relative">
                  <img src="/images/qrcode.jpg" alt="关注乐可开源公众号" className="w-32 h-32 object-contain mx-auto" />
                  <p className="text-center text-[10px] text-gray-800 mt-1 whitespace-nowrap font-medium">扫描关注乐可开源公众号</p>
                  
                  {/* Arrow */}
                  <div className="w-3 h-3 bg-white transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
                </div>
              </div>
            </div>

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
