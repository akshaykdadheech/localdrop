import EventEmitter from 'eventemitter3';
import { CHUNK_SIZE, HIGH_WATER_MARK, LOW_WATER_MARK, HASH_SIZE_LIMIT } from './constants.js';
import { hashFile } from './integrity.js';

export interface TransferHeader {
  type: 'transfer-request';
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunkCount: number;
}

export interface TransferComplete {
  type: 'transfer-complete';
  id: string;
  sha256: string;
}

interface Events {
  progress: (sentBytes: number) => void;
  done: () => void;
  error: (err: Error) => void;
  cancelled: () => void;
}

const BURST_SIZE = 2 * 1024 * 1024;
const PROGRESS_INTERVAL = 150;

export class Sender extends EventEmitter<Events> {
  private cancelled = false;

  constructor(
    private readonly file: File,
    private readonly transferId: string,
    private readonly channel: RTCDataChannel,
  ) {
    super();
    this.channel.bufferedAmountLowThreshold = LOW_WATER_MARK;
  }

  cancel(): void { this.cancelled = true; this.emit('cancelled'); }

  async send(): Promise<void> {
    const chunkCount = Math.ceil(this.file.size / CHUNK_SIZE);
    const skipHash = this.file.size > HASH_SIZE_LIMIT;
    const sha256Promise = skipHash ? Promise.resolve('') : hashFile(this.file);

    this.channel.send(JSON.stringify({
      type: 'transfer-request',
      id: this.transferId,
      name: this.file.name,
      size: this.file.size,
      mimeType: this.file.type || 'application/octet-stream',
      chunkCount,
    } as TransferHeader));

    await this._waitForAccept();
    if (this.cancelled) return;

    let fileOffset      = 0;
    let sent            = 0;
    let lastProgressTime = 0;

    try {
      while (fileOffset < this.file.size && !this.cancelled) {
        // Read one 2 MB burst from the File object
        const end   = Math.min(fileOffset + BURST_SIZE, this.file.size);
        const burst = await this.file.slice(fileOffset, end).arrayBuffer();
        fileOffset  = end;

        const view = new Uint8Array(burst);
        let vOffset = 0;

        while (vOffset < view.byteLength && !this.cancelled) {
          if (this.channel.bufferedAmount >= HIGH_WATER_MARK) {
            await this._waitForDrain();
            if (this.cancelled) break;
          }

          const chunkLen = Math.min(CHUNK_SIZE, view.byteLength - vOffset);
          this.channel.send(view.subarray(vOffset, vOffset + chunkLen));
          sent    += chunkLen;
          vOffset += chunkLen;

          // Throttle UI — don't touch Svelte store every 64 KB
          const now = Date.now();
          if (now - lastProgressTime >= PROGRESS_INTERVAL) {
            this.emit('progress', sent);
            lastProgressTime = now;
          }
        }
      }

      if (!this.cancelled) {
        this.emit('progress', sent);
        const sha256 = await sha256Promise;
        this.channel.send(
          JSON.stringify({ type: 'transfer-complete', id: this.transferId, sha256 } as TransferComplete),
        );
        this.emit('done');
      }
    } catch (e) {
      this.emit('error', e as Error);
    }
  }

  private _waitForDrain(): Promise<void> {
    return new Promise((resolve) => {
      const h = () => { this.channel.removeEventListener('bufferedamountlow', h); resolve(); };
      this.channel.addEventListener('bufferedamountlow', h);
    });
  }

  private _waitForAccept(): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { cleanup(); reject(new Error('Transfer accept timeout')); }, 30_000);
      const h = (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === 'transfer-accept'  && msg.id === this.transferId) { cleanup(); resolve(); }
          if (msg.type === 'transfer-decline' && msg.id === this.transferId) { cleanup(); this.cancelled = true; reject(new Error('Transfer declined')); }
        } catch { /* binary */ }
      };
      const onClose = () => { cleanup(); reject(new Error('Channel closed before accept')); };
      const cleanup = () => {
        clearTimeout(t);
        this.channel.removeEventListener('message', h);
        this.channel.removeEventListener('close', onClose);
      };
      this.channel.addEventListener('message', h);
      this.channel.addEventListener('close', onClose);
    });
  }
}
