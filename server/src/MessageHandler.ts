import type { Client } from './Client.js';
import type { RoomManager } from './Room.js';
import type { ClientMessage } from './protocol.js';

function sameSubnet(ipA: string, ipB: string): boolean {
  if (ipA === ipB) return true;
  if (ipA === '127.0.0.1' || ipB === '127.0.0.1') return true; // localhost dev
  const a = ipA.split('.');
  const b = ipB.split('.');
  if (a.length !== 4 || b.length !== 4) return false;
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; // /24 subnet
}

export function handleMessage(raw: string, client: Client, rooms: RoomManager): void {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw) as ClientMessage;
  } catch {
    return;
  }

  switch (msg.type) {
    case 'ping':
      client.send({ type: 'pong' });
      break;

    case 'set-name': {
      const name = msg.name.trim().slice(0, 32);
      if (name) {
        client.displayName = name;
        rooms.broadcast(client, { type: 'peer-joined', peer: client.toPeerInfo() });
      }
      break;
    }

    case 'join-room-code': {
      const code = msg.code.trim();
      if (!/^\d{6}$/.test(code)) {
        client.send({ type: 'room-error', message: 'Invalid code format.' });
        return;
      }
      // Check if anyone already in this code room is on a different subnet
      const existingPeers = rooms.peersInCode(code);
      const foreignPeer = existingPeers.find((p) => {
        // if both have local subnet info, use that for comparison
        if (client.localSubnet && p.localSubnet) return client.localSubnet !== p.localSubnet;
        // fallback: compare public IPs
        return !sameSubnet(p.ip, client.ip);
      });
      if (foreignPeer) {
        client.send({ type: 'room-error', message: 'This code was created on a different network. Both devices must be on the same WiFi.' });
        return;
      }
      rooms.registerCode(code, client);
      const peers = rooms.peers(client);
      client.send({ type: 'room-joined', code, peers: peers.map((p) => p.toPeerInfo()) });
      rooms.broadcast(client, { type: 'peer-joined', peer: client.toPeerInfo() });
      break;
    }

    case 'leave-room': {
      rooms.broadcast(client, { type: 'peer-left', peerId: client.id });
      rooms.move(client, `ip:${client.ip}`);
      const peers = rooms.peers(client);
      client.send({ type: 'peer-list', peers: peers.map((p) => p.toPeerInfo()) });
      rooms.broadcast(client, { type: 'peer-joined', peer: client.toPeerInfo() });
      break;
    }

    case 'offer':
    case 'answer': {
      const target = rooms.get(msg.to);
      if (target) {
        target.send({ type: msg.type, from: client.id, sdp: msg.sdp } as never);
      }
      break;
    }

    case 'ice-candidate': {
      const target = rooms.get(msg.to);
      if (target) {
        target.send({ type: 'ice-candidate', from: client.id, candidate: msg.candidate });
      }
      break;
    }

    case 'set-local-subnet': {
      const subnet = msg.subnet.trim();
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(subnet)) break;
      client.localSubnet = subnet;
      const newKey = `subnet:${subnet}`;
      if (client.roomKey === newKey) break;
      rooms.broadcast(client, { type: 'peer-left', peerId: client.id });
      rooms.move(client, newKey);
      const peers = rooms.peers(client);
      client.send({ type: 'peer-list', peers: peers.map((p) => p.toPeerInfo()) });
      rooms.broadcast(client, { type: 'peer-joined', peer: client.toPeerInfo() });
      break;
    }
  }
}
