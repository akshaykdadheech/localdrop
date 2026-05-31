<script lang="ts">
  import type { TransferState } from '../../lib/stores/transfers.js';

  let { transfer, onCancel }: { transfer: TransferState; onCancel?: () => void } = $props();

  function formatSize(bytes: number): string {
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }

  function formatSpeed(bps: number): string {
    if (bps < 1024) return `${bps.toFixed(0)} B/s`;
    if (bps < 1024 ** 2) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${(bps / 1024 ** 2).toFixed(1)} MB/s`;
  }

  function formatEta(bps: number, remaining: number): string {
    if (bps <= 0) return '—';
    const secs = Math.ceil(remaining / bps);
    if (secs < 60) return `${secs}s`;
    return `${Math.ceil(secs / 60)}m`;
  }

  const pct = $derived(
    transfer.totalBytes > 0
      ? Math.min(100, Math.round((transfer.transferredBytes / transfer.totalBytes) * 100))
      : 0,
  );

  const remaining = $derived(transfer.totalBytes - transfer.transferredBytes);
</script>

<div class="progress-wrap" aria-label="Transfer progress {pct}%">
  <div class="header-row">
    <div class="file-info">
      <span class="direction-icon">{transfer.direction === 'send' ? '↑' : '↓'}</span>
      <span class="file-name truncate">{transfer.fileName}</span>
    </div>
    <span class="pct">{pct}%</span>
  </div>

  <div class="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
    <div class="progress-fill" style:width="{pct}%"></div>
  </div>

  <div class="meta-row">
    <span>{formatSize(transfer.transferredBytes)} / {formatSize(transfer.totalBytes)}</span>
    {#if transfer.status === 'sending' || transfer.status === 'receiving'}
      <span>{formatSpeed(transfer.speedBps)}</span>
      <span>ETA {formatEta(transfer.speedBps, remaining)}</span>
      {#if onCancel}
        <button class="cancel-btn" onclick={onCancel} aria-label="Cancel transfer">✕</button>
      {/if}
    {:else if transfer.status === 'done'}
      <span class="done">✓ Done</span>
    {:else if transfer.status === 'failed'}
      <span class="error">✗ {transfer.errorMessage ?? 'Failed'}</span>
    {:else if transfer.status === 'declined'}
      <span class="muted">Declined</span>
    {:else if transfer.status === 'cancelled'}
      <span class="muted">Cancelled</span>
    {/if}
  </div>
</div>

<style>
  .progress-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    background: var(--surface-2);
    border-radius: var(--r-md);
    border: 1px solid var(--border);
    font-size: 0.8rem;
  }

  .header-row, .meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .file-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .direction-icon {
    color: var(--accent);
    font-weight: 700;
    flex-shrink: 0;
    font-size: 0.9rem;
  }

  .file-name { flex: 1; min-width: 0; color: var(--text-primary); font-weight: 500; }

  .pct { color: var(--accent-text); font-variant-numeric: tabular-nums; font-weight: 600; }

  .meta-row {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    flex-wrap: wrap;
  }

  .meta-row span + span::before { content: '·'; margin: 0 4px; }

  .done { color: var(--success); }
  .error { color: var(--danger); }
  .muted { color: var(--text-muted); }
  .cancel-btn {
    background: none; border: none; color: var(--danger); cursor: pointer;
    font-size: 0.75rem; padding: 0 4px; opacity: 0.7; transition: opacity var(--t-fast);
  }
  .cancel-btn:hover { opacity: 1; }
</style>
