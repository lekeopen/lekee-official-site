import { createWechatJsSignatureResponse, type WechatSignatureEnv } from '../wechat-signature-core';

type PagesContext = {
  request: Request;
  env: WechatSignatureEnv;
};

export const onRequestGet = async ({ request, env }: PagesContext) =>
  createWechatJsSignatureResponse(request, env);
