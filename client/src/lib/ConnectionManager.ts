import { nanoid } from 'nanoid';
import { getDeviceName, saveDeviceName } from './browser/deviceName.js';
import { SignalingClient } from './signaling/SignalingClient.js';
import { PeerConnection } from './webrtc/PeerConnection.js';
import { Sender } from './transfer/Sender.js';
import { Receiver } from './transfer/Receiver.js';
import { TextTransfer, type TextPayload } from './transfer/TextTransfer.js';
import { connection } from './stores/connection.js';
import { peers } from './stores/peers.js';
import { upsertTransfer, updateTransfer } from './stores/transfers.js';
import { updateDiagnostics, clearDiagnostics } from './stores/diagnostics.js';
import type { PeerInfo } from './signaling/protocol.js';

export interface IncomingTransfer {
  id: string;
  peerId: string;
  peerName: string;
  fileName: string;
  size: number;
  accept: () => void;
  decline: () => void;
}

export interface IncomingText {
  id: string;
  peerId: string;
  peerName: string;
  content: string;
}

type Listener<T> = (data: T) => void;

export class ConnectionManager {
  readonly signaling: SignalingClient;
  private pcs = new Map<string, PeerConnection>();
  private channels = new Map<string, RTCDataChannel>();
  private receivers = new Map<string, Receiver>();
  private textTransfers = new Map<string, TextTransfer>();
  private activeSenders = new Map<string, Sender>(); // transferId → Sender

  private _peerId = '';
  private _peers: PeerInfo[] = [];

  onIncomingTransfer: Listener<IncomingTransfer> | null = null;
  onIncomingText: Listener<IncomingText> | null = null;
  onVerificationNumber: ((peerId: string, num: string) => void) | null = null;
  onIsolationDetected: ((peerId: string) => void) | null = null;
  onRoomError: ((message: string) => void) | null = null;

  constructor(wsUrl: string) {
    this.signaling = new SignalingClient(wsUrl);

    this.signaling.on('status', (s) => {
      connection.update((c) => ({ ...c, status: s }));
    });

    this.signaling.on('message', async (msg) => {
      switch (msg.type) {
        case 'server-hello':
          this._peerId = msg.peerId;
          this.signaling.send({ type: 'set-name', name: getDeviceName() });
          connection.update((c) => ({
            ...c, peerId: msg.peerId, displayName: getDeviceName(), avatarSeed: msg.avatarSeed,
          }));
          break;

        case 'peer-list':
          this._peers = msg.peers;
          peers.set(msg.peers);
          break;

        case 'peer-joined': {
          const existing = this._peers.findIndex((p) => p.id === msg.peer.id);
          if (existing >= 0) {
            this._peers = this._peers.map((p) => p.id === msg.peer.id ? msg.peer : p);
          } else {
            this._peers = [...this._peers, msg.peer];
          }
          peers.set(this._peers);
          break;
        }

        case 'peer-left':
          this._peers = this._peers.filter((p) => p.id !== msg.peerId);
          peers.set(this._peers);
          break;

        case 'room-joined':
          this._peers = msg.peers;
          peers.set(msg.peers);
          connection.update((c) => ({ ...c, roomCode: msg.code }));
          break;

        case 'room-error':
          this.onRoomError?.(msg.message);
          break;

        case 'offer': {
          const pc = this._getOrCreatePc(msg.from);
          await pc.answer(msg.sdp);
          break;
        }

        case 'answer':
          await this._getOrCreatePc(msg.from).addAnswer(msg.sdp);
          break;

        case 'ice-candidate':
          await this._getOrCreatePc(msg.from).addIceCandidate(msg.candidate);
          break;
      }
    });
  }

  connect(): void {
    this.signaling.connect();
  }

  destroy(): void {
    this.signaling.destroy();
    for (const pc of this.pcs.values()) pc.close();
  }

  async sendFiles(toPeerId: string, files: File[]): Promise<void> {
    const peerName = this._peers.find((p) => p.id === toPeerId)?.displayName ?? toPeerId;
    const channel = await this._openChannel(toPeerId);

    for (const file of files) {
      const id = nanoid(8);
      upsertTransfer({
        id, direction: 'send', peerId: toPeerId, peerName,
        fileName: file.name, totalBytes: file.size, transferredBytes: 0,
        startTime: Date.now(), status: 'sending', speedBps: 0,
      });

      const sender = new Sender(file, id, channel);
      this.activeSenders.set(id, sender);
      let lastBytes = 0;
      let lastTime = Date.now();
      let smoothSpeed = 0;

      sender.on('progress', (bytes) => {
        const now = Date.now();
        const dt = (now - lastTime) / 1000;
        if (dt > 0) {
          const instant = (bytes - lastBytes) / dt;
          smoothSpeed = smoothSpeed === 0 ? instant : 0.15 * instant + 0.85 * smoothSpeed;
        }
        lastBytes = bytes; lastTime = now;
        updateTransfer(id, { transferredBytes: bytes, speedBps: smoothSpeed });
      });

      sender.on('done', () => { updateTransfer(id, { status: 'done', transferredBytes: file.size }); this.activeSenders.delete(id); });
      sender.on('cancelled', () => { updateTransfer(id, { status: 'cancelled' }); this.activeSenders.delete(id); });
      sender.on('error', (e) => { updateTransfer(id, { status: 'failed', errorMessage: e.message }); this.activeSenders.delete(id); });

      try {
        await sender.send();
      } catch (e: unknown) {
        if ((e as Error).message !== 'Transfer declined') {
          updateTransfer(id, { status: 'failed', errorMessage: (e as Error).message });
        } else {
          updateTransfer(id, { status: 'declined' });
        }
      }
    }
  }

