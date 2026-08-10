import assert from 'node:assert/strict';
import test from 'node:test';

import { redact } from '../tools/seo-ops/src/safety.mjs';
import { isRetryableStatus, requestWithRetry } from '../tools/seo-ops/src/request.mjs';

test('redact recursively replaces exact secret substrings in objects, arrays, URLs, and errors', () => {
  const secret = 'secret';
  const error = new Error(`request failed: ${secret}`);
  error.stack = `Error: request failed: ${secret}`;

  const result = redact({
    url: 'https://example.test/?token=secret',
    values: [`prefix-${secret}-suffix`],
    endpoint: new URL('https://example.test/?token=secret'),
    error,
  }, [secret]);

  assert.deepEqual(result.url, 'https://example.test/?token=[REDACTED]');
  assert.deepEqual(result.values, ['prefix-[REDACTED]-suffix']);
  assert.equal(result.endpoint.href, 'https://example.test/?token=[REDACTED]');
  assert.equal(result.error.message, 'request failed: [REDACTED]');
  assert.equal(result.error.stack, 'Error: request failed: [REDACTED]');
});

test('redact returns a safe string when redacting a complete URL would make it invalid', () => {
  const url = new URL('https://example.test/?token=secret');

  assert.equal(redact(url, [url.href]), '[REDACTED]');
});

test('isRetryableStatus identifies only 429 and server errors as retryable HTTP statuses', () => {
  assert.equal(isRetryableStatus(429), true);
  assert.equal(isRetryableStatus(500), true);
  assert.equal(isRetryableStatus(599), true);
  assert.equal(isRetryableStatus(401), false);
  assert.equal(isRetryableStatus(400), false);
  assert.equal(isRetryableStatus(600), false);
});

test('requestWithRetry retries network errors with bounded exponential delays', async () => {
  let calls = 0;
  const delays = [];
  const response = await requestWithRetry('https://example.test/network', {}, {
    fetchImpl: async () => {
      calls += 1;
      if (calls < 3) throw new Error('offline');
      return new Response('ok', { status: 200 });
    },
    delay: async (milliseconds) => delays.push(milliseconds),
    attempts: 3,
    baseDelayMs: 500,
  });

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test('requestWithRetry retries 429 and 5xx responses and returns the final response', async () => {
  const statuses = [429, 503, 201];
  const delays = [];
  const response = await requestWithRetry('https://example.test/retryable', {}, {
    fetchImpl: async () => new Response(null, { status: statuses.shift() }),
    delay: async (milliseconds) => delays.push(milliseconds),
    attempts: 3,
    baseDelayMs: 500,
  });

  assert.equal(response.status, 201);
  assert.deepEqual(delays, [500, 1000]);
});

test('requestWithRetry returns non-retryable responses without retrying', async () => {
  for (const status of [400, 401]) {
    let calls = 0;
    const response = await requestWithRetry('https://example.test/non-retryable', {}, {
      fetchImpl: async () => {
        calls += 1;
        return new Response(null, { status });
      },
      delay: async () => assert.fail('delay should not be called'),
      attempts: 3,
      baseDelayMs: 500,
    });

    assert.equal(response.status, status);
    assert.equal(calls, 1);
  }
});

test('requestWithRetry rejects invalid or unbounded attempt counts before fetching', async () => {
  for (const attempts of [0, -1, NaN, Infinity, 1.5, '3']) {
    let calls = 0;
    await assert.rejects(
      requestWithRetry('https://example.test/invalid-attempts', {}, {
        fetchImpl: async () => {
          calls += 1;
          return new Response(null, { status: 200 });
        },
        attempts,
      }),
      TypeError,
    );
    assert.equal(calls, 0);
  }
});

test('requestWithRetry preserves a final retryable HTTP response after the attempt limit', async () => {
  let calls = 0;
  const delays = [];
  const response = await requestWithRetry('https://example.test/final-response', {}, {
    fetchImpl: async () => {
      calls += 1;
      return new Response(null, { status: 503 });
    },
    delay: async (milliseconds) => delays.push(milliseconds),
    attempts: 3,
    baseDelayMs: 500,
  });

  assert.equal(response.status, 503);
  assert.equal(calls, 3);
  assert.deepEqual(delays, [500, 1000]);
});

test('requestWithRetry makes at most three attempts and throws the final network error without a final delay', async () => {
  let calls = 0;
  const delays = [];
  const finalError = new Error('still offline');

  await assert.rejects(
    requestWithRetry('https://example.test/fail', {}, {
      fetchImpl: async () => {
        calls += 1;
        throw finalError;
      },
      delay: async (milliseconds) => delays.push(milliseconds),
      attempts: 3,
      baseDelayMs: 500,
    }),
    finalError,
  );

  assert.equal(calls, 3);
  assert.deepEqual(delays, [500, 1000]);
});
