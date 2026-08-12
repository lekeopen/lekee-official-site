import { useEffect } from 'react';
import { absoluteImageUrl, canonicalUrl } from '../seo/site';

type WechatShareOptions = {
  title: string;
  desc: string;
  link: string;
  imgUrl?: string;
};

type WechatSignature = {
  appId: string;
  timestamp: number;
  nonceStr: string;
  signature: string;
};

type WechatJsSdk = {
  config: (options: Record<string, unknown>) => void;
  ready: (callback: () => void) => void;
  error: (callback: (error: unknown) => void) => void;
  updateAppMessageShareData: (options: WechatShareOptions) => void;
  updateTimelineShareData: (options: Omit<WechatShareOptions, 'desc'>) => void;
};

declare global {
  interface Window {
    wx?: WechatJsSdk;
  }
}

const sdkUrl = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js';
let sdkLoadPromise: Promise<void> | undefined;

function isWechatBrowser() {
  return /MicroMessenger/i.test(window.navigator.userAgent);
}

function loadWechatSdk() {
  if (window.wx) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${sdkUrl}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load WeChat JS SDK')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load WeChat JS SDK'));
    document.head.appendChild(script);
  });

  return sdkLoadPromise;
}

async function fetchSignature(url: string): Promise<WechatSignature> {
  const response = await fetch(`/api/wechat-js-signature?url=${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`WeChat signature request failed: ${response.status}`);
  return response.json();
}

export function useWechatShare(options?: WechatShareOptions) {
  const title = options?.title;
  const desc = options?.desc;
  const optionLink = options?.link;
  const optionImgUrl = options?.imgUrl;

  useEffect(() => {
    if (!title || !desc || !optionLink) return;
    if (typeof window === 'undefined' || !isWechatBrowser()) return;

    let cancelled = false;
    const link = canonicalUrl(optionLink);
    const shareData: WechatShareOptions = {
      title,
      desc,
      link,
      imgUrl: absoluteImageUrl(optionImgUrl),
    };

    async function registerShare() {
      try {
        await loadWechatSdk();
        if (cancelled || !window.wx) return;

        const signature = await fetchSignature(window.location.href.split('#')[0]);
        if (cancelled) return;

        window.wx.config({
          debug: false,
          appId: signature.appId,
          timestamp: signature.timestamp,
          nonceStr: signature.nonceStr,
          signature: signature.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
        });

        window.wx.ready(() => {
          window.wx?.updateAppMessageShareData(shareData);
          window.wx?.updateTimelineShareData({
            title: shareData.title,
            link: shareData.link,
            imgUrl: shareData.imgUrl,
          });
        });

        window.wx.error((error) => {
          console.warn('WeChat share configuration failed', error);
        });
      } catch (error) {
        console.warn('WeChat share setup failed', error);
      }
    }

    registerShare();

    return () => {
      cancelled = true;
    };
  }, [title, desc, optionLink, optionImgUrl]);
}
