import { writable } from 'svelte/store';
import type { PeerInfo } from '../signaling/protocol.js';

export const peers = writable<PeerInfo[]>([]);
