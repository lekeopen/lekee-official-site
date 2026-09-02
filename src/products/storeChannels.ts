export type StoreChannelStatus = 'verified' | 'lagging' | 'unavailable';

export interface ProductStoreChannel {
  provider: 'microsoft';
  storeId: string;
  url: string;
  verifiedVersion: string;
  status: StoreChannelStatus;
}

const MICROSOFT_STORE_CHANNEL = {
  provider: 'microsoft',
  storeId: '9P8078B19P1H',
  url: 'https://apps.microsoft.com/detail/9P8078B19P1H',
  verifiedVersion: '1.1.1.0',
} as const;

const PRODUCT_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const STORE_VERSION_PATTERN = /^\d+\.\d+\.\d+\.\d+$/;

export function storeStatusForVersion(productVersion: string, verifiedVersion: string): StoreChannelStatus {
  if (!PRODUCT_VERSION_PATTERN.test(productVersion) || !STORE_VERSION_PATTERN.test(verifiedVersion)) {
    return 'unavailable';
  }

  const storeProductVersion = verifiedVersion.split('.').slice(0, 3).join('.');
  return storeProductVersion === productVersion ? 'verified' : 'lagging';
}

export function getMicrosoftStoreChannel(productVersion: string): ProductStoreChannel {
  return {
    ...MICROSOFT_STORE_CHANNEL,
    status: storeStatusForVersion(productVersion, MICROSOFT_STORE_CHANNEL.verifiedVersion),
  };
}