  async sendText(toPeerId: string, content: string): Promise<void> {
    const channel = await this._openChannel(toPeerId);
    const tt = this._getOrCreateTextTransfer(toPeerId, channel);
    tt.send(content);
  }

  setName(name: string): void {
    saveDeviceName(name);
    this.signaling.send({ type: 'set-name', name });
    connection.update((c) => ({ ...c, displayName: name }));
  }

  cancelTransfer(transferId: string): void {
    const sender = this.activeSenders.get(transferId);
    if (sender) { sender.cancel(); this.activeSenders.delete(transferId); }
  }

  joinRoomCode(code: string): void {
    this.signaling.send({ type: 'join-room-code', code });
  }

  leaveRoom(): void {
    this.signaling.send({ type: 'leave-room' });
    connection.update((c) => ({ ...c, roomCode: null }));
  }

  private async _openChannel(peerId: string): Promise<RTCDataChannel> {
    const existing = this.channels.get(peerId);
    if (existing?.readyState === 'open') return existing;

    const pc = this._getOrCreatePc(peerId);
    const channel = await pc.call();
    this.channels.set(peerId, channel);
    return channel;
  }

  private _getOrCreatePc(peerId: string): PeerConnection {
    const existing = this.pcs.get(peerId);
    if (existing) return existing;

    const pc = new PeerConnection(this._peerId, peerId, this.signaling);

    pc.on('channel', (channel) => {
      if (this.channels.get(peerId) === channel) return; // dedupe
      this.channels.set(peerId, channel);
      this._setupIncomingChannel(peerId, channel);
    });

    pc.on('verificationNumber', (num) => {
      this.onVerificationNumber?.(peerId, num);
    });

    pc.on('isolationDetected', () => {
      this.onIsolationDetected?.(peerId);
    });

    pc.on('icePath', (_path, label) => {
      connection.update((c) => ({ ...c, icePath: label }));
    });

    pc.on('liveStats', (stats) => {
      const name = this._peers.find((p) => p.id === peerId)?.displayName ?? peerId;
      updateDiagnostics(peerId, name, stats);
    });

    pc.on('state', (s) => {
      if (s === 'failed' || s === 'closed') {
        this.pcs.delete(peerId);
        this.channels.delete(peerId);
        this.receivers.delete(peerId);
        this.textTransfers.delete(peerId);
        clearDiagnostics(peerId);
      }
    });

    this.pcs.set(peerId, pc);
    return pc;
  }

  private _setupIncomingChannel(peerId: string, channel: RTCDataChannel): void {
    const peerName = this._peers.find((p) => p.id === peerId)?.displayName ?? peerId;
    const receiver = new Receiver(channel);
    this.receivers.set(peerId, receiver);

    let activeReceiveId: string | null = null;
    let lastBytes = 0;
    let lastTime = Date.now();
    let smoothSpeed = 0;
    receiver.on('request', (header) => {
      const id = header.id;
      activeReceiveId = id;
      lastBytes = 0;
      lastTime = Date.now();
      smoothSpeed = 0;

      upsertTransfer({
        id, direction: 'receive', peerId, peerName,
        fileName: header.name, totalBytes: header.size, transferredBytes: 0,
        startTime: Date.now(), status: 'pending', speedBps: 0,
      });

      this.onIncomingTransfer?.({
        id, peerId, peerName, fileName: header.name, size: header.size,
        accept: () => {
          receiver.accept();
          updateTransfer(id, { status: 'receiving' });
        },
        decline: () => {
          receiver.decline();
          updateTransfer(id, { status: 'declined' });
        },
      });
    });

    receiver.on('progress', (bytes) => {
      if (!activeReceiveId) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      if (dt > 0) {
        const instant = (bytes - lastBytes) / dt;
        smoothSpeed = smoothSpeed === 0 ? instant : 0.15 * instant + 0.85 * smoothSpeed;
      }
      lastBytes = bytes;
      lastTime = now;
      updateTransfer(activeReceiveId, { transferredBytes: bytes, speedBps: smoothSpeed });
    });

    receiver.on('done', (_fileName) => {
      if (!activeReceiveId) return;
      updateTransfer(activeReceiveId, { status: 'done' });
      activeReceiveId = null;
    });

    receiver.on('error', (e) => {
      if (!activeReceiveId) return;
      updateTransfer(activeReceiveId, { status: 'failed', errorMessage: e.message });
      activeReceiveId = null;
    });

    receiver.on('tooLarge', (_size) => {
      if (!activeReceiveId) return;
      updateTransfer(activeReceiveId, { status: 'failed', errorMessage: 'File too large for this browser. Use Chrome to receive large files.' });
      activeReceiveId = null;
    });

    const tt = new TextTransfer(channel);
    this.textTransfers.set(peerId, tt);
    tt.on('received', (payload: TextPayload) => {
      this.onIncomingText?.({ id: payload.id, peerId, peerName, content: payload.content });
    });
  }

  private _getOrCreateTextTransfer(peerId: string, channel: RTCDataChannel): TextTransfer {
    const existing = this.textTransfers.get(peerId);
    if (existing) return existing;
    const tt = new TextTransfer(channel);
    this.textTransfers.set(peerId, tt);
    return tt;
  }
}
