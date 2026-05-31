import EventEmitter from 'eventemitter3';
import type { SignalingClient } from '../signaling/SignalingClient.js';
import { hashBuffer } from '../transfer/integrity.js';

export type PeerState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export type IcePathType = 'direct-lan' | 'stun-hairpin' | 'relay' | 'unknown';

export interface LiveStats {
  path: IcePathType;
  pathLabel: string;
  localType: string;
  localAddr: string;
  remoteType: string;
  remoteAddr: string;
  rttMs: number | null;
  sendBps: number;   // current outbound bytes/s
  recvBps: number;   // current inbound bytes/s
}

interface Events {
  state: (s: PeerState) => void;
  channel: (ch: RTCDataChannel) => void;
  verificationNumber: (n: string) => void;
  isolationDetected: () => void;
  icePath: (path: IcePathType, detail: string) => void;
  liveStats: (stats: LiveStats) => void;
}

const ICE_SERVERS: RTCIceServer[] = (() => {
  const stun = import.meta.env.VITE_STUN_URL ?? 'stun:stun.l.google.com:19302';
  return stun ? [{ urls: stun }] : [];
})();

export class PeerConnection extends EventEmitter<Events> {
  private pc: RTCPeerConnection | null = null;
  private _state: PeerState = 'idle';
  private iceQueue: RTCIceCandidateInit[] = [];

  constructor(
    private readonly localId: string,
    private readonly remoteId: string,
    private readonly signaling: SignalingClient,
  ) {
    super();
  }

  get state() { return this._state; }

  async call(): Promise<RTCDataChannel> {
    const pc = this._createPc();
    const channel = pc.createDataChannel('localdrop', { ordered: true });
    this._setupChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.signaling.send({ type: 'offer', to: this.remoteId, sdp: offer.sdp! });

    return new Promise((res, rej) => {
      const tid = setTimeout(() => rej(new Error('Connection timeout')), 30_000);
      this.once('channel', (ch) => { clearTimeout(tid); res(ch); });
      this.once('state', (s) => { if (s === 'failed' || s === 'closed') { clearTimeout(tid); rej(new Error(`Connection ${s}`)); } });
    });
  }

  async answer(sdp: string): Promise<void> {
    const pc = this._createPc();
    await pc.setRemoteDescription({ type: 'offer', sdp });

    for (const c of this.iceQueue) await pc.addIceCandidate(c);
    this.iceQueue = [];

    pc.ondatachannel = (ev) => {
      // Emit immediately so listeners can be attached before onopen fires
      this.emit('channel', ev.channel);
      this._setupChannel(ev.channel);
    };

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.signaling.send({ type: 'answer', to: this.remoteId, sdp: answer.sdp! });
  }

