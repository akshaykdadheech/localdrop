import EventEmitter from 'eventemitter3';
import type { ClientMessage, ServerMessage } from './protocol.js';

export type SignalingStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface Events {
  status: (s: SignalingStatus) => void;
  message: (m: ServerMessage) => void;
}

const BASE_DELAY = 1000;
const MAX_DELAY = 30_000;

export class SignalingClient extends EventEmitter<Events> {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private attempt = 0;
  private destroyed = false;
  private queue: ClientMessage[] = [];
  private _status: SignalingStatus = 'disconnected';

  constructor(private readonly url: string) {
    super();
  }

  get status() { return this._status; }

  connect(): void {
    this.destroyed = false;
    this._open();
  }

  destroy(): void {
    this.destroyed = true;
    this._clearTimers();
    this.ws?.close();
    this.ws = null;
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  private _open(): void {
    if (this.destroyed) return;
    this._setStatus('connecting');
    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this._scheduleReconnect();
      return;
    }

    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.attempt = 0;
      this._setStatus('connected');
      this._startPing();
      // drain queue
      while (this.queue.length) this.ws!.send(JSON.stringify(this.queue.shift()));
    };

    this.ws.onmessage = (ev) => {
      try {
        this.emit('message', JSON.parse(ev.data as string) as ServerMessage);
      } catch { /* ignore malformed */ }
    };

    this.ws.onclose = () => {
      this._stopPing();
      if (!this.destroyed) {
        this._setStatus('disconnected');
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this._setStatus('error');
    };
  }

  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => this.send({ type: 'ping' }), 20_000);
  }

  private _stopPing(): void {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
  }

  private _scheduleReconnect(): void {
    const delay = Math.min(BASE_DELAY * 2 ** this.attempt, MAX_DELAY);
    this.attempt++;
    this.reconnectTimer = setTimeout(() => this._open(), delay);
  }

  private _clearTimers(): void {
    this._stopPing();
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  private _setStatus(s: SignalingStatus): void {
    this._status = s;
    this.emit('status', s);
  }
}
