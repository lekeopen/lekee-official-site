const textEncoder = new TextEncoder();
let cachedAccessToken;
let cachedJsapiTicket;
const cacheSafetyWindowMs = 5 * 60 * 1000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function randomNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha1(input) {
  const hash = await crypto.subtle.digest('SHA-1', textEncoder.encode(input));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchWechatJson(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok || data.errcode) {
    const error = new Error('WeChat API request failed');
    error.wechat = {
      errcode: data.errcode || response.status,
      errmsg: typeof data.errmsg === 'string' ? data.errmsg : response.statusText,
    };
    throw error;
  }
  return data;
}

async function getAccessToken(appId, appSecret) {
  if (cachedAccessToken && cachedAccessToken.expiresAt - cacheSafetyWindowMs > Date.now()) {
    return cachedAccessToken.value;
  }

  const endpoint = new URL('https://api.weixin.qq.com/cgi-bin/token');
  endpoint.searchParams.set('grant_type', 'client_credential');
  endpoint.searchParams.set('appid', appId);
  endpoint.searchParams.set('secret', appSecret);
  const data = await fetchWechatJson(endpoint.toString());
  if (typeof data.access_token !== 'string') throw new Error('WeChat access_token missing');
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 7200;
  cachedAccessToken = { value: data.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return cachedAccessToken.value;
}

async function getJsapiTicket(accessToken) {
  if (cachedJsapiTicket && cachedJsapiTicket.expiresAt - cacheSafetyWindowMs > Date.now()) {
    return cachedJsapiTicket.value;
  }

  const endpoint = new URL('https://api.weixin.qq.com/cgi-bin/ticket/getticket');
  endpoint.searchParams.set('access_token', accessToken);
  endpoint.searchParams.set('type', 'jsapi');
  const data = await fetchWechatJson(endpoint.toString());
  if (typeof data.ticket !== 'string') throw new Error('WeChat jsapi_ticket missing');
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 7200;
  cachedJsapiTicket = { value: data.ticket, expiresAt: Date.now() + expiresIn * 1000 };
  return cachedJsapiTicket.value;
}

export function onRequestGet(context) {
  const { request, env } = context;
  const appId = env.WECHAT_APP_ID;
  const appSecret = env.WECHAT_APP_SECRET;
  if (!appId || !appSecret) return json({ error: 'WeChat credentials are not configured' }, 503);

  const requestUrl = new URL(request.url);
  const targetUrl = requestUrl.searchParams.get('url');
  if (!targetUrl) return json({ error: 'Missing url parameter' }, 400);

  let parsedTarget;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return json({ error: 'Invalid url parameter' }, 400);
  }

  if (parsedTarget.protocol !== 'https:' || parsedTarget.hostname !== 'lekeopen.com') {
    return json({ error: 'URL is outside the allowed site origin' }, 400);
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonceStr = randomNonce();
    return getAccessToken(appId, appSecret)
      .then(getJsapiTicket)
      .then(async (ticket) => {
        const signatureBase = [
          `jsapi_ticket=${ticket}`,
          `noncestr=${nonceStr}`,
          `timestamp=${timestamp}`,
          `url=${parsedTarget.href.split('#')[0]}`,
        ].join('&');

        return json({
          appId,
          timestamp,
          nonceStr,
          signature: await sha1(signatureBase),
        });
      })
      .catch((error) => {
        if (error && error.wechat) {
          return json({
            error: 'Failed to create WeChat JS signature',
            wechat: error.wechat,
          }, 502);
        }
        return json({ error: 'Failed to create WeChat JS signature' }, 502);
      });
  } catch (error) {
    if (error && error.wechat) {
      return json({
        error: 'Failed to create WeChat JS signature',
        wechat: error.wechat,
      }, 502);
    }
    return json({ error: 'Failed to create WeChat JS signature' }, 502);
  }
}
