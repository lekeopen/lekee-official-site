import { canonicalUrls } from './inventory.mjs';
import { RequestTimeoutError, requestWithRetry } from './request.mjs';
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

function validateKeyLocation(keyLocation, urls) {
  let location;
  try {
    location = new URL(keyLocation);
  } catch {
    throw new Error('INDEXNOW_KEY_LOCATION must be an absolute HTTPS URL within the submitted URL scope');
  }
  if (location.protocol !== 'https:' || location.username || location.password
    || /[?#]/.test(keyLocation)
    || location.search || location.hash || location.pathname.endsWith('/')) {
    throw new Error('INDEXNOW_KEY_LOCATION must be an absolute HTTPS URL without credentials, query, hash, or a directory path');
  }

  const scope = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  const inScope = urls.every((url) => {
    const submitted = new URL(url);
    return submitted.origin === location.origin && submitted.pathname.startsWith(scope);
  });
  if (!inScope) {
    throw new Error('INDEXNOW_KEY_LOCATION must use the production host and cover every submitted URL path');
  }
  return location.href;
}

function indexNowConfig(config = {}, urls = []) {
  const key = requiredConfig(config.key, 'INDEXNOW_KEY');
  if (!INDEXNOW_KEY_PATTERN.test(key)) {
    throw new Error('INDEXNOW_KEY must be 8–128 characters containing only letters, numbers, or hyphens');
  }
  if (config.keyLocation !== undefined && (typeof config.keyLocation !== 'string' || !config.keyLocation)) {
    throw new Error('INDEXNOW_KEY_LOCATION must be a non-empty URL when provided');
  }
  return {
    key,
    keyLocation: config.keyLocation ? validateKeyLocation(config.keyLocation, urls) : undefined,
  };
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

  const { key, keyLocation } = indexNowConfig(config, eligible);
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

function validateProviderConfig(provider, config, urls) {
  if (provider === 'baidu') return baiduConfig(config);
  if (provider === 'indexnow') return indexNowConfig(config, urls);
  throw new Error(`Unsupported provider: ${provider}`);
}

function assertSupportedProvider(provider) {
  if (!['baidu', 'indexnow'].includes(provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

function httpFailure(status) {
  if (status === 401 || status === 403) {
    return {
      resultClass: 'rejected',
      retryEligible: false,
      errorClass: 'authentication-error',
      retryGuidance: 'Verify the provider credential and site permission before retrying.',
    };
  }
  if (status === 400 || status === 422) {
    return {
      resultClass: 'rejected',
      retryEligible: false,
      errorClass: 'validation-error',
      retryGuidance: 'Correct the submitted canonical URLs or provider configuration before retrying.',
    };
  }
  if (status === 429) {
    return {
      resultClass: 'retry-eligible',
      retryEligible: true,
      errorClass: 'rate-limit',
      retryGuidance: 'Retry later after the provider rate-limit window has elapsed.',
    };
  }
  if (status >= 500 && status <= 599) {
    return {
      resultClass: 'retry-eligible',
      retryEligible: true,
      errorClass: 'provider-unavailable',
      retryGuidance: 'Retry later after the provider service has recovered.',
    };
  }
  return {
    resultClass: 'rejected',
    retryEligible: false,
    errorClass: 'provider-http-error',
    retryGuidance: 'Review the provider configuration and request eligibility before retrying.',
  };
}

function resultForIndexNow(response) {
  if (response.status === 200 || response.status === 202) {
    return {
      resultClass: 'accepted-for-processing',
      retryEligible: false,
    };
  }
  return httpFailure(response.status);
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

function rejectedBaiduOutcome(errorClass, retryGuidance) {
  return {
    resultClass: 'rejected',
    retryEligible: false,
    errorClass,
    retryGuidance,
  };
}

async function outcomeForBaidu(response, urls) {
  if (!response.ok) {
    const failure = httpFailure(response.status);
    return { ...failure, results: uniformResults(urls, failure) };
  }

  let payload;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    const failure = rejectedBaiduOutcome(
      'provider-response-error',
      'Inspect provider availability and retry only after confirming the response contract.',
    );
    return { ...failure, results: uniformResults(urls, failure) };
  }

  if (payload && typeof payload === 'object'
    && (Object.hasOwn(payload, 'error') || Object.hasOwn(payload, 'error_code'))) {
    const failure = rejectedBaiduOutcome(
      'provider-application-error',
      'Review the Baidu site configuration and request eligibility before retrying.',
    );
    return { ...failure, results: uniformResults(urls, failure) };
  }

  const successCount = Number(payload?.success);
  const failedUrls = baiduFailureUrls(payload, urls);
  if (!Number.isSafeInteger(successCount) || successCount < 0 || failedUrls === null
    || successCount + failedUrls.size !== urls.length) {
    const failure = rejectedBaiduOutcome(
      'provider-response-error',
      'Inspect provider availability and retry only after confirming the response contract.',
    );
    return { ...failure, results: uniformResults(urls, failure) };
  }

  const results = urls.map((url) => (failedUrls.has(url)
    ? { url, resultClass: 'rejected', retryEligible: false }
    : { url, resultClass: 'accepted-for-processing', retryEligible: false }));
  const status = overallStatus(results);
  if (status === 'partial-acceptance') {
    return {
      results,
      resultClass: status,
      retryEligible: false,
      errorClass: 'partial-acceptance',
      retryGuidance: 'Correct the rejected URLs, then explicitly retry only those canonical URLs.',
    };
  }
  return { results, resultClass: status, retryEligible: false };
}

function overallStatus(results) {
  const statuses = new Set(results.map((result) => result.resultClass));
  return statuses.size === 1 ? results[0].resultClass : 'partial-acceptance';
}

function displaySummary(provider, urlCount, outcome, secretValues = []) {
  const summary = {
    provider,
    urlCount,
    status: outcome.resultClass,
    ...(outcome.errorClass ? {
      errorClass: outcome.errorClass,
      retryEligible: outcome.retryEligible,
      retryGuidance: outcome.retryGuidance,
    } : {}),
  };
  return redact(summary, secretValues);
}

function transportFailure(error) {
  const timeout = error instanceof RequestTimeoutError || error?.code === 'SEO_REQUEST_TIMEOUT';
  return {
    resultClass: 'retry-eligible',
    retryEligible: true,
    errorClass: timeout ? 'network-timeout' : 'network-error',
    retryGuidance: 'Retry later after checking network reachability and provider availability.',
  };
}

function stateRecords(provider, results, now) {
  return results.map(({ url, resultClass, retryEligible }) => ({
    provider,
    url,
    acceptedAt: resultClass === 'accepted-for-processing' ? now() : null,
    resultClass,
    retryEligible,
  }));
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
  if (dryRun || !execute) return displaySummary(provider, eligible.length, { resultClass: 'dry-run' });
  validateProviderConfig(provider, config, eligible);
  if (eligible.length === 0) return displaySummary(provider, 0, { resultClass: 'nothing-to-submit' });

  let request;
  try {
    request = requestFor(provider, eligible, config);
  } catch (error) {
    throw new Error(redact(error instanceof Error ? error.message : String(error), request?.secretValues || []));
  }

  let outcome;
  try {
    const response = await requestWithRetry(request.url, request.init, { fetchImpl, ...requestOptions });
    if (provider === 'baidu') {
      outcome = await outcomeForBaidu(response, eligible);
    } else {
      const result = resultForIndexNow(response);
      outcome = { ...result, results: uniformResults(eligible, result) };
    }
  } catch (error) {
    const failure = transportFailure(error);
    outcome = { ...failure, results: uniformResults(eligible, failure) };
  }

  await recordSubmission(statePath, stateRecords(provider, outcome.results, now));
  return displaySummary(provider, eligible.length, outcome, request.secretValues);
}
