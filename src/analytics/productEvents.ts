export type ProductEventName =
  | 'product_leke_picker_online_use'
  | 'product_leke_picker_download_section'
  | 'product_leke_picker_download_modern_oss'
  | 'product_leke_picker_download_modern_github'
  | 'product_leke_picker_download_win7_x64_oss'
  | 'product_leke_picker_download_win7_x64_github'
  | 'product_leke_picker_download_win7_x86_oss'
  | 'product_leke_picker_download_win7_x86_github'
  | 'product_leke_picker_github'
  | 'product_leke_picker_release_notes'
  | 'product_guigelei_download_section'
  | 'product_guigelei_download_macos_oss'
  | 'product_guigelei_download_macos_github'
  | 'product_guigelei_download_windows_oss'
  | 'product_guigelei_download_windows_github'
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
