const REDACTED = '[REDACTED]';

function redactString(value, secrets) {
  return secrets.reduce((result, secret) => result.replaceAll(secret, REDACTED), value);
}

function normalizedSecrets(secrets) {
  return [...new Set(secrets.filter((secret) => typeof secret === 'string' && secret.length > 0))]
    .sort((left, right) => right.length - left.length);
}

function redactError(error, secrets, seen) {
  const redacted = new Error(redactString(error.message, secrets));
  seen.set(error, redacted);
  redacted.name = redactString(error.name, secrets);

  if (typeof error.stack === 'string') {
    redacted.stack = redactString(error.stack, secrets);
  }

  if ('cause' in error) {
    redacted.cause = redactValue(error.cause, secrets, seen);
  }

  for (const [key, value] of Object.entries(error)) {
    if (key !== 'cause') redacted[redactString(key, secrets)] = redactValue(value, secrets, seen);
  }

  return redacted;
}

function redactValue(value, secrets, seen) {
  if (typeof value === 'string') return redactString(value, secrets);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);

  if (value instanceof URL) {
    const href = redactString(value.href, secrets);
    let redacted;
    try {
      redacted = new URL(href);
    } catch {
      return href;
    }
    seen.set(value, redacted);
    return redacted;
  }

  if (value instanceof Error) return redactError(value, secrets, seen);

  if (Array.isArray(value)) {
    const redacted = [];
    seen.set(value, redacted);
    for (const item of value) redacted.push(redactValue(item, secrets, seen));
    return redacted;
  }

  const redacted = {};
  seen.set(value, redacted);
  for (const [key, item] of Object.entries(value)) {
    redacted[redactString(key, secrets)] = redactValue(item, secrets, seen);
  }
  return redacted;
}

export function redact(value, secrets = []) {
  return redactValue(value, normalizedSecrets(secrets), new WeakMap());
}
