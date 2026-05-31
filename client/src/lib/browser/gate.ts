import { detectBrowser, type BrowserCapability } from './detect.js';

export type GateResult = 'ok' | 'blocked' | 'outdated' | 'ios';

const MIN_CHROME_VERSION = 110;

export interface GateCheck {
  result: GateResult;
  capability: BrowserCapability;
}

export function checkGate(): GateCheck {
  const capability = detectBrowser();

  // iOS — always allow, never block (Apple mandates WebKit on all iOS browsers)
  if (capability.isIos) return { result: 'ios', capability };

  // No WebRTC at all — block
  if (!capability.hasWebRTC) return { result: 'blocked', capability };

  // Non-Chromium desktop/Android — block
  if (capability.engine !== 'chromium' && capability.engine !== 'webkit') {
    return { result: 'blocked', capability };
  }

  // Outdated Chromium — soft warn
  if (capability.engine === 'chromium' && capability.version < MIN_CHROME_VERSION) {
    return { result: 'outdated', capability };
  }

  return { result: 'ok', capability };
}
