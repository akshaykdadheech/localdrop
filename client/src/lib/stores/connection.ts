import { writable } from 'svelte/store';
import type { SignalingStatus } from '../signaling/SignalingClient.js';

export interface ConnectionState {
  status: SignalingStatus;
  peerId: string | null;
  displayName: string | null;
  avatarSeed: string | null;
  roomCode: string | null;
  icePath: string | null; // e.g. "✅ Direct LAN", "⚡ STUN hairpin"
}

export const connection = writable<ConnectionState>({
  status: 'disconnected',
  peerId: null,
  displayName: null,
  avatarSeed: null,
  roomCode: null,
  icePath: null,
});
