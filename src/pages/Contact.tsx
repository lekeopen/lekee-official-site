import React, { useState, useRef } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import SEOMeta from '../components/common/SEOMeta';

const Contact: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const form = useRef<HTMLFormElement>(null);

  // 验证规则
  const validateForm = (formData: FormData): boolean => {
    const newErrors: Record<string, string> = {};
    
    const name = (formData.get('user_name') as string)?.trim() || '';
    const contact = (formData.get('user_contact') as string)?.trim() || '';
    const message = (formData.get('message') as string)?.trim() || '';

    // 名字验证
    if (!name) {
      newErrors.user_name = '请填写您的称呼';
    } else if (name.length < 2) {
      newErrors.user_name = '称呼至少需要2个字符';
    } else if (name.length > 50) {
      newErrors.user_name = '称呼不能超过50个字符';
    } else if (!/^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/.test(name)) {
      newErrors.user_name = '称呼只能包含中文、英文和数字';
    }

    // 联系方式验证
    if (!contact) {
      newErrors.user_contact = '请填写联系方式';
    } else if (contact.length > 100) {
      newErrors.user_contact = '联系方式不能超过100个字符';
    } else {
      // 验证是否为有效的邮箱或微信号格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const wechatRegex = /^[a-zA-Z0-9_-]{5,32}$/;
      const phoneRegex = /^1[3-9]\d{9}$/;
      
      if (!emailRegex.test(contact) && !wechatRegex.test(contact) && !phoneRegex.test(contact)) {
        newErrors.user_contact = '请输入有效的邮箱、微信号或手机号';
      }
    }

    // 消息内容验证
    if (!message) {
      newErrors.message = '请输入需求描述';
    } else if (message.length < 10) {
      newErrors.message = '需求描述至少需要10个字符';
    } else if (message.length > 2000) {
      newErrors.message = '需求描述不能超过2000个字符';
    } else if (/^(.)\1{9,}$/m.test(message)) {
      // 检测重复字符（防止垃圾内容如"aaaaaaaaaa"）
      newErrors.message = '请输入有效的需求描述';
    } else if (/[^\u4e00-\u9fa5a-zA-Z0-9\s.,;:!?，。；：！？—\-\n\r()（）\[\]【】""''""]+/.test(message)) {
      // 过滤特殊符号
      newErrors.message = '需求描述包含不允许的字符';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.current) return;
    
    const formData = new FormData(form.current);
    
    // 验证表单
    if (!validateForm(formData)) {
      return;
    }

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
    <div className="py-16 bg-gray-50">
      <SEOMeta
        title="联系我们 | 乐可开源"
        description="乐可开源联系方式。如果您有清晰的业务目标但缺乏技术实现能力，欢迎与我们联系。"
        url="/contact"
        type="website"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* 左侧：信息区 (占 5 列) */}
          <div className="lg:col-span-5 space-y-10">
            
            {/* 标题与引导 */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-6">联系我们</h1>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                如果您有清晰的业务目标，但缺乏技术实现能力；或者现有系统遇到了具体的性能瓶颈，欢迎与我们联系。
              </p>
              <div className="bg-blue-50 text-blue-900 p-4 rounded-lg text-sm leading-relaxed border border-blue-100">
                <strong>💡 建议您在联系前先梳理：</strong><br/>
                您的核心业务流程是什么？期望解决什么具体痛点？<br/>
                <span className="text-blue-700/70 text-xs mt-1 block">(清晰的需求有助于我们更高效地为您提供方案)</span>
              </div>
            </div>

            {/* 联系方式列表 (更紧凑) */}
            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="w-6 h-6 text-blue-600 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">Email (推荐)</h3>
                  <p className="text-gray-600 font-medium select-all">contact@lekeopen.com</p>                  <p className="text-xs text-gray-400 mt-1">技术负责人通常在 24 小时内回复</p>
                </div>
              </div>
                            <div className="flex items-start">
                <MessageSquare className="w-6 h-6 text-green-600 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">微信 / 电话</h3>
                  <p className="text-gray-600 font-medium select-all">19219381342</p>
                  <p className="text-xs text-gray-400 mt-1">添加请备注“业务咨询”</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-6 h-6 text-gray-600 mt-1 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900">办公地址</h3>
                  <p className="text-gray-600">天水市秦州区安居小区</p>
                </div>
              </div>
            </div>

          </div>

          {/* 右侧：表单区 (占 7 列) */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">留言咨询</h2>
            
            {formState === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">已收到！</h4>
                <p className="text-gray-600">我们会尽快通过邮件或微信回复您。</p>
                <button 
                  onClick={() => setFormState('idle')}
                  className="mt-8 text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  返回
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit} ref={form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                      称呼
                    </label>
                    <input
                      required
                      type="text"
                      name="user_name"
                      id="name"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${
                        errors.user_name ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="例如：张先生"
                    />
                    {errors.user_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.user_name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contact" className="block text-sm font-semibold text-gray-700 mb-2">
                      联系方式 <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="user_contact"
                      id="contact"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white ${
                        errors.user_contact ? 'border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="邮箱、微信号或手机号"
                    />
                    {errors.user_contact && (
                      <p className="text-red-500 text-sm mt-1">{errors.user_contact}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    需求描述 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    id="message"
                    name="message"
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 focus:bg-white resize-none ${
                      errors.message ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="请简述您的业务背景和想解决的问题..."
                  ></textarea>
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {(form.current?.message?.value?.length || 0)}/2000
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={formState === 'submitting'}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-blue-100 ${
                    formState === 'submitting' ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {formState === 'submitting' ? '发送中...' : '发送留言'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
