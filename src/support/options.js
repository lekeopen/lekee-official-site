import releaseData from '../products/releases.json' with { type: 'json' };

const ENVIRONMENT_LABELS = Object.freeze({
  'windows-modern-x64': 'Windows 10/11 64 位',
  'windows-7-x64': 'Windows 7 SP1 64 位',
  'windows-7-x86': 'Windows 7 SP1 32 位',
  'windows-x64': 'Windows 64 位',
  'macos-arm64': 'macOS Apple Silicon',
});

const releasesFor = (productId) => {
  const product = releaseData[productId];
  if (!product) return [];
  return Array.isArray(product.releases) ? product.releases : [product];
};

export const getVersionOptions = (productId) => [
  ...releasesFor(productId).map(({ tag, version }) => ({ value: tag, label: `v${version}` })),
  { value: 'other', label: '其他版本' },
];

export const getEnvironmentOptions = (productId, releaseTag) => {
  if (releaseTag === 'other') return [{ value: 'unknown', label: '无法确认环境' }];
  const release = releasesFor(productId).find(({ tag }) => tag === releaseTag);
  return [
    ...Object.keys(release?.assets || {}).map((value) => ({ value, label: ENVIRONMENT_LABELS[value] || value })),
    { value: 'unknown', label: '无法确认环境' },
  ];
};

export const isAllowedProductReleaseEnvironment = (productId, releaseTag, environmentId) =>
  getVersionOptions(productId).some(({ value }) => value === releaseTag)
  && getEnvironmentOptions(productId, releaseTag).some(({ value }) => value === environmentId);
