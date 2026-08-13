import releaseData from './release-data.generated.mjs';

const PRODUCT_LABELS = {'leke-picker':'乐可点名',guigelei:'归个类'};
const ISSUE_TYPE_LABELS = {install:'安装问题',usage:'使用问题',error:'异常反馈',feature:'功能建议',other:'其他问题'};
const ENVIRONMENT_LABELS = {
  'windows-modern-x64':'Windows 10/11 64 位','windows-7-x64':'Windows 7 SP1 64 位',
  'windows-7-x86':'Windows 7 SP1 32 位','windows-x64':'Windows 64 位','macos-arm64':'macOS Apple Silicon',
};

export function buildSupportRecord(reference, data, submittedAt) {
  const product = releaseData[data.product];
  const release = (product?.releases || [product]).find(({ tag }) => tag === data.releaseTag);
  return {schemaVersion:1,reference,productId:data.product,productName:PRODUCT_LABELS[data.product]||'其他产品',releaseTag:data.releaseTag,version:release?.version||'其他版本',environmentId:data.environmentId,environmentLabel:ENVIRONMENT_LABELS[data.environmentId]||'无法确认环境',issueType:data.issueType,issueTypeLabel:ISSUE_TYPE_LABELS[data.issueType]||'其他问题',description:data.description,contact:data.contact,name:data.name,submittedAt,source:'lekeopen.com',sourceUrl:data.sourceUrl};
}
