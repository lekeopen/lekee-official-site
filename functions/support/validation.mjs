import { PRODUCT_OPTIONS, SYSTEM_OPTIONS, ISSUE_TYPE_OPTIONS } from '../../src/support/config.js';

const allowedKeys = new Set(['product', 'version', 'system', 'issueType', 'description', 'contact', 'name', 'privacyConfirmed', 'website', 'turnstileToken']);
const values = (options) => new Set(options.map(({ value }) => value));
const products = values(PRODUCT_OPTIONS);
const systems = values(SYSTEM_OPTIONS);
const issueTypes = values(ISSUE_TYPE_OPTIONS);

export function parseSupportRequest(value) {
  const errors = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, fieldErrors: { form: '请求格式不正确' } };
  for (const key of Object.keys(value)) if (!allowedKeys.has(key)) errors.form = '请求包含未知字段';
  const string = (key, min, max, required = true) => {
    const item = typeof value[key] === 'string' ? value[key].trim() : '';
    if ((required && item.length < min) || item.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(item)) errors[key] = '请检查此字段';
    return item;
  };
  const data = {
    product: string('product', 1, 40), version: string('version', 0, 40, false),
    system: string('system', 1, 40), issueType: string('issueType', 1, 40),
    description: string('description', 20, 3000), contact: string('contact', 5, 100),
    name: string('name', 0, 50, false), website: string('website', 0, 0, false),
    turnstileToken: string('turnstileToken', 1, 2048), privacyConfirmed: value.privacyConfirmed,
  };
  if (!products.has(data.product)) errors.product = '请选择产品';
  if (!systems.has(data.system)) errors.system = '请选择操作系统';
  if (!issueTypes.has(data.issueType)) errors.issueType = '请选择问题类型';
  if (data.privacyConfirmed !== true) errors.privacyConfirmed = '请确认隐私提示';
  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };
  return { ok: true, data };
}
