<script lang="ts">
  import { transfers } from '../../lib/stores/transfers.js';
  import ProgressBar from './ProgressBar.svelte';

  let { onRetry, onCancel }: { onRetry?: (transferId: string) => void; onCancel?: (transferId: string) => void } = $props();

  const visible = $derived(
    $transfers.filter((t) => t.status !== 'cancelled' || t.direction === 'send')
  );
</script>

{#if visible.length > 0}
  <aside class="toast-panel" aria-label="Transfer activity">
    <div class="panel-header">
      <span class="title">Transfers</span>
      <span class="count">{visible.length}</span>
    </div>
    <div class="list">
      {#each visible as t (t.id)}
        <div class="item">
          <ProgressBar transfer={t} onCancel={(t.status === 'sending' || t.status === 'receiving') ? () => onCancel?.(t.id) : undefined} />
          {#if t.status === 'failed' && onRetry}
            <button class="btn btn-ghost btn-sm retry-btn" onclick={() => onRetry?.(t.id)}>
              ↺ Retry
            </button>
          {/if}
        </div>
      {/each}
    </div>
  </aside>
{/if}

<style>
  .toast-panel {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: min(380px, calc(100vw - 48px));
    z-index: 40;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    box-shadow: var(--shadow-md);
    animation: slideUp 0.3s ease;
    max-height: 60vh;
    overflow-y: auto;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .title { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

  .count {
    background: var(--accent);
    color: white;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: var(--r-full);
  }

  .list { display: flex; flex-direction: column; gap: 6px; }
  .item { display: flex; flex-direction: column; gap: 4px; }
  .retry-btn { align-self: flex-end; font-size: 0.75rem; }
</style>
