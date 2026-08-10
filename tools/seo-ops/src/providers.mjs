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

function uniformResults(urls, result) {
  return urls.map((url) => ({ url, ...result }));
}

function baiduFailureUrls(payload, urls) {
  const submitted = new Set(urls);
  const failed = new Set();

  for (const field of ['not_same_site', 'not_valid']) {
    const value = payload[field];
    if (value === undefined || typeof value === 'number') continue;
    if (!Array.isArray(value)) return null;

    for (const url of value) {
      if (typeof url !== 'string' || !submitted.has(url)) return null;
      failed.add(url);
    }
  }

  return failed;
}

async function resultsForBaidu(response, urls) {
  if (!response.ok) {
    return uniformResults(urls, {
      resultClass: response.status === 429 || response.status >= 500 ? 'retry-eligible' : 'rejected',
      retryEligible: response.status === 429 || response.status >= 500,
    });
  }

  let payload;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    return uniformResults(urls, { resultClass: 'rejected', retryEligible: false });
  }

  const successCount = Number(payload?.success);
  const failedUrls = baiduFailureUrls(payload, urls);
  if (!Number.isSafeInteger(successCount) || successCount < 0 || failedUrls === null
    || successCount + failedUrls.size !== urls.length) {
    return uniformResults(urls, { resultClass: 'rejected', retryEligible: false });
  }

  return urls.map((url) => (failedUrls.has(url)
    ? { url, resultClass: 'rejected', retryEligible: false }
    : { url, resultClass: 'accepted-for-processing', retryEligible: false }));
}

function overallStatus(results) {
  const statuses = new Set(results.map((result) => result.resultClass));
  return statuses.size === 1 ? results[0].resultClass : 'partial-acceptance';
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
    const results = provider === 'baidu'
      ? await resultsForBaidu(response, eligible)
      : uniformResults(eligible, resultForIndexNow(response));
    await recordSubmission(statePath, results.map(({ url, resultClass, retryEligible }) => ({
      provider,
      url,
      acceptedAt: resultClass === 'accepted-for-processing' ? now() : null,
      resultClass,
      retryEligible,
    })));
    return displaySummary(provider, eligible.length, overallStatus(results), request.secretValues);
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : String(error), request?.secretValues || []));
  }
}
