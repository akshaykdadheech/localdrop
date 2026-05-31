<script lang="ts">
  let { number, peerName }: { number: string; peerName: string } = $props();
</script>

<div class="badge" title="Compare this number with {peerName} to verify the connection is secure">
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M6 1L1 3.5v3C1 8.9 3.2 10.9 6 11c2.8-.1 5-2.1 5-4.5v-3L6 1z" stroke="#22c55e" stroke-width="1.2" fill="rgba(34,197,94,0.15)"/>
    <path d="M4 6l1.5 1.5L8 4" stroke="#22c55e" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
  <span class="num">{number}</span>
</div>

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.25);
    border-radius: var(--r-full);
    font-size: 0.75rem;
    cursor: default;
  }

  .num {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    color: #86efac;
    letter-spacing: 0.08em;
  }
</style>
