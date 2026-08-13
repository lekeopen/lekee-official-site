import { parseSupportRequest } from '../support/validation.mjs';
import { checkRequestOrigin, verifyTurnstile, checkRateLimit } from '../support/security.mjs';
import { createSupportReference } from '../support/reference.mjs';
import { buildSupportEmail, sendSupportEmail } from '../support/mailer.mjs';

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff' } });

export async function onRequestPost(context, dependencies = {}) {
  const { request, env } = context;
  const allowed = String(env.ALLOWED_SUPPORT_ORIGINS || 'https://lekeopen.com').split(',').map((v)=>v.trim()).filter(Boolean);
  if (!checkRequestOrigin(request, allowed)) return json(403,{ok:false,code:'invalid_request'});
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json(415,{ok:false,code:'invalid_request'});
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 16_384) return json(413,{ok:false,code:'invalid_request'});
  let body;
  try { const text=await request.text(); if (text.length>16_384) throw new Error(); body=JSON.parse(text); } catch { return json(400,{ok:false,code:'invalid_request'}); }
  const parsed = parseSupportRequest(body);
  if (!parsed.ok) return json(400,{ok:false,code:'invalid_request',fieldErrors:parsed.fieldErrors});
  if (parsed.data.website) return json(400,{ok:false,code:'invalid_request'});
  const ip=request.headers.get('CF-Connecting-IP') || '';
  const fetchImpl=dependencies.fetchImpl || fetch;
  if (!await verifyTurnstile(parsed.data.turnstileToken,ip,env.TURNSTILE_SECRET_KEY,fetchImpl)) return json(403,{ok:false,code:'verification_failed'});
  if (!await checkRateLimit(env,ip)) return json(429,{ok:false,code:'rate_limited'});
  const now=dependencies.now || new Date();
  const randomBytes=dependencies.randomBytes || crypto.getRandomValues(new Uint8Array(4));
  const reference=createSupportReference(now,randomBytes);
  const mail=buildSupportEmail(reference,parsed.data,now.toISOString());
  if (!(await sendSupportEmail(env,mail,fetchImpl)).accepted) return json(503,{ok:false,code:'temporarily_unavailable'});
  console.info('support accepted', { reference });
  return json(201,{ok:true,reference});
}

export const onRequest = onRequestPost;
