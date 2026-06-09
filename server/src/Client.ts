import type { WebSocket } from 'ws';
import type { ServerMessage } from './protocol.js';

export class Client {
  readonly id: string;
  displayName: string;
  readonly avatarSeed: string;
  readonly ip: string;
  localSubnet: string | null = null;
  roomKey: string; // current room key (IP-based or code-based)

  constructor(
    public readonly ws: WebSocket,
    id: string,
    displayName: string,
    avatarSeed: string,
    ip: string,
  ) {
    this.id = id;
    this.displayName = displayName;
    this.avatarSeed = avatarSeed;
    this.ip = ip;
    this.roomKey = `ip:${ip}`;
  }

  send(msg: ServerMessage): void {
    if (this.ws.readyState === 1 /* OPEN */) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  toPeerInfo() {
    return { id: this.id, displayName: this.displayName, avatarSeed: this.avatarSeed };
  }
}
