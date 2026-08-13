export const PRODUCT_OPTIONS = Object.freeze([
  { value: 'leke-picker', label: '乐可点名' },
  { value: 'guigelei', label: '归个类' },
  { value: 'other', label: '其他产品' },
]);

export const SYSTEM_OPTIONS = Object.freeze([
  { value: 'windows-11', label: 'Windows 11' },
  { value: 'windows-10', label: 'Windows 10' },
  { value: 'windows-7', label: 'Windows 7' },
  { value: 'macos', label: 'macOS' },
  { value: 'web', label: '在线版' },
  { value: 'other', label: '其他系统' },
]);

export const ISSUE_TYPE_OPTIONS = Object.freeze([
  { value: 'install', label: '安装问题' },
  { value: 'usage', label: '使用问题' },
  { value: 'error', label: '异常反馈' },
  { value: 'feature', label: '功能建议' },
  { value: 'other', label: '其他问题' },
]);

export const optionLabel = (options, value) => options.find((option) => option.value === value)?.label;
