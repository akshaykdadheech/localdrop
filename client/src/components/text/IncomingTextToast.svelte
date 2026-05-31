<script lang="ts">
  import type { IncomingText } from '../../lib/ConnectionManager.js';

  let { message, onDismiss }: { message: IncomingText; onDismiss: () => void } = $props();

  let copied = $state(false);

  async function copy() {
    await navigator.clipboard.writeText(message.content);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="toast animate-slideUp" role="status" aria-live="polite">
  <div class="header">
    <span class="from">💬 from <strong>{message.peerName}</strong></span>
    <button class="close-btn" onclick={onDismiss} aria-label="Dismiss">✕</button>
  </div>
  <p class="content">{message.content}</p>
  <button class="btn btn-ghost btn-sm" onclick={copy}>
    {copied ? '✓ Copied!' : 'Copy'}
  </button>
</div>

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    left: 24px;
    width: min(320px, calc(100vw - 48px));
    background: var(--surface-1);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-lg);
    padding: 14px;
    z-index: 41;
    box-shadow: var(--shadow-md);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .from { font-size: 0.78rem; color: var(--text-muted); }
  .from strong { color: var(--text-primary); }

  .close-btn {
    background: none; border: none; color: var(--text-muted); cursor: pointer;
    font-size: 0.8rem; padding: 2px 4px;
    transition: color var(--t-fast);
  }
  .close-btn:hover { color: var(--text-primary); }

  .content {
    font-size: 0.9rem;
    color: var(--text-primary);
    line-height: 1.5;
    margin-bottom: 10px;
    word-break: break-word;
    white-space: pre-wrap;
    max-height: 120px;
    overflow-y: auto;
  }
</style>
