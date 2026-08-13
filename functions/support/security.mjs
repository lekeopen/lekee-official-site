export function checkRequestOrigin(request, allowedOrigins) {
  const origin = request.headers.get('origin');
  return Boolean(origin && allowedOrigins.includes(origin));
}

export async function verifyTurnstile(token, remoteIp, secret, fetchImpl = fetch) {
  if (!token || !secret) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);
    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    return response.ok && Boolean((await response.json()).success);
  } catch { return false; }
}

export async function checkRateLimit(env, clientKey) {
  if (!env.SUPPORT_RATE_LIMIT || !clientKey) return false;
  const bucket = Math.floor(Date.now() / 600_000);
  const key = `support:${bucket}:${clientKey}`;
  const count = Number(await env.SUPPORT_RATE_LIMIT.get(key) || 0);
  if (count >= 5) return false;
  await env.SUPPORT_RATE_LIMIT.put(key, String(count + 1), { expirationTtl: 1200 });
  return true;
}
