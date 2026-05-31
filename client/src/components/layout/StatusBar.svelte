<script lang="ts">
  import { connection } from '../../lib/stores/connection.js';
  import { peers } from '../../lib/stores/peers.js';

  const statusLabel: Record<string, string> = {
    connected: 'Connected',
    connecting: 'Connecting…',
    disconnected: 'Disconnected',
    error: 'Connection error',
  };
</script>

<div class="status-bar">
  <div class="inner">
    <div class="dot-group">
      <span class="dot" class:dot-connected={$connection.status === 'connected'}
            class:dot-connecting={$connection.status === 'connecting'}
            class:dot-error={$connection.status === 'error' || $connection.status === 'disconnected'}
            aria-hidden="true"></span>
      <span class="label">{statusLabel[$connection.status] ?? 'Unknown'}</span>
    </div>

    {#if $connection.status === 'connected'}
      <span class="peer-count">
        {$peers.length} device{$peers.length !== 1 ? 's' : ''} nearby
      </span>
    {/if}

    {#if $connection.icePath}
      <span class="ice-path" class:warn={!$connection.icePath.includes('Direct')}>
        {$connection.icePath}
      </span>
    {/if}
  </div>
</div>

<style>
  .status-bar {
    height: var(--status-h);
    background: var(--surface-1);
    border-bottom: 1px solid var(--border);
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 20px;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .dot-group { display: flex; align-items: center; gap: 6px; }

  .dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot-connected { background: var(--success); box-shadow: 0 0 6px var(--success); }
  .dot-connecting { background: var(--warning); animation: pulse-glow 1.5s infinite; }
  .dot-error { background: var(--danger); }

  .label { font-weight: 500; }

  .peer-count { color: var(--text-secondary); }

  .ice-path {
    margin-left: auto;
    font-weight: 600;
    color: var(--success);
  }
  .ice-path.warn { color: var(--warning); }
</style>
