import { writable } from 'svelte/store';

export type TransferStatus =
  | 'pending'
  | 'sending'
  | 'receiving'
  | 'done'
  | 'failed'
  | 'declined'
  | 'cancelled';

export interface TransferState {
  id: string;
  direction: 'send' | 'receive';
  peerId: string;
  peerName: string;
  fileName: string;
  totalBytes: number;
  transferredBytes: number;
  startTime: number;
  status: TransferStatus;
  errorMessage?: string;
  // Smoothed speed (bytes/s)
  speedBps: number;
}

export const transfers = writable<TransferState[]>([]);

export function upsertTransfer(t: TransferState) {
  transfers.update((list) => {
    const idx = list.findIndex((x) => x.id === t.id);
    if (idx >= 0) { list[idx] = t; return [...list]; }
    return [t, ...list];
  });
}

export function updateTransfer(id: string, patch: Partial<TransferState>) {
  transfers.update((list) =>
    list.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  );
}
