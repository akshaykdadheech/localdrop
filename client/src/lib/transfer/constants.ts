import { detectBrowser } from '../browser/detect.js';

const cap = detectBrowser();

export const CHUNK_SIZE = cap.engine === 'chromium' ? 65536 : 16384;

// Chromium hard cap is 16 MB; stay well below it
export const HIGH_WATER_MARK = cap.engine === 'chromium' ? 12 * 1024 * 1024 : 1 * 1024 * 1024;
export const LOW_WATER_MARK  = cap.engine === 'chromium' ?  6 * 1024 * 1024 : 256 * 1024;

export const HASH_SIZE_LIMIT = 100 * 1024 * 1024;
export const MAX_BLOB_SIZE = 500 * 1024 * 1024;
