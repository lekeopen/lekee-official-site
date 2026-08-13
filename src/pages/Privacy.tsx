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
          <p className="text-gray-500 text-sm">更新日期：2026 年 8 月 12 日</p>

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
          <p>
            官网使用 Microsoft Clarity 统计匿名页面访问和产品按钮点击，用于判断内容与下载入口是否易用。统计事件只包含预先定义的产品与操作名称，
            <strong>不会传递学生名单、文件名、文件路径或文件内容。</strong>
            乐可点名的名单和归个类处理的文件均在本机完成；产品运行数据不进入官网统计。
          </p>
          <p>
            产品页会自动请求 GitHub Release API，以读取当前正式版本中指定安装包的公开下载次数。该请求由浏览器直接发送给 GitHub，
            GitHub 可能接收到您的 IP 地址和浏览器请求信息；官网不附加账号、名单、文件信息或其他产品本地数据，也不会在我们的服务器保存该请求结果。
            如果请求失败，页面仅显示“下载统计暂不可用”，不影响产品说明和下载链接。
          </p>
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
            <li>邮箱：contact@lekeopen.com</li>
            <li>地址：天水市秦州区安居小区</li>
          </ul>

          <h3 id="data-deletion">6. 数据删除说明 (Data Deletion Instructions)</h3>
          <p>
            根据 Facebook 平台政策，我们为您提供数据删除说明。
          </p>
          <p>
            <strong>本应用（乐可开源 / LekeOpen）目前仅用于内容发布与展示，不提供用户登录功能，也不会在我们的服务器上保存您的 Facebook 个人数据。</strong>
          </p>
          <p>
            如果您希望撤销对本应用的授权（例如用于自动化发布的授权），您可以通过以下步骤操作：
          </p>
          <ol>
            <li>进入您的 Facebook 账号的“设置与隐私” &gt; “设置”。</li>
            <li>找到“应用和网站” (Apps and Websites)。</li>
            <li>找到“乐可开源” (LekeOpen) 应用。</li>
            <li>点击“移除” (Remove) 按钮。</li>
          </ol>
          <p>
            一旦移除，本应用将无法再访问您的相关权限。由于我们要么不保存数据，要么数据仅存在于您的设备或第三方平台（如 Make.com）的临时缓存中，移除应用授权即视为完成了数据清理。
          </p>
          <p>
            如有更多疑问，请联系 contact@lekeopen.com。
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-gray-900">产品反馈信息</h2>
        <p className="mt-4 leading-7 text-gray-700">当您主动提交产品反馈时，我们仅将您填写的产品版本、操作系统、问题描述和联系方式用于处理该次咨询。请勿提交学生名单、私人文件、密码或其他敏感信息。反馈通过支持邮箱接收，不在官网数据库中另行保存；相关邮件仅按处理问题和履行必要记录义务所需的期限保留。您可通过 support@lekeopen.com 联系我们。</p>
      </section>
    </div>
  );
};

export default Privacy;
