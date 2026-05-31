# LocalDrop — Self-Hosting Guide

Run LocalDrop on your own LAN with **zero internet dependency**.

## Quick Start (Docker)

```bash
docker compose up -d
```

Open `http://<your-machine-ip>:3001` on any device on the same WiFi.

## HTTPS Setup (Required for full features)

Service Workers and the File System Access API require a **secure context** (HTTPS).
On `localhost` this works automatically, but on a LAN IP (`192.168.x.x`) you need a TLS certificate.

### Option 1: mkcert (recommended, 2 minutes)

```bash
# Install mkcert
brew install mkcert      # macOS
# or: sudo apt install mkcert  # Ubuntu/Debian

# Create a local CA and trust it
mkcert -install

# Generate cert for your LAN IP
mkdir -p certs
mkcert -cert-file certs/cert.pem -key-file certs/key.pem \
  "192.168.1.100" "localdrop.local" localhost 127.0.0.1

# Tell LocalDrop to use it
echo "TLS_CERT=./certs/cert.pem" >> .env
echo "TLS_KEY=./certs/key.pem" >> .env
```

**Trust on other devices:**
- **iPhone/iPad:** AirDrop the root CA file (`mkcert -CAROOT` shows the path) → Settings → Install Profile → Trust
- **Android:** Copy CA → Settings → Security → Install certificate
- **Windows:** Double-click CA file → Install → Trusted Root

### Option 2: Self-signed (no install needed)

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout certs/key.pem -out certs/cert.pem \
  -days 365 -subj "/CN=localdrop"

echo "TLS_CERT=./certs/cert.pem" >> .env
echo "TLS_KEY=./certs/key.pem" >> .env
```

Browsers will show a security warning — click "Advanced → Proceed" on each device once.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `HOST` | `0.0.0.0` | Bind address |
| `TLS_CERT` | — | Path to TLS certificate |
| `TLS_KEY` | — | Path to TLS private key |
| `PUBLIC_STUN_URL` | `stun:stun.l.google.com:19302` | STUN server (clear for offline) |
| `ROOM_CODE_TTL` | `600000` | Room code expiry (ms) |

## Fully Offline (No Internet)

1. Clear `PUBLIC_STUN_URL` in `.env` (or set it empty)
2. Ensure all devices are on the **same subnet** (not guest/isolated networks)
3. WebRTC will use host/mDNS candidates for direct LAN connections
4. The app shell is cached by the Service Worker — reload works even if the server restarts

## Docker Compose with TLS

```yaml
services:
  localdrop:
    build: .
    ports:
      - "3443:3001"
    environment:
      - TLS_CERT=/app/certs/cert.pem
      - TLS_KEY=/app/certs/key.pem
    volumes:
      - ./certs:/app/certs:ro
```

Then open `https://<your-ip>:3443`.

## Troubleshooting

| Issue | Fix |
|---|---|
| "Not secure" warning | Install the mkcert CA or accept the self-signed cert |
| Devices don't see each other | Ensure same subnet, not on guest/isolated WiFi |
| File System Access not working | Must be HTTPS (not HTTP) — set up TLS |
| Transfer fails on public WiFi | AP/client isolation blocks P2P — use a personal hotspot |
