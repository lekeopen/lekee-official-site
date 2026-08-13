export type ProductEventName =
  | 'product_leke_picker_online_use'
  | 'product_leke_picker_download_section'
  | 'product_leke_picker_download_modern'
  | 'product_leke_picker_download_win7_x64'
  | 'product_leke_picker_download_win7_x86'
  | 'product_leke_picker_github'
  | 'product_leke_picker_release_notes'
  | 'product_guigelei_download_section'
  | 'product_guigelei_download_macos'
  | 'product_guigelei_download_windows'
  | 'product_guigelei_release_notes';

declare global {
  interface Window {
    clarity?: (command: 'event', eventName: ProductEventName) => void;
  }
}

export function trackProductEvent(eventName: ProductEventName): void {
  if (typeof window === 'undefined' || typeof window.clarity !== 'function') return;
  window.clarity('event', eventName);
}
