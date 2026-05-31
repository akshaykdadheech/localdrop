<script lang="ts">
  let { peerName, onDismiss }: { peerName: string; onDismiss: () => void } = $props();
</script>

<div class="banner animate-slideUp" role="alert">
  <div class="inner">
    <span class="icon">🚫</span>
    <div class="body">
      <strong>Can't reach {peerName}</strong>
      <p>
        Direct connection couldn't be established. This happens when:
      </p>
      <ul style="margin: 6px 0 0 16px; line-height: 1.8;">
        <li><strong>Different networks</strong> — cross-network transfer needs a TURN relay server (coming in v2)</li>
        <li><strong>Same WiFi but isolated</strong> — some routers block device-to-device traffic (guest networks, AP isolation)</li>
      </ul>
      <p style="margin-top: 8px;">
        <strong>Fix:</strong> Make sure both devices are on the <strong>same WiFi network</strong> (not guest). If using room code on same WiFi, try auto-discovery instead (refresh both devices).
      </p>
    </div>
    <button class="close" onclick={onDismiss} aria-label="Dismiss">✕</button>
  </div>
</div>

<style>
  .banner {
    position: fixed;
    top: calc(var(--header-h) + var(--status-h) + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    width: min(520px, calc(100vw - 32px));
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: var(--r-lg);
    backdrop-filter: blur(12px);
  }

  .inner {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
  }

  .icon { font-size: 1.2rem; flex-shrink: 0; }

  .body { flex: 1; }
  .body strong { color: #fca5a5; font-size: 0.9rem; display: block; margin-bottom: 4px; }
  .body p { font-size: 0.82rem; color: #fca5a5; opacity: 0.85; line-height: 1.5; }

  .close {
    background: none; border: none; color: #fca5a5; opacity: 0.6;
    cursor: pointer; font-size: 0.85rem; padding: 2px 4px; flex-shrink: 0;
    transition: opacity var(--t-fast);
  }
  .close:hover { opacity: 1; }
</style>
