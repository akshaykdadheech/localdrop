import { writable } from 'svelte/store';
import type { LiveStats } from '../webrtc/PeerConnection.js';

export interface PeerDiagnostics extends LiveStats {
  peerId: string;
  peerName: string;
  updatedAt: number;
}

// Map of peerId → latest live stats
export const diagnostics = writable<Record<string, PeerDiagnostics>>({});

export function updateDiagnostics(peerId: string, peerName: string, stats: LiveStats) {
  diagnostics.update((d) => ({
    ...d,
    [peerId]: { ...stats, peerId, peerName, updatedAt: Date.now() },
  }));
}

export function clearDiagnostics(peerId: string) {
  diagnostics.update((d) => {
    const next = { ...d };
    delete next[peerId];
    return next;
  });
}
