<script lang="ts">
  import { detectBrowser } from '../../lib/browser/detect.js';

  let dismissed = $state(false);

  // macOS Safari/Chrome may trigger Local Network permission prompt
  const cap = detectBrowser();
  const isMac = /Macintosh|Mac OS X/.test(navigator.userAgent);
  const show = !dismissed && isMac && !cap.isIos;
  let expanded = $state(false);
</script>

{#if show && expanded}
  <div class="banner animate-fadeIn" role="status">
    <div class="inner">
      <span class="icon">📡</span>
      <div class="body">
        <strong>Local Network Access</strong>
        <p>
          If macOS asks "Allow LocalDrop to find devices on your local network?", tap <strong>Allow</strong>.
          This is needed for direct device-to-device connections. Without it, transfers may be slower
          or fail to connect.
        </p>
        <p style="margin-top: 4px; opacity: 0.7;">
          You can change this later in System Settings → Privacy & Security → Local Network.
        </p>
      </div>
      <button class="close" onclick={() => { dismissed = true; expanded = false; }} aria-label="Dismiss">✕</button>
    </div>
  </div>
{/if}
{#if show && !dismissed && !expanded}
  <!-- Small hint that can be expanded -->
{/if}

<style>
  .banner {
    background: rgba(6, 182, 212, 0.08);
    border-bottom: 1px solid rgba(6, 182, 212, 0.25);
  }
  .inner {
    max-width: 960px; margin: 0 auto; padding: 10px 16px;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .icon { font-size: 1rem; flex-shrink: 0; }
  .body { flex: 1; }
  .body strong { color: #67e8f9; font-size: 0.82rem; display: block; margin-bottom: 2px; }
  .body p { font-size: 0.78rem; color: #67e8f9; opacity: 0.85; line-height: 1.5; }
  .close {
    flex-shrink: 0; background: none; border: none; color: #67e8f9;
    cursor: pointer; padding: 2px; opacity: 0.6;
  }
  .close:hover { opacity: 1; }
</style>
