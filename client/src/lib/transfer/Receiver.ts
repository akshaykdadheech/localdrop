import EventEmitter from 'eventemitter3';
import type { TransferHeader, TransferComplete } from './Sender.js';
import { MAX_BLOB_SIZE } from './constants.js';
import { detectBrowser } from '../browser/detect.js';

export type ReceiverStatus = 'pending' | 'accepted' | 'receiving' | 'done' | 'failed' | 'declined';

interface Events {
  request: (header: TransferHeader) => void;
  progress: (receivedBytes: number) => void;
  done: (fileName: string) => void;
  error: (err: Error) => void;
  tooLarge: (size: number) => void;
}

const cap = detectBrowser();
const canStream = 'showSaveFilePicker' in window && cap.engine === 'chromium';

const PROGRESS_INTERVAL = 150; // ms

export class Receiver extends EventEmitter<Events> {
  private status: ReceiverStatus = 'pending';
  private header: TransferHeader | null = null;
  private chunks: ArrayBuffer[] = [];
  private received = 0;

  private lastProgressTime = 0;

  constructor(private readonly channel: RTCDataChannel) {
    super();
    channel.binaryType = 'arraybuffer';
    channel.addEventListener('message', (ev) => this._onMessage(ev));
  }

  accept(): void {
    if (!this.header) return;
    if (this.header.size > MAX_BLOB_SIZE) {
      this.emit('tooLarge', this.header.size);
      return;
    }
    this.channel.send(JSON.stringify({ type: 'transfer-accept', id: this.header.id }));
    this.status = 'accepted';
  }

  decline(): void {
    if (!this.header) return;
    this.channel.send(JSON.stringify({ type: 'transfer-decline', id: this.header.id }));
    this.status = 'declined';
  }

  private _onMessage(ev: MessageEvent): void {
    // Control messages (JSON strings)
    if (typeof ev.data === 'string') {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'transfer-request') {
          this.header = msg as TransferHeader;
          this.chunks = [];
          this.received = 0;
          this.lastProgressTime = 0;
          this.status = 'pending';
          this.emit('request', this.header);
        } else if (msg.type === 'transfer-complete') {
          void this._finalize(msg as TransferComplete);
        }
      } catch { /* not JSON */ }
      return;
    }

    // Binary chunk
    if (this.status !== 'accepted' && this.status !== 'receiving') return;
    this.status = 'receiving';

    const buf = ev.data as ArrayBuffer;
    this.received += buf.byteLength;
    this.chunks.push(buf);

    const now = Date.now();
    if (now - this.lastProgressTime >= PROGRESS_INTERVAL) {
      this.emit('progress', this.received);
      this.lastProgressTime = now;
    }
  }

  private async _finalize(complete: TransferComplete): Promise<void> {
    if (!this.header) return;

    this.emit('progress', this.received);

    const blob = new Blob(this.chunks, { type: this.header.mimeType });
    this.chunks = [];

    if (blob.size !== this.header.size) {
      this.status = 'failed';
      this.emit('error', new Error(`Integrity check failed — expected ${this.header.size} bytes, got ${blob.size}`));
      return;
    }

    if (canStream) {
      // Open file picker AFTER transfer is done — progress was visible throughout
      try {
        const handle = await (
          window as Window & typeof globalThis & { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }
        ).showSaveFilePicker({ suggestedName: this.header.name });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } catch {
        // User cancelled picker — fall back to anchor download
        this._anchorDownload(blob, this.header.name);
      }
    } else {
      this._anchorDownload(blob, this.header.name);
    }

    this.status = 'done';
    this.emit('done', this.header.name);
  }

  private _anchorDownload(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }
}
