import { createWechatJsSignatureResponse, type WechatSignatureEnv } from './wechat-signature-core';

type WorkerEnv = WechatSignatureEnv & {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
};

export default {
  async fetch(request: Request, env: WorkerEnv) {
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/api/wechat-js-signature') {
      return createWechatJsSignatureResponse(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
