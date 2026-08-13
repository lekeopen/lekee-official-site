import releaseData from './release-data.generated.mjs';
import { PRODUCT_OPTIONS, ISSUE_TYPE_OPTIONS, optionLabel } from '../../src/support/config.js';
import { getEnvironmentOptions } from '../../src/support/options.js';

export function buildSupportRecord(reference, data, submittedAt) {
  const product = releaseData[data.product];
  const release = (product?.releases || [product]).find(({ tag }) => tag === data.releaseTag);
  return {schemaVersion:1,reference,productId:data.product,productName:optionLabel(PRODUCT_OPTIONS,data.product)||'其他产品',releaseTag:data.releaseTag,version:release?.version||'其他版本',environmentId:data.environmentId,environmentLabel:getEnvironmentOptions(data.product,data.releaseTag).find(({value})=>value===data.environmentId)?.label||'无法确认环境',issueType:data.issueType,issueTypeLabel:optionLabel(ISSUE_TYPE_OPTIONS,data.issueType)||'其他问题',description:data.description,contact:data.contact,name:data.name,submittedAt,source:'lekeopen.com',sourceUrl:data.sourceUrl};
}
