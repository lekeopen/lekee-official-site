import type { SupportRequest, SupportResponse, SupportSuccess } from './types';
export async function submitSupportRequest(payload: SupportRequest, signal?: AbortSignal): Promise<SupportSuccess> {
  const response=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
  const result=await response.json() as SupportResponse;
  if(!response.ok||!result.ok) throw Object.assign(new Error('support_request_failed'),{response:result});
  return result;
}
