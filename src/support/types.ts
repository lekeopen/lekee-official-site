export interface SupportRequest {
  product: string;
  version: string;
  system: string;
  issueType: string;
  description: string;
  contact: string;
  name: string;
  privacyConfirmed: true;
  website: string;
  turnstileToken: string;
}

export type SupportSuccess = { ok: true; reference: string };
export type SupportFailure = {
  ok: false;
  code: 'invalid_request' | 'verification_failed' | 'rate_limited' | 'temporarily_unavailable';
  fieldErrors?: Record<string, string>;
};
export type SupportResponse = SupportSuccess | SupportFailure;
