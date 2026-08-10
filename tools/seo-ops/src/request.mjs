function defaultDelay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const DEFAULT_TIMEOUT_MS = 10_000;
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

export class RequestTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`SEO provider request attempt timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
    this.code = 'SEO_REQUEST_TIMEOUT';
  }
}

function bufferedResponse(response, body) {
  const result = new Response(NULL_BODY_STATUSES.has(response.status) ? null : body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  if (response.url) Object.defineProperty(result, 'url', { value: response.url });
  return result;
}

async function fetchAndBuffer(url, init, fetchImpl, timeoutMs) {
  const controller = new AbortController();
  const signal = init?.signal
    ? AbortSignal.any([init.signal, controller.signal])
    : controller.signal;
  const timeoutError = new RequestTimeoutError(timeoutMs);
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort(timeoutError);
      reject(timeoutError);
    }, timeoutMs);
  });
  const request = (async () => {
    const response = await fetchImpl(url, { ...init, signal });
    const body = await response.arrayBuffer();
    return bufferedResponse(response, body);
  })();

  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

export async function requestWithRetry(url, init, {
  fetchImpl = globalThis.fetch,
  delay = defaultDelay,
  attempts = 3,
  baseDelayMs = 500,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new TypeError('attempts must be a finite positive integer');
  }
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError('timeoutMs must be a finite positive number');
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchAndBuffer(url, init, fetchImpl, timeoutMs);
      if (!isRetryableStatus(response.status) || attempt === attempts - 1) return response;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
    }

    await delay(baseDelayMs * (2 ** attempt));
  }

  throw new Error('requestWithRetry exhausted without a response');
}
