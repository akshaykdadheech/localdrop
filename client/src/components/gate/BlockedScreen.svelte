<script lang="ts">
  import type { BrowserCapability } from '../../lib/browser/detect.js';

  let { capability }: { capability: BrowserCapability } = $props();

  let copied = $state(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 2000);
    });
  }

  let expanded = $state(false);
</script>

<div class="blocked">
  <div class="content animate-slideUp">
    <div class="icon" aria-hidden="true">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" stroke="#ef4444" stroke-width="2" fill="rgba(239,68,68,0.1)"/>
        <path d="M20 32h24" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="8" fill="none" stroke="#ef4444" stroke-width="2"/>
      </svg>
    </div>

    <h1>Open in Chrome or Edge</h1>
    <p class="subtitle">
      LocalDrop requires a Chromium-based browser for the best experience.
      You're using <strong>{capability.brand}</strong>, which doesn't support all the APIs needed.
    </p>

    <div class="actions">
      <button class="btn btn-primary btn-lg" onclick={copyLink}>
        {#if copied}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.485 1.431a1.473 1.473 0 0 0-2.066 0l-6.109 6.33-2.721-2.764a1.473 1.473 0 0 0-2.093 2.073l3.758 3.818a1.473 1.473 0 0 0 2.104-.008l7.121-7.37a1.473 1.473 0 0 0 0-2.079"/></svg>
          Copied!
        {:else}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>
          Copy Link
        {/if}
      </button>

      <a href="https://www.google.com/chrome/" target="_blank" rel="noopener" class="btn btn-ghost btn-lg">
        Get Chrome
      </a>
    </div>

    <button class="why-toggle" onclick={() => (expanded = !expanded)} aria-expanded={expanded}>
      Why Chrome?
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style:transform={expanded ? 'rotate(180deg)' : ''} style:transition="transform 0.2s">
        <path d="M6 8L1 3h10z"/>
      </svg>
    </button>

    {#if expanded}
      <div class="why-content animate-fadeIn">
        <p>LocalDrop streams large files directly to your disk using the <strong>File System Access API</strong>,
        which is only supported in Chrome and Edge. Without it, files must be buffered entirely in RAM —
        making large transfers impossible on mobile.</p>
        <p style="margin-top: 8px">On iPhone and iPad, Apple requires all browsers to use Safari's engine,
        so LocalDrop works on iOS even if it says "Chrome" on the icon.</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .blocked {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: radial-gradient(ellipse at center, rgba(239, 68, 68, 0.05) 0%, var(--surface-0) 70%);
  }

  .content {
    max-width: 480px;
    width: 100%;
    text-align: center;
  }

  .icon {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

  h1 {
    font-size: clamp(1.5rem, 5vw, 2rem);
    margin-bottom: 12px;
    color: var(--text-primary);
  }

  .subtitle {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 28px;
  }

  .subtitle strong { color: var(--text-primary); }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .why-toggle {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.85rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: var(--r-full);
    transition: color var(--t-fast);
  }
  .why-toggle:hover { color: var(--text-secondary); }

  .why-content {
    margin-top: 12px;
    padding: 16px 20px;
    background: var(--surface-2);
    border-radius: var(--r-md);
    text-align: left;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-secondary);
    border: 1px solid var(--border);
  }

  .why-content strong { color: var(--text-primary); }
</style>
