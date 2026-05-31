export interface BrowserCapability {
  engine: 'chromium' | 'gecko' | 'webkit' | 'unknown';
  brand: string;
  version: number;
  isIos: boolean;
  isMobile: boolean;
  hasFileSystemAccess: boolean;
  hasWebRTC: boolean;
}

function isIosPlatform(): boolean {
  // All browsers on iOS/iPadOS use WebKit — detect by platform/UA, not by brand
  const ua = navigator.userAgent;
  const isIpadDesktop =
    navigator.maxTouchPoints > 1 && /Macintosh/.test(ua) && !('ontouchstart' in window === false);
  return /iPad|iPhone|iPod/.test(ua) || /iPad|iPhone|iPod/.test(navigator.platform ?? '') || isIpadDesktop;
}

export function detectBrowser(): BrowserCapability {
  const ua = navigator.userAgent;
  const isIos = isIosPlatform();
  const isMobile = isIos || /Android/.test(ua);
  const hasFileSystemAccess = 'showSaveFilePicker' in window;
  const hasWebRTC = typeof RTCPeerConnection !== 'undefined';

  // Prefer UA-CH when available
  const uaData = (navigator as Navigator & { userAgentData?: { brands: { brand: string; version: string }[] } }).userAgentData;

  if (uaData?.brands) {
    for (const { brand, version } of uaData.brands) {
      const v = parseInt(version, 10);
      if (/Chromium|Chrome|Edge/.test(brand)) {
        return { engine: 'chromium', brand, version: v, isIos, isMobile, hasFileSystemAccess, hasWebRTC };
      }
    }
    return { engine: 'webkit', brand: 'Safari', version: 0, isIos, isMobile, hasFileSystemAccess, hasWebRTC };
  }

  // UA string fallback
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  const safariMatch = ua.match(/Version\/(\d+).*Safari/);

  if (edgeMatch) return { engine: 'chromium', brand: 'Edge', version: parseInt(edgeMatch[1], 10), isIos, isMobile, hasFileSystemAccess, hasWebRTC };
  if (chromeMatch && !safariMatch) return { engine: 'chromium', brand: 'Chrome', version: parseInt(chromeMatch[1], 10), isIos, isMobile, hasFileSystemAccess, hasWebRTC };
  if (firefoxMatch) return { engine: 'gecko', brand: 'Firefox', version: parseInt(firefoxMatch[1], 10), isIos, isMobile, hasFileSystemAccess, hasWebRTC };
  if (safariMatch) return { engine: 'webkit', brand: 'Safari', version: parseInt(safariMatch[1], 10), isIos, isMobile, hasFileSystemAccess, hasWebRTC };

  return { engine: 'unknown', brand: 'Unknown', version: 0, isIos, isMobile, hasFileSystemAccess, hasWebRTC };
}
