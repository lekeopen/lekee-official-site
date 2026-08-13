import { PRODUCT_OPTIONS, ISSUE_TYPE_OPTIONS } from '../../src/support/config.js';
import { isAllowedProductReleaseEnvironment } from '../../src/support/options.js';

const allowedKeys = new Set(['product','releaseTag','environmentId','issueType','description','contact','name','privacyConfirmed','website','turnstileToken','sourceUrl']);
const values = (options) => new Set(options.map(({ value }) => value));
const products = values(PRODUCT_OPTIONS), issueTypes = values(ISSUE_TYPE_OPTIONS);

export function parseSupportRequest(value) {
  const errors = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok:false, fieldErrors:{form:'请求格式不正确'} };
  for (const key of Object.keys(value)) if (!allowedKeys.has(key)) errors.form='请求包含未知字段';
  const string=(key,min,max,required=true)=>{const item=typeof value[key]==='string'?value[key].trim():'';if((required&&item.length<min)||item.length>max||/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(item))errors[key]='请检查此字段';return item};
  const data={product:string('product',1,40),releaseTag:string('releaseTag',1,40),environmentId:string('environmentId',1,80),issueType:string('issueType',1,40),description:string('description',20,3000),contact:string('contact',5,100),name:string('name',0,50,false),website:string('website',0,0,false),turnstileToken:string('turnstileToken',1,2048),sourceUrl:string('sourceUrl',8,500),privacyConfirmed:value.privacyConfirmed};
  if(!products.has(data.product))errors.product='请选择产品';
  if(!isAllowedProductReleaseEnvironment(data.product,data.releaseTag,data.environmentId))errors.environmentId='版本与运行环境不匹配';
  if(!issueTypes.has(data.issueType))errors.issueType='请选择问题类型';
  try { const url=new URL(data.sourceUrl); if(url.origin!=='https://lekeopen.com') throw new Error(); } catch { errors.sourceUrl='反馈来源不正确'; }
  if(data.privacyConfirmed!==true)errors.privacyConfirmed='请确认隐私提示';
  return Object.keys(errors).length?{ok:false,fieldErrors:errors}:{ok:true,data};
}
