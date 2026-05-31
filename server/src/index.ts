import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import { config } from './config.js';
import { Client } from './Client.js';
import { RoomManager } from './Room.js';
import { handleMessage } from './MessageHandler.js';
import { nameFromSeed, seedFromId } from './names.js';

const rooms = new RoomManager();

function normalizeIp(ip: string): string {
  const v4mapped = ip.replace(/^::ffff:/i, '');
  if (!v4mapped.includes(':')) return v4mapped;
  return v4mapped.split(':').slice(0, 4).join(':');
}

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('fe80:')) return true; // IPv6 link-local
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return false;
  const [a, b] = parts;
  return a === 127 || a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168);
}

function createHttpServer() {
  if (config.tlsCert && config.tlsKey) {
    try {
      return https.createServer({
        cert: fs.readFileSync(config.tlsCert),
        key: fs.readFileSync(config.tlsKey),
      });
    } catch (e) {
      console.warn('[localdrop] TLS files not found, falling back to HTTP:', e);
    }
  }
  return http.createServer();
}

const server = createHttpServer();

// Serve static client build in production
const distPath = path.resolve(import.meta.dirname, '../../client/dist');
server.on('request', (req, res) => {
  if (!fs.existsSync(distPath)) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('LocalDrop signaling server running.');
    return;
  }

  const url = req.url?.split('?')[0] ?? '/';
  let filePath = path.resolve(distPath, url === '/' ? 'index.html' : `.${url}`);
  if (!filePath.startsWith(distPath)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  if (!fs.existsSync(filePath)) filePath = path.join(distPath, 'index.html');

  const ext = path.extname(filePath);
  const mime: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
  };

  res.writeHead(200, { 'Content-Type': mime[ext] ?? 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const rawIp =
    (req.headers['cf-connecting-ip'] as string | undefined) ??
    (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
    req.socket.remoteAddress ??
    'unknown';

  const ip = normalizeIp(rawIp);

  console.log(`[connect] rawIp=${rawIp} roomIp=${ip}`);

  const id = nanoid(10);
  const seed = seedFromId(id);
  const displayName = nameFromSeed(seed);
  const avatarSeed = id;

  const client = new Client(ws, id, displayName, avatarSeed, ip);
  rooms.add(client);

  client.send({ type: 'server-hello', peerId: id, displayName, avatarSeed });

  const peers = rooms.peers(client);
  client.send({ type: 'peer-list', peers: peers.map((p) => p.toPeerInfo()) });

  rooms.broadcast(client, { type: 'peer-joined', peer: client.toPeerInfo() });

  const hb = setInterval(() => {
    if (ws.readyState === ws.OPEN) ws.ping();
  }, config.pingInterval);

  ws.on('message', (data) => {
    const str = data.toString();
    try {
      const msg = JSON.parse(str);
      if (msg.type && msg.type !== 'ping') {
        console.log(`[msg] ${client.id} → ${msg.type}${msg.to ? ` → ${msg.to}` : ''} (${str.length} bytes)`);
      }
    } catch { /* non-JSON — should never happen on signaling WS */ }
    handleMessage(str, client, rooms);
  });

  ws.on('close', () => {
    clearInterval(hb);
    rooms.broadcast(client, { type: 'peer-left', peerId: client.id });
    rooms.remove(client);
  });

  ws.on('error', (err) => {
    console.error(`[ws] error for ${id}:`, err.message);
  });
});

server.listen(config.port, config.host, () => {
  const protocol = config.tlsCert ? 'wss' : 'ws';
  console.log(`[localdrop] server listening on ${protocol}://${config.host}:${config.port}`);
});
