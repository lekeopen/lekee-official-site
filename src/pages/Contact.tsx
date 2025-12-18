import React, { useState, useRef } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const form = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');

    if (!form.current) return;

    // Get environment variables
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS configuration missing');
      alert('系统配置错误：缺少 EmailJS 环境变量，请联系管理员。');
      setFormState('idle');
      return;
    }

    emailjs.sendForm(serviceId, templateId, form.current, publicKey)
      .then((result) => {
          console.log(result.text);
          setFormState('success');
      }, (error) => {
          console.log(error.text);
          setFormState('error');
          alert('发送失败，请稍后重试或直接通过邮件联系我们。');
      });
  };

  return (
    <div className="py-16 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* 顶部引导文案 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">联系我们</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            无论你是想咨询技术方案、讨论项目合作，<br className="hidden md:block"/>
            还是仅仅想和我们聊聊 AI 与软件工程，<br className="hidden md:block"/>
            我们都非常欢迎。
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧：联系方式与地图 */}
          <div className="space-y-8">
            {/* 联系方式卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">联系方式</h3>
              <div className="space-y-8">
                {/* 电话 */}
                <div className="flex items-start">
                  <div className="bg-blue-50 p-3 rounded-lg mr-4 border border-blue-100">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">电话咨询</h4>
                    <p className="text-gray-600 mt-1 font-medium text-lg">19219381342</p>
                    <p className="text-gray-500 text-sm mt-1">工作日 9:00 - 18:00</p>
                    <p className="text-gray-400 text-xs mt-2">* 如遇忙线，建议优先使用邮件或微信联系</p>
                  </div>
                </div>

                {/* 邮箱 */}
                <div className="flex items-start">
                  <div className="bg-green-50 p-3 rounded-lg mr-4 border border-green-100">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">电子邮箱</h4>
                    <p className="text-gray-600 mt-1 font-medium text-lg">info@lekee.cc</p>
                    <p className="text-gray-500 text-sm mt-1">通常在 24 小时内回复</p>
                  </div>
                </div>

                {/* 微信 */}
                <div className="flex items-start">
                  <div className="bg-green-50 p-3 rounded-lg mr-4 border border-green-100">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">微信联系</h4>
                    <p className="text-gray-600 mt-1 font-medium">19219381342</p>
                    <p className="text-gray-500 text-sm mt-1">添加请备注“官网咨询”</p>
                  </div>
                </div>

                {/* 地址 */}
                <div className="flex items-start">
                  <div className="bg-gray-50 p-3 rounded-lg mr-4 border border-gray-100">
                    <MapPin className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">办公地址</h4>
                    <p className="text-gray-600 mt-1">天水市秦州区安居小区</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 地图 */}
            <div className="rounded-xl h-64 shadow-sm border border-gray-100 overflow-hidden bg-gray-100 relative group">
               <iframe 
                 width="100%" 
                 height="100%" 
                 frameBorder="0" 
                 scrolling="no" 
                 src="https://www.openstreetmap.org/export/embed.html?bbox=105.7340,34.5810,105.7420,34.5870&amp;layer=mapnik&amp;marker=34.5838,105.7378"
                 title="Location Map"
                 className="w-full h-full"
               ></iframe>
               <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow text-xs text-gray-500">
                 * 地图预览仅供参考
               </div>
               <a 
                 href="https://www.amap.com/search?query=天水市秦州区安居小区" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1 z-10"
               >
                 <MapPin size={14} /> 在高德地图中查看
               </a>
            </div>
          </div>

          {/* 右侧：在线留言表单 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-fit">
            <h3 className="text-xl font-bold text-gray-900 mb-2">在线留言</h3>
            <p className="text-gray-500 mb-8 text-sm">
              如果你不方便直接联系，可以填写下表，我们会尽快与你联系。
            </p>
            
            {formState === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">留言发送成功！</h4>
                <p className="text-gray-600">感谢您的留言，我们会尽快与您联系。</p>
                <button 
                  onClick={() => setFormState('idle')}
                  className="mt-8 text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  发送另一条留言
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit} ref={form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      如何称呼您 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="user_name"
                      id="name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="例如：张先生 / 李经理"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-2">
                      联系方式 (电话/微信) <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="user_contact"
                      id="contact"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
                      placeholder="方便我们回访您"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                    咨询类型
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['业务咨询', '技术交流', '项目合作', '其他'].map((type) => (
                      <label key={type} className="cursor-pointer">
                        <input type="radio" name="consult_type" value={type} className="peer sr-only" defaultChecked={type === '业务咨询'} />
                        <div className="text-center py-2 border border-gray-200 rounded-lg text-sm text-gray-600 peer-checked:bg-blue-50 peer-checked:text-blue-600 peer-checked:border-blue-200 hover:bg-gray-50 transition-all">
                          {type}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    想聊点什么 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    id="message"
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white resize-none"
                    placeholder="请简单描述您的需求、问题或合作意向..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-blue-200 ${
                    formState === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {formState === 'submitting' ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      正在发送...
                    </span>
                  ) : (
                    <>
                      发送留言 <Send size={18} className="ml-2" />
                    </>
                  )}
                </button>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  * 我们承诺对您的信息严格保密，仅用于沟通回复。
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