  async addAnswer(sdp: string): Promise<void> {
    await this.pc?.setRemoteDescription({ type: 'answer', sdp });
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc?.remoteDescription) {
      await this.pc.addIceCandidate(candidate);
    } else {
      this.iceQueue.push(candidate);
    }
  }

  close(): void {
    this._stopStatsPolling();
    this.pc?.close();
    this._setState('closed');
  }

  private _createPc(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;
    this._setState('connecting');

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        this.signaling.send({ type: 'ice-candidate', to: this.remoteId, candidate: ev.candidate.toJSON() });
      }
    };

    const iceTimeout = setTimeout(() => {
      if (pc.connectionState !== 'connected') {
        this.emit('isolationDetected');
        this._setState('failed');
      }
    }, 30_000);

    pc.onconnectionstatechange = () => {
      const map: Record<string, PeerState> = {
        new: 'connecting', connecting: 'connecting', connected: 'connected',
        disconnected: 'disconnected', failed: 'failed', closed: 'closed',
      };
      const next = map[pc.connectionState] ?? 'idle';
      if (next === 'connected' || next === 'failed' || next === 'closed') {
        clearTimeout(iceTimeout);
      }
      this._setState(next);

      if (pc.connectionState === 'connected') {
        this._deriveVerificationNumber();
        this._logCandidatePair();
        this._startStatsPolling();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this._stopStatsPolling();
      }
    };

    return pc;
  }

  private statsTimer: ReturnType<typeof setInterval> | null = null;
  private prevSent = 0;
  private prevRecv = 0;
  private prevTs = 0;

  private _startStatsPolling(): void {
    if (this.statsTimer) return;
    this.statsTimer = setInterval(() => this._sampleStats(), 1000);
  }

  private _stopStatsPolling(): void {
    if (this.statsTimer) { clearInterval(this.statsTimer); this.statsTimer = null; }
  }

  private async _sampleStats(): Promise<void> {
    if (!this.pc) return;
    try {
      const stats = await this.pc.getStats();
      let pair: RTCStats & Record<string, unknown> | null = null;
      let bytesSent = 0, bytesRecv = 0;

      stats.forEach((r) => {
        if (r.type === 'candidate-pair' && (r as Record<string, unknown>).nominated && (r as Record<string, unknown>).state === 'succeeded') {
          pair = r as never;
        }
        if (r.type === 'data-channel') {
          bytesSent += ((r as Record<string, unknown>).bytesSent as number) ?? 0;
          bytesRecv += ((r as Record<string, unknown>).bytesReceived as number) ?? 0;
        }
      });
      // Fallback: use transport bytes if data-channel stats unavailable
      if (bytesSent === 0 && bytesRecv === 0) {
        stats.forEach((r) => {
          if (r.type === 'transport') {
            bytesSent = ((r as Record<string, unknown>).bytesSent as number) ?? 0;
            bytesRecv = ((r as Record<string, unknown>).bytesReceived as number) ?? 0;
          }
        });
      }

      const now = performance.now();
      const dt = this.prevTs ? (now - this.prevTs) / 1000 : 1;
      const sendBps = dt > 0 ? Math.max(0, (bytesSent - this.prevSent) / dt) : 0;
      const recvBps = dt > 0 ? Math.max(0, (bytesRecv - this.prevRecv) / dt) : 0;
      this.prevSent = bytesSent; this.prevRecv = bytesRecv; this.prevTs = now;

      if (!pair) return;
      const p = pair as Record<string, unknown>;
      const local = stats.get(p.localCandidateId as string);
      const remote = stats.get(p.remoteCandidateId as string);
      const localType = (local?.candidateType as string) ?? '?';
      const remoteType = (remote?.candidateType as string) ?? '?';

      let path: IcePathType, pathLabel: string;
      if (localType === 'host' && remoteType === 'host') { path = 'direct-lan'; pathLabel = '✅ Direct LAN'; }
      else if (localType === 'relay' || remoteType === 'relay') { path = 'relay'; pathLabel = '🌐 Relayed'; }
      else { path = 'stun-hairpin'; pathLabel = '⚡ STUN hairpin'; }

      this.emit('liveStats', {
        path, pathLabel,
        localType, localAddr: (local?.address as string) ?? '?',
        remoteType, remoteAddr: (remote?.address as string) ?? '?',
        rttMs: (p.currentRoundTripTime as number) != null ? Math.round((p.currentRoundTripTime as number) * 1000) : null,
        sendBps, recvBps,
      });
    } catch { /* ignore */ }
  }

  private _setupChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      this._setState('connected');
      this.emit('channel', channel);
    };
    channel.onerror = (ev) => console.error('[dc] error', ev);
  }

  private async _logCandidatePair(): Promise<void> {
    try {
      const stats = await this.pc!.getStats();
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.nominated) {
          const local = stats.get(report.localCandidateId);
          const remote = stats.get(report.remoteCandidateId);
          const localType = local?.candidateType ?? '?';
          const remoteType = remote?.candidateType ?? '?';

          let path: IcePathType;
          let label: string;
          if (localType === 'host' && remoteType === 'host') {
            path = 'direct-lan'; label = '✅ Direct LAN';
          } else if (localType === 'relay' || remoteType === 'relay') {
            path = 'relay'; label = '🌐 Relayed (internet)';
          } else {
            path = 'stun-hairpin'; label = '⚡ STUN hairpin (via router)';
          }

          const detail = `${label} | local=${localType}(${local?.address}) remote=${remoteType}(${remote?.address})`;
          console.log(`[WebRTC] ICE path: ${detail}`);
          this.emit('icePath', path, label);
        }
      });
    } catch { /* ignore */ }
  }

  private async _deriveVerificationNumber(): Promise<void> {
    try {
      const local = this.pc?.localDescription?.sdp ?? '';
      const remote = this.pc?.remoteDescription?.sdp ?? '';
      const extract = (sdp: string) => sdp.match(/a=fingerprint:[^ ]+ ([0-9A-F:]+)/i)?.[1] ?? '';
      const combined = new TextEncoder().encode(extract(local) + extract(remote));
      const hash = await hashBuffer(combined);
      this.emit('verificationNumber', hash.slice(0, 6).toUpperCase());
    } catch { /* ignore */ }
  }

  private _setState(s: PeerState): void {
    if (this._state === s) return;
    this._state = s;
    this.emit('state', s);
  }
}
