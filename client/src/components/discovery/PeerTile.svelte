<script lang="ts">
  import type { PeerInfo } from '../../lib/signaling/protocol.js';
  import VerificationBadge from '../layout/VerificationBadge.svelte';

  let {
    peer,
    isSelf = false,
    isConnecting = false,
    verificationNumber,
    onClick,
  }: {
    peer: PeerInfo;
    isSelf?: boolean;
    isConnecting?: boolean;
    verificationNumber?: string;
    onClick?: () => void;
  } = $props();

  // Deterministic colors from avatarSeed
  function seedToColor(seed: string, idx: number): string {
    const COLORS = [
      '#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b',
      '#ef4444','#ec4899','#6366f1','#14b8a6','#f97316',
    ];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
    return COLORS[(h + idx) % COLORS.length];
  }

  function initials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  const bg1 = $derived(seedToColor(peer.avatarSeed, 0));
  const bg2 = $derived(seedToColor(peer.avatarSeed, 3));
</script>

<button
  class="tile"
  class:self={isSelf}
  class:connecting={isConnecting}
  onclick={!isSelf ? onClick : undefined}
  aria-label="{isSelf ? 'This device' : `Send to ${peer.displayName}`}"
  aria-disabled={isSelf || isConnecting}
  tabindex={isSelf ? -1 : 0}
>
  <div class="avatar" style:background="linear-gradient(135deg, {bg1}, {bg2})">
    {#if isConnecting}
      <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
        <path d="M12 3a9 9 0 0 1 9 9" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    {:else}
      <span class="initials" aria-hidden="true">{initials(peer.displayName)}</span>
    {/if}
  </div>

  <span class="name truncate">{peer.displayName}</span>

  {#if isSelf}
    <span class="badge self-badge">You</span>
  {:else if isConnecting}
    <span class="badge connecting-badge">Connecting…</span>
  {:else if verificationNumber}
    <VerificationBadge number={verificationNumber} peerName={peer.displayName} />
  {:else}
    <span class="hint">Tap to send</span>
  {/if}
</button>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 16px 18px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    cursor: pointer;
    transition: all var(--t-med);
    font-family: var(--font-sans);
    color: var(--text-primary);
    min-width: 0;
    position: relative;
  }

  .tile:not(.self):not(.connecting):hover {
    border-color: var(--border-accent);
    background: var(--surface-3);
    transform: translateY(-2px);
    box-shadow: var(--shadow-glow);
  }

  .tile:not(.self):not(.connecting):active {
    transform: translateY(0);
  }

  .tile.self {
    cursor: default;
    opacity: 0.6;
    border-style: dashed;
  }

  .tile.connecting {
    cursor: wait;
    border-color: var(--accent);
    animation: pulse-glow 2s infinite;
  }

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: var(--r-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.3rem;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    box-shadow: var(--shadow-sm);
  }

  .initials { user-select: none; }

  .spinner {
    animation: spin 1s linear infinite;
  }

  .name {
    font-size: 0.9rem;
    font-weight: 600;
    max-width: 100%;
    text-align: center;
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--r-full);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .self-badge {
    background: rgba(148, 163, 184, 0.1);
    color: var(--text-muted);
  }

  .connecting-badge {
    background: rgba(59, 130, 246, 0.15);
    color: var(--accent-text);
  }

  .hint {
    font-size: 0.72rem;
    color: var(--text-muted);
    opacity: 0;
    transition: opacity var(--t-fast);
  }

  .tile:not(.self):not(.connecting):hover .hint { opacity: 1; }
</style>
