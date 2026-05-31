<script lang="ts">
  import { diagnostics } from '../../lib/stores/diagnostics.js';

  let open = $state(false);

  function fmtSpeed(bps: number): string {
    if (bps < 1024) return `${bps.toFixed(0)} B/s`;
    if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`;
    return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
  }

  const entries = $derived(Object.values($diagnostics));
  const hasData = $derived(entries.length > 0);
</script>

<!-- Floating toggle button -->
<button class="diag-toggle" class:active={open} onclick={() => (open = !open)}
        aria-label="Toggle connection diagnostics" title="Connection diagnostics">
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M1 11l3-3 2.5 2.5L11 6l4 4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="14" cy="3" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
  {#if hasData}<span class="dot-live" aria-hidden="true"></span>{/if}
</button>

{#if open}
  <aside class="diag-panel animate-fadeIn" aria-label="Connection diagnostics">
    <div class="diag-header">
      <span>Connection Diagnostics</span>
      <button class="close" onclick={() => (open = false)} aria-label="Close">✕</button>
    </div>

    {#if !hasData}
      <p class="empty">No active connection. Start a transfer to see live stats.</p>
    {:else}
      {#each entries as d (d.peerId)}
        <div class="conn-card">
          <div class="conn-title">
            <span class="peer">{d.peerName}</span>
            <span class="path-badge" class:good={d.path === 'direct-lan'} class:warn={d.path !== 'direct-lan'}>
              {d.pathLabel}
            </span>
          </div>

          <div class="speed-row">
            <div class="speed-box">
              <span class="speed-label">↑ Send</span>
              <span class="speed-val">{fmtSpeed(d.sendBps)}</span>
            </div>
            <div class="speed-box">
              <span class="speed-label">↓ Recv</span>
              <span class="speed-val">{fmtSpeed(d.recvBps)}</span>
            </div>
            <div class="speed-box">
              <span class="speed-label">RTT</span>
              <span class="speed-val">{d.rttMs != null ? `${d.rttMs}ms` : '—'}</span>
            </div>
          </div>

          <div class="detail-grid">
            <span class="k">Local</span>
            <span class="v">{d.localType} · {d.localAddr}</span>
            <span class="k">Remote</span>
            <span class="v">{d.remoteType} · {d.remoteAddr}</span>
          </div>

          {#if d.path !== 'direct-lan'}
            <div class="hint">
              ⚠️ <strong>Slow connection</strong> — files are going through your router instead of directly between devices.<br/><br/>
              <strong>How to fix:</strong><br/>
              • Make sure both devices are on the <strong>same WiFi name</strong> (not guest WiFi)<br/>
              • Move both devices closer to the router<br/>
              • Try connecting both to your <strong>phone's hotspot</strong> instead<br/>
              • On Mac: if you see a "Local Network" popup, tap <strong>Allow</strong>
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </aside>
{/if}

<style>
  .diag-toggle {
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 45;
    width: 40px; height: 40px;
    border-radius: var(--r-full);
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--t-fast);
  }
  .diag-toggle:hover, .diag-toggle.active { border-color: var(--accent); color: var(--accent-text); }

  .dot-live {
    position: absolute; top: 6px; right: 6px;
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 6px var(--success);
    animation: pulse-glow 1.5s infinite;
  }

  .diag-panel {
    position: fixed;
    bottom: 76px;
    left: 24px;
    z-index: 45;
    width: min(380px, calc(100vw - 48px));
    max-height: 60vh;
    overflow-y: auto;
    background: var(--surface-1);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 14px;
    box-shadow: var(--shadow-md);
    font-size: 0.8rem;
  }

  .diag-header {
    display: flex; align-items: center; justify-content: space-between;
    font-weight: 700; font-size: 0.85rem; margin-bottom: 12px;
    color: var(--text-primary);
  }
  .close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem; }
  .close:hover { color: var(--text-primary); }

  .empty { color: var(--text-muted); font-size: 0.8rem; line-height: 1.5; }

  .conn-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    padding: 12px;
    margin-bottom: 10px;
  }

  .conn-title {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px; gap: 8px;
  }
  .peer { font-weight: 600; color: var(--text-primary); }
  .path-badge { font-size: 0.72rem; font-weight: 600; padding: 2px 8px; border-radius: var(--r-full); white-space: nowrap; }
  .path-badge.good { background: rgba(34,197,94,0.12); color: #86efac; }
  .path-badge.warn { background: rgba(245,158,11,0.12); color: #fcd34d; }

  .speed-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .speed-box {
    flex: 1; display: flex; flex-direction: column; gap: 2px;
    background: var(--surface-1); border-radius: var(--r-sm); padding: 8px;
    text-align: center;
  }
  .speed-label { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
  .speed-val { font-size: 0.95rem; font-weight: 700; color: var(--accent-text); font-variant-numeric: tabular-nums; }

  .detail-grid {
    display: grid; grid-template-columns: auto 1fr; gap: 4px 10px;
    font-size: 0.72rem; color: var(--text-secondary);
  }
  .k { color: var(--text-muted); }
  .v { font-family: var(--font-mono); word-break: break-all; }

  .hint {
    margin-top: 10px; padding: 8px 10px;
    background: rgba(245,158,11,0.08);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: var(--r-sm);
    font-size: 0.72rem; color: #fcd34d; line-height: 1.5;
  }
</style>
