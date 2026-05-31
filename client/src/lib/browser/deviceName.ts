const STORAGE_KEY = 'localdrop-device-name';

function detectDeviceName(): string {
  const ua = navigator.userAgent;

  // OS
  let os: string;
  if (/iPhone/.test(ua)) os = 'iPhone';
  else if (/iPad/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua))) os = 'iPad';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'Mac';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';
  else os = 'Device';

  // Browser
  let browser: string;
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  else browser = '';

  return browser ? `${os} · ${browser}` : os;
}

export function getDeviceName(): string {
  return localStorage.getItem(STORAGE_KEY) ?? detectDeviceName();
}

export function saveDeviceName(name: string): void {
  const trimmed = name.trim().slice(0, 32);
  if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
}
