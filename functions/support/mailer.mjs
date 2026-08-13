import { PRODUCT_OPTIONS, ISSUE_TYPE_OPTIONS, SYSTEM_OPTIONS, optionLabel } from '../../src/support/config.js';

const safeHeader = (value) => {
  if (/\r|\n/.test(value)) throw new Error('Invalid mail header');
  return value;
};

export function buildSupportEmail(reference, data, submittedAt) {
  const product = optionLabel(PRODUCT_OPTIONS, data.product) || '其他产品';
  const issueType = optionLabel(ISSUE_TYPE_OPTIONS, data.issueType) || '其他问题';
  const system = optionLabel(SYSTEM_OPTIONS, data.system) || data.system;
  const subject = safeHeader(`[产品反馈][${product}][${issueType}] ${reference}`);
  const text = [`反馈编号：${reference}`, `提交时间：${submittedAt}`, `产品：${product}`, `版本：${data.version || '未填写'}`, `操作系统：${system}`, `问题类型：${issueType}`, `称呼：${data.name || '未填写'}`, `联系方式：${data.contact}`, '', '问题描述：', data.description].join('\n');
  return { subject, text };
}

export async function sendSupportEmail(env, message, fetchImpl = fetch) {
  if (!env.RESEND_API_KEY || !env.SUPPORT_MAIL_FROM || !env.SUPPORT_MAIL_TO) return { accepted: false };
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.SUPPORT_MAIL_FROM,to:[env.SUPPORT_MAIL_TO],reply_to:env.SUPPORT_MAIL_TO,subject:message.subject,text:message.text})});
    if (!response.ok) return { accepted: false };
    const result = await response.json();
    return { accepted: typeof result?.id === 'string' && result.id.length > 0 };
  } catch {
    return { accepted: false };
  }
}
