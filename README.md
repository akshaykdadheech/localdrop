<div align="center">

# LocalDrop

### AirDrop for any device. No app. No signup. No cloud.

Open a webpage. See nearby devices. Send files — directly, at WiFi speed.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178c6)](https://www.typescriptlang.org/)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00)](https://svelte.dev/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ed)](https://hub.docker.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**[Self-Host Guide](SELF-HOST.md)** · **[Report Bug](https://github.com/akshaykdadheech/localdrop/issues)**

</div>

---

## What is LocalDrop?

LocalDrop lets you **send files between any devices** — iPhone to Windows, Android to Mac, Linux to anything — just by opening a webpage. No app install, no account, no cloud upload.

Files transfer **directly between devices over your local WiFi** using WebRTC. Your data never touches any server.

### How it works

```
1. Open LocalDrop on both devices (same WiFi)
2. Devices auto-discover each other
3. Pick a file → other device accepts
4. File transfers directly, peer-to-peer
5. Done. No cloud. No internet bandwidth used.
```

## Features

- **Zero Install** — works in any modern browser, no app needed
- **Cross-Platform** — iPhone, Android, Mac, Windows, Linux — all combinations
- **Peer-to-Peer** — files go directly between devices, never through a server
- **WiFi Speed** — transfers at your local network speed, not internet speed
- **Encrypted** — WebRTC provides mandatory DTLS encryption on all transfers
- **No Account** — no signup, no login, no tracking
- **Text & Files** — send files, photos, videos, or text snippets
- **QR Pairing** — scan a QR code to connect devices that don't auto-discover
- **Self-Hostable** — run your own instance with Docker, works fully offline
- **PWA** — install to home screen for an app-like experience
- **Open Source** — MIT licensed, fork and customize freely

## Quick Start

### Use the public instance

Self-host with Docker (see below) or run from source, then open the URL on both devices.

### Self-host with Docker

```bash
docker compose up -d
# Open http://<your-ip>:3001 on any device
```

For HTTPS (needed for large file streaming), see the [Self-Host Guide](SELF-HOST.md).

### Run from source

```bash
git clone https://github.com/akshaykdadheech/localdrop
cd localdrop
npm install
npm run dev
# Server: http://localhost:3001
# Client dev: http://localhost:5173
```

## How It Works (Technical)

```
┌──────────┐     WebSocket      ┌──────────────┐     WebSocket      ┌──────────┐
│  Device A │◄──────────────────►│   Signaling  │◄──────────────────►│  Device B │
│ (browser) │    (discovery +    │    Server     │    (discovery +    │ (browser) │
│           │     SDP/ICE)       │  (Node + ws)  │     SDP/ICE)       │           │
└─────┬─────┘                    └──────────────┘                    └─────┬─────┘
      │                                                                     │
      │              WebRTC DataChannel (P2P, encrypted)                    │
      └─────────────────────────── File Data ──────────────────────────────┘
                           Direct LAN, no server
```

- **Signaling server** — tiny Node.js + WebSocket service. Groups devices by IP, relays WebRTC handshake messages. Never sees file data.
- **WebRTC DataChannel** — peer-to-peer encrypted tunnel. On the same LAN, data goes directly between devices at WiFi speed.
- **File System Access API** — on Chrome/Edge, a save dialog opens after transfer completes. Other browsers use a standard download.

## Platform Support

| Platform | Send | Receive (any size) | Receive (large, >500MB) |
|---|---|---|---|
| Chrome / Edge (desktop) | ✅ | ✅ | ✅ Save dialog after transfer |
| Chrome (Android) | ✅ | ✅ | ✅ Save dialog after transfer |
| Safari (Mac) | ✅ | ✅ | ⚠️ RAM limited (~500MB max) |
| Safari (iPhone/iPad) | ✅ | ✅ | ⚠️ RAM limited (~500MB max) |
| Firefox | ⛔ Blocked | ⛔ Blocked | ⛔ Blocked |

> Firefox is blocked due to unreliable WebRTC DataChannel behavior for large transfers. We recommend Chrome or Edge.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Svelte 5 + Vite |
| Backend | Node.js + ws (WebSocket) |
| Transport | WebRTC DataChannel (SCTP/DTLS) |
| Language | TypeScript (end-to-end) |
| PWA | vite-plugin-pwa + Workbox |
| Containerization | Docker + Docker Compose |

## Project Structure

```
localdrop/
├── client/                 # Svelte 5 PWA
│   └── src/
│       ├── app/            # Root App.svelte
│       ├── components/     # UI components (gate, discovery, transfer, pairing)
│       └── lib/            # Core logic
│           ├── browser/    # Device detection, browser gating
│           ├── signaling/  # WebSocket client + protocol types
│           ├── webrtc/     # RTCPeerConnection + DataChannel wrapper
│           ├── transfer/   # Sender, Receiver, chunking, backpressure
│           ├── pairing/    # Room codes + QR generation
│           └── stores/     # Svelte stores (peers, transfers, connection)
├── server/                 # Signaling server
│   └── src/
│       ├── index.ts        # HTTP + WebSocket server
│       ├── Room.ts         # IP-based + code-based room management
│       ├── Client.ts       # Per-connection state
│       └── MessageHandler.ts # Signaling message routing
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml
└── SELF-HOST.md            # Self-hosting guide with TLS setup
```

## Security & Privacy

- **End-to-end encrypted** — WebRTC mandates DTLS encryption. No opt-out possible.
- **No data on server** — the signaling server only sees connection metadata (IP, device name). File bytes are never routed through it.
- **Accept before receive** — the receiver must explicitly accept before any file data is sent.
- **Verification number** — a per-connection verification code is shown on both devices to detect man-in-the-middle attacks.
- **No persistence** — nothing is stored. Close the tab and everything is gone.
- **Public WiFi warning** — a banner warns users when multiple unknown devices are detected.

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Good first issues:**
- Improve mobile UI responsiveness
- Add drag-and-drop folder support
- Add transfer resume on disconnect
- Improve accessibility (screen reader testing)

## Roadmap

- [x] Auto-discovery by IP
- [x] WebRTC P2P file transfer
- [x] QR code + 6-digit pairing
- [x] Text/clipboard send
- [x] PWA + offline support
- [x] Docker self-hosting
- [x] Live connection diagnostics
- [ ] TURN relay for cross-network transfer
- [ ] Transfer resume on disconnect
- [ ] Folder transfer
- [ ] Parallel multi-channel transfers

## License

[MIT](LICENSE) — use it however you want.

---

<div align="center">

**If LocalDrop helped you, give it a ⭐ on GitHub!**

Built with WebRTC, Svelte, and the belief that sending a file shouldn't require an app, an account, or the cloud.

</div>
