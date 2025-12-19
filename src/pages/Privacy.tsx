import React from 'react';
import SEOMeta from '../components/common/SEOMeta';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-20">
      <SEOMeta
        title="隐私政策 - 乐可开源"
        description="天水乐可信息技术有限公司隐私政策说明。"
        url="/privacy"
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-gray-100 prose prose-blue max-w-none">
          <h1>隐私政策</h1>
          <p className="text-gray-500 text-sm">更新日期：{new Date().toLocaleDateString()}</p>

          <p>
            天水乐可信息技术有限公司（以下简称“我们”）非常重视用户的隐私保护。本隐私政策旨在向您说明我们如何收集、使用和保护您的个人信息。
          </p>

          <h3>1. 信息收集</h3>
          <p>
            本网站（lekeopen.com）主要用于展示公司技术动态、开源项目与服务能力。
            <strong>我们目前不提供用户注册、登录功能，也不会主动收集您的个人敏感信息（如姓名、电话、身份证号等）。</strong>
          </p>
          <p>
            当您通过网站提供的联系方式（如邮箱）与我们联系时，我们可能会收到您的邮件地址及邮件内容，这些信息仅用于回复您的咨询。
          </p>

          <h3>2. Cookie 与数据统计</h3>
          <p>
            我们可能会使用 Cookie 或类似的追踪技术来优化网站体验。这些技术主要用于：
          </p>
          <ul>
            <li>记住您的浏览偏好（如语言设置）。</li>
            <li>分析网站流量与访问统计（匿名数据），帮助我们改进内容。</li>
          </ul>
          <p>您可以通过浏览器设置拒绝 Cookie，但这可能会影响网站的部分功能体验。</p>

          <h3>3. 第三方链接</h3>
          <p>
            本网站可能包含指向第三方网站（如 GitHub, Facebook, 微信公众号等）的链接。我们对这些第三方网站的隐私政策不承担责任。建议您在访问这些链接时阅读其相应的隐私政策。
          </p>

          <h3>4. 信息安全</h3>
          <p>
            我们采取合理的安全措施来防止信息的丢失、不当使用或泄露。但请注意，互联网传输无法保证 100% 安全。
          </p>

          <h3>5. 联系我们</h3>
          <p>
            如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
          </p>
          <ul>
            <li>邮箱：info@lekee.cc</li>
            <li>地址：天水市秦州区安居小区</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
