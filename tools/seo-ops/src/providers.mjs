import { canonicalUrls } from './inventory.mjs';
import { requestWithRetry } from './request.mjs';
import { redact } from './safety.mjs';
import { recordSubmission } from './state.mjs';

const BAIDU_ENDPOINT = 'https://data.zz.baidu.com/urls';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;
const INDEXNOW_URL_LIMIT = 10_000;

function eligibleUrls(urls) {
  if (!Array.isArray(urls)) throw new TypeError('urls must be an array');
  return canonicalUrls(urls.map((canonical) => ({ canonical })));
}

function requiredConfig(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required configuration: ${name}`);
  }
  return value;
}

function baiduConfig(config = {}) {
  if (typeof config.site !== 'string' || !config.site || typeof config.token !== 'string' || !config.token) {
    throw new Error('Missing required configuration: BAIDU_SITE and BAIDU_SUBMIT_TOKEN');
  }
  const site = config.site;
  const token = config.token;
  return { site, token };
}

function indexNowConfig(config = {}) {
  const key = requiredConfig(config.key, 'INDEXNOW_KEY');
  if (!INDEXNOW_KEY_PATTERN.test(key)) {
    throw new Error('INDEXNOW_KEY must be 8–128 characters containing only letters, numbers, or hyphens');
  }
  if (config.keyLocation !== undefined && (typeof config.keyLocation !== 'string' || !config.keyLocation)) {
    throw new Error('INDEXNOW_KEY_LOCATION must be a non-empty URL when provided');
  }
  return { key, keyLocation: config.keyLocation };
}

function nonEmptyEligibleUrls(urls) {
  const eligible = eligibleUrls(urls);
  if (eligible.length === 0) throw new Error('No eligible canonical URLs to submit');
  return eligible;
}

export function buildBaiduRequest(urls, config) {
  const eligible = nonEmptyEligibleUrls(urls);
  const { site, token } = baiduConfig(config);
  const query = new URLSearchParams({ site, token });

  return {
    url: `${BAIDU_ENDPOINT}?${query.toString()}`,
    init: {
      method: 'POST',
      headers: { 'content-type': 'text/plain; charset=utf-8' },
      body: eligible.join('\n'),
    },
    secretValues: [token],
  };
}

export function buildIndexNowRequest(urls, config) {
  const eligible = nonEmptyEligibleUrls(urls);
  if (eligible.length > INDEXNOW_URL_LIMIT) {
    throw new RangeError('IndexNow accepts at most 10,000 URLs per request');
  }

  const { key, keyLocation } = indexNowConfig(config);
  const body = {
    host: new URL(eligible[0]).host,
    key,
    ...(keyLocation ? { keyLocation } : {}),
    urlList: eligible,
  };

  return {
    url: INDEXNOW_ENDPOINT,
    init: {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    },
    secretValues: [key],
  };
}

function requestFor(provider, urls, config) {
  if (provider === 'baidu') return buildBaiduRequest(urls, config);
  if (provider === 'indexnow') return buildIndexNowRequest(urls, config);
  throw new Error(`Unsupported provider: ${provider}`);
}

function validateProviderConfig(provider, config) {
  if (provider === 'baidu') return baiduConfig(config);
  if (provider === 'indexnow') return indexNowConfig(config);
  throw new Error(`Unsupported provider: ${provider}`);
}

function assertSupportedProvider(provider) {
  if (!['baidu', 'indexnow'].includes(provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

function resultForIndexNow(response) {
  if (response.status === 200 || response.status === 202) {
    return { resultClass: 'accepted-for-processing', retryEligible: false };
  }
  return {
    resultClass: response.status === 429 || response.status >= 500 ? 'retry-eligible' : 'rejected',
    retryEligible: response.status === 429 || response.status >= 500,
  };
}

async function resultForBaidu(response, submittedCount) {
  if (!response.ok) {
    return {
      resultClass: response.status === 429 || response.status >= 500 ? 'retry-eligible' : 'rejected',
      retryEligible: response.status === 429 || response.status >= 500,
    };
  }

  let payload;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    return { resultClass: 'rejected', retryEligible: false };
  }

  return Number(payload?.success) === submittedCount
    ? { resultClass: 'accepted-for-processing', retryEligible: false }
    : { resultClass: 'rejected', retryEligible: false };
}

function displaySummary(provider, urlCount, status, secretValues = []) {
  return redact({ provider, urlCount, status }, secretValues);
}

export async function submitProvider(provider, urls, {
  execute = false,
  dryRun = !execute,
  config = {},
  fetchImpl,
  statePath = '.seo-ops/state.json',
  requestOptions = {},
  now = () => new Date().toISOString(),
} = {}) {
  const eligible = eligibleUrls(urls);
  assertSupportedProvider(provider);
  if (dryRun || !execute) return displaySummary(provider, eligible.length, 'dry-run');
  validateProviderConfig(provider, config);
  if (eligible.length === 0) return displaySummary(provider, 0, 'nothing-to-submit');

  let request;
  try {
    request = requestFor(provider, eligible, config);
    const response = await requestWithRetry(request.url, request.init, { fetchImpl, ...requestOptions });
    const result = provider === 'baidu'
      ? await resultForBaidu(response, eligible.length)
      : resultForIndexNow(response);
    const acceptedAt = result.resultClass === 'accepted-for-processing' ? now() : null;
    await recordSubmission(statePath, eligible.map((url) => ({
      provider,
      url,
      acceptedAt,
      resultClass: result.resultClass,
      retryEligible: result.retryEligible,
    })));
    return displaySummary(provider, eligible.length, result.resultClass, request.secretValues);
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : String(error), request?.secretValues || []));
  }
}
