import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Rss, MessageCircle } from 'lucide-react';

const DiscordIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.699.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0321-.0544c.5007-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0956 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0956 2.1568 2.419 0 1.3332-.946 2.419-2.1569 2.419z"/>
  </svg>
);

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
              <li><Link to="/news" className="text-gray-400 hover:text-white transition-colors text-sm">公司动态</Link></li>
              <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors text-sm">产品与项目</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-white transition-colors text-sm">能力与服务</Link></li>
            </ul>
          </div>

          {/* Col 3: Resources & Legal */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">资源与支持</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm">关于我们</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">隐私政策</Link></li>
              <li><Link to="/solutions" className="text-gray-400 hover:text-white transition-colors text-sm">解决方案</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Social */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">联系我们</h3>
            <ul className="space-y-3 text-gray-400 text-sm mb-6">
              <li>地址：天水市秦州区安居小区</li>
              <li>电话：19219381342</li>
              <li>邮箱：contact@lekeopen.com</li>
            </ul>
            
            {/* Social Icons (Compact) */}
            <div className="flex space-x-2">
              {/* GitHub */}
              <a href="https://github.com/lekeopen" target="_blank" rel="noopener noreferrer"
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
                 aria-label="GitHub">
                <Github size={16} />
              </a>
              
              {/* Twitter/X */}
              <a href="https://x.com/lekeopen" target="_blank" rel="noopener noreferrer"
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black transition-all duration-200"
                 aria-label="Twitter/X">
                <Twitter size={16} />
              </a>

              {/* Discord */}
              <a href="https://discord.gg/s5dg3QYq7C" target="_blank" rel="noopener noreferrer"
                 className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#5865F2] transition-all duration-200"
                 aria-label="Discord">
                <DiscordIcon size={16} />
              </a>
              
              {/* WeChat */}
              <div className="relative group">
                <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#07c160] transition-all duration-200 focus:outline-none" 
                        aria-label="WeChat">
                  <MessageCircle size={16} />
                </button>
                <div className="absolute bottom-full right-0 mb-0 hidden group-hover:block z-50 w-40">
                  <div className="bg-white p-[0] rounded-lg shadow-xl relative">
                    <img src="/images/qrcode.jpg" alt="公众号" className="w-full h-auto object-contain rounded-md block" />
                    <p className="text-center text-[12px] text-gray-500 py-1">
                      扫码关注 <span className="text-[#8213f1] font-bold">乐可开源</span> 公众号
                    </p>
                    <div className="w-2 h-2 bg-white transform rotate-45 absolute -bottom-1 right-3 border-r border-b border-gray-100"></div>
                  </div>
                </div>
              </div>

              {/* RSS */}
              <Link to="/rss.xml" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#ee802f] transition-all duration-200" aria-label="RSS">
                <Rss size={16} />
              </Link>
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
