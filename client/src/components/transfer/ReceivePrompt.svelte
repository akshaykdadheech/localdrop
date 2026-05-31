<script lang="ts">
  import type { IncomingTransfer } from '../../lib/ConnectionManager.js';
  import { detectBrowser } from '../../lib/browser/detect.js';
  import { MAX_BLOB_SIZE } from '../../lib/transfer/constants.js';

  let { transfer }: { transfer: IncomingTransfer } = $props();

  const cap = detectBrowser();
  const canStream = 'showSaveFilePicker' in window && cap.engine === 'chromium';
  const tooBig = $derived(!canStream && transfer.size > MAX_BLOB_SIZE);

  function formatSize(bytes: number): string {
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }
</script>

<div class="modal-overlay" role="alertdialog" aria-modal="true"
     aria-label="Incoming file from {transfer.peerName}">
  <div class="modal-box animate-slideUp">
    <div class="incoming-icon">{tooBig ? '⚠️' : '📥'}</div>
    <h2 class="modal-title">Incoming file</h2>
    <div class="modal-body">
      <p><strong>{transfer.peerName}</strong> wants to send you:</p>
      <div class="file-card">
        <span class="file-icon">📄</span>
        <div>
          <div class="file-name">{transfer.fileName}</div>
          <div class="file-size">{formatSize(transfer.size)}</div>
        </div>
      </div>

      {#if tooBig}
        <div class="warning">
          <strong>⚠️ File too large for this device</strong><br/>
          Your browser can only receive files up to {formatSize(MAX_BLOB_SIZE)} in memory.
          This file is <strong>{formatSize(transfer.size)}</strong>.
          Ask the sender to use <strong>Chrome on desktop</strong> as the receiver instead.
        </div>
      {/if}
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" onclick={transfer.decline}>Decline</button>
      {#if !tooBig}
        <button class="btn btn-primary" onclick={transfer.accept}>Accept</button>
      {:else}
        <button class="btn btn-danger" onclick={transfer.decline}>Can't receive</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .incoming-icon { font-size: 2rem; margin-bottom: 8px; }

  .file-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--surface-2);
    border-radius: var(--r-md);
    margin-top: 10px;
    border: 1px solid var(--border);
  }

  .file-icon { font-size: 1.5rem; flex-shrink: 0; }
  .file-name { font-weight: 600; font-size: 0.9rem; word-break: break-all; color: var(--text-primary); }
  .file-size { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

  .warning {
    margin-top: 12px;
    padding: 12px 14px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.35);
    border-radius: var(--r-md);
    font-size: 0.82rem;
    color: #fcd34d;
    line-height: 1.6;
  }

  .warning strong { color: #fbbf24; }
</style>

