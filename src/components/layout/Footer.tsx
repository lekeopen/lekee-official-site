import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Rss, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-12 pb-8 border-t border-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="block">
              <img src="/logo_footer.png" alt="乐可开源" className="h-20 w-auto object-contain" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              专注 AI 与复杂系统工程实践的技术团队，通过技术创新为客户创造价值。
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">快速导航</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">首页</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors text-sm">能力与服务</Link></li>
              <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors text-sm">产品与项目</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">关于我们</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources & Legal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">资源与支持</h3>
            <ul className="space-y-3">
              <li><Link to="/solutions" className="text-gray-400 hover:text-white transition-colors text-sm">解决方案</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">隐私政策</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Social */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">联系我们</h3>
            <ul className="space-y-3 text-gray-400 text-sm mb-6">
              <li>地址：天水市秦州区安居小区</li>
              <li>电话：19219381342</li>
              <li>邮箱：info@lekee.cc</li>
            </ul>
            
            {/* Social Icons (Compact) */}
            <div className="flex space-x-2">
              {/* GitHub */}
              <a href="https://github.com/lekeopen" target="_blank" rel="noopener noreferrer" 
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200" 
                 aria-label="GitHub">
                <Github size={16} />
              </a>
              
              {/* LinkedIn */}
              <a href="https://www.linkedin.com/company/%E5%A4%A9%E6%B0%B4%E4%B9%90%E5%8F%AF%E4%BF%A1%E6%81%AF%E6%8A%80%E6%9C%AF%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8/" target="_blank" rel="noopener noreferrer" 
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0077b5] transition-all duration-200" 
                 aria-label="LinkedIn">
                <Linkedin size={16} />
              </a>
              
              {/* WeChat */}
              <div className="relative group">
                <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#07c160] transition-all duration-200 focus:outline-none" 
                        aria-label="WeChat">
                  <MessageCircle size={16} />
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50 w-32">
                  <div className="bg-white p-2 rounded-lg shadow-xl relative">
                    <img src="/images/qrcode.jpg" alt="公众号" className="w-full h-auto object-contain" />
                    <p className="text-center text-[10px] text-gray-800 mt-1">关注公众号</p>
                    <div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 right-3"></div>
                  </div>
                </div>
              </div>

              {/* RSS */}
              <a href="/rss.xml" target="_blank" rel="noopener noreferrer" 
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#ee802f] transition-all duration-200" 
                 aria-label="RSS">
                <Rss size={16} />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright Only */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} 天水乐可信息技术有限公司. All rights reserved.
          </div>
          <div className="flex items-center space-x-4">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              陇ICP备15002697号-1
            </a>
            <span className="text-gray-700">|</span>
            <a href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=62050202000217" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors flex items-center">
              <img src="https://beian.mps.gov.cn/img/logo01.dd7ff50e.png" alt="" className="w-3 h-3 mr-1 opacity-60" />
              甘公网安备 62050202000217号
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
