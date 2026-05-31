import type { Client } from './Client.js';
import type { ServerMessage } from './protocol.js';
import { config } from './config.js';

export class RoomManager {
  private rooms = new Map<string, Set<Client>>();
  private codeExpiry = new Map<string, ReturnType<typeof setTimeout>>();

  add(client: Client): void {
    this.getOrCreate(client.roomKey).add(client);
  }

  remove(client: Client): void {
    const room = this.rooms.get(client.roomKey);
    if (!room) return;
    room.delete(client);
    if (room.size === 0) this.rooms.delete(client.roomKey);
  }

  move(client: Client, newKey: string): void {
    this.remove(client);
    client.roomKey = newKey;
    this.getOrCreate(newKey).add(client);
  }

  peers(client: Client): Client[] {
    return [...(this.rooms.get(client.roomKey) ?? [])].filter((c) => c.id !== client.id);
  }

  allInRoom(client: Client): Client[] {
    return [...(this.rooms.get(client.roomKey) ?? [])];
  }

  broadcast(client: Client, msg: ServerMessage): void {
    for (const peer of this.peers(client)) peer.send(msg);
  }

  get(id: string): Client | undefined {
    for (const room of this.rooms.values()) {
      for (const c of room) {
        if (c.id === id) return c;
      }
    }
    return undefined;
  }

  registerCode(code: string, client: Client): void {
    const key = `code:${code}`;
    const existing = this.codeExpiry.get(code);
    if (existing) clearTimeout(existing);
    this.codeExpiry.set(
      code,
      setTimeout(() => {
        this.codeExpiry.delete(code);
        this.rooms.delete(key);
      }, config.roomCodeTtl),
    );
    this.move(client, key);
  }

  hasCode(code: string): boolean {
    return this.rooms.has(`code:${code}`);
  }

  peersInCode(code: string): Client[] {
    return [...(this.rooms.get(`code:${code}`) ?? [])];
  }

  private getOrCreate(key: string): Set<Client> {
    let r = this.rooms.get(key);
    if (!r) { r = new Set(); this.rooms.set(key, r); }
    return r;
  }
}
