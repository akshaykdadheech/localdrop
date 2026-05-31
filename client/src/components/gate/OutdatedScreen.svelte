<script lang="ts">
  import type { BrowserCapability } from '../../lib/browser/detect.js';

  let { capability, onContinue }: { capability: BrowserCapability; onContinue: () => void } = $props();
</script>

<div class="outdated">
  <div class="content animate-slideUp">
    <div class="icon">⚠️</div>
    <h1>Update your browser</h1>
    <p>
      You're using <strong>{capability.brand} {capability.version}</strong>.
      LocalDrop works best on version 110 or newer.
      Older versions may have unstable file transfers.
    </p>

    <div class="actions">
      <a href="https://www.google.com/chrome/" target="_blank" rel="noopener" class="btn btn-primary btn-lg">
        Update Chrome
      </a>
      <button class="btn btn-ghost btn-lg" onclick={onContinue}>Continue anyway</button>
    </div>
  </div>
</div>

<style>
  .outdated {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .content { max-width: 440px; text-align: center; }
  .icon { font-size: 3rem; margin-bottom: 20px; }

  h1 { font-size: 1.75rem; margin-bottom: 12px; }

  p {
    color: var(--text-secondary);
    line-height: 1.7;
    margin-bottom: 28px;
  }

  p strong { color: var(--text-primary); }

  .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
</style>
