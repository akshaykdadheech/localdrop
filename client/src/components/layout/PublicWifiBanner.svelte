<script lang="ts">
  import { peers } from '../../lib/stores/peers.js';

  let dismissed = $state(false);

  // Show warning when 3+ unknown peers appear (likely public WiFi)
  const showWarning = $derived(!dismissed && $peers.length >= 3);
</script>

{#if showWarning}
  <div class="banner animate-fadeIn" role="alert">
    <div class="inner">
      <span class="icon">🛡️</span>
      <div class="body">
        <strong>Public network detected</strong>
        <p>
          Multiple devices visible — you may be on a shared/public WiFi.
          Only accept files from devices you recognise.
          All transfers require your explicit approval.
        </p>
      </div>
      <button class="close" onclick={() => (dismissed = true)} aria-label="Dismiss">✕</button>
    </div>
  </div>
{/if}

<style>
  .banner {
    background: rgba(245, 158, 11, 0.08);
    border-bottom: 1px solid rgba(245, 158, 11, 0.25);
  }
  .inner {
    max-width: 960px; margin: 0 auto; padding: 10px 16px;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
  .body { flex: 1; }
  .body strong { color: #fcd34d; font-size: 0.82rem; display: block; margin-bottom: 2px; }
  .body p { font-size: 0.78rem; color: #fcd34d; opacity: 0.85; line-height: 1.5; }
  .close {
    flex-shrink: 0; background: none; border: none; color: #fcd34d;
    cursor: pointer; padding: 2px; opacity: 0.6; transition: opacity var(--t-fast);
  }
  .close:hover { opacity: 1; }
</style>
