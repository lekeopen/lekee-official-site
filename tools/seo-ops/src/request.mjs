function defaultDelay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function isRetryableStatus(status) {
  return status === 429 || (status >= 500 && status <= 599);
}

export async function requestWithRetry(url, init, {
  fetchImpl = globalThis.fetch,
  delay = defaultDelay,
  attempts = 3,
  baseDelayMs = 500,
} = {}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new TypeError('attempts must be a finite positive integer');
  }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      if (!isRetryableStatus(response.status) || attempt === attempts - 1) return response;
    } catch (error) {
      if (attempt === attempts - 1) throw error;
    }

    await delay(baseDelayMs * (2 ** attempt));
  }

  throw new Error('requestWithRetry exhausted without a response');
}
