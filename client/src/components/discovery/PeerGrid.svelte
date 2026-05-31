<script lang="ts">
  import { peers } from '../../lib/stores/peers.js';
  import { connection } from '../../lib/stores/connection.js';
  import PeerTile from './PeerTile.svelte';

  let {
    connectingPeerId = null,
    verificationNumbers = {},
    onSelectPeer,
  }: {
    connectingPeerId?: string | null;
    verificationNumbers?: Record<string, string>;
    onSelectPeer: (peerId: string) => void;
  } = $props();
</script>

<section class="grid-section">
  {#if $peers.length === 0 && $connection.status === 'connected'}
    <div class="empty">
      <div class="pulse-ring" aria-hidden="true"></div>
      <div class="empty-icon">📡</div>
      <h2>Waiting for devices…</h2>
      <p>Open LocalDrop on another device on the same WiFi to see it here.</p>
      <p class="tip">Or use <strong>Pair</strong> if devices are on the same WiFi but aren't showing up.</p>
    </div>
  {:else if $connection.status !== 'connected'}
    <div class="empty">
      <div class="empty-icon spinning">⟳</div>
      <h2>Connecting…</h2>
      <p>Reaching the signaling server.</p>
    </div>
  {:else}
    <div class="grid" role="list">
      <!-- Self tile -->
      {#if $connection.peerId}
        <div role="listitem">
          <PeerTile
            peer={{
              id: $connection.peerId,
              displayName: $connection.displayName ?? 'This device',
              avatarSeed: $connection.avatarSeed ?? $connection.peerId,
            }}
            isSelf={true}
          />
        </div>
      {/if}

      {#each $peers as peer (peer.id)}
        <div role="listitem" class="animate-fadeIn">
          <PeerTile
            {peer}
            isConnecting={connectingPeerId === peer.id}
            verificationNumber={verificationNumbers[peer.id]}
            onClick={() => onSelectPeer(peer.id)}
          />
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .grid-section {
    flex: 1;
    padding: 32px 20px;
    max-width: 960px;
    margin: 0 auto;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    text-align: center;
    gap: 10px;
    position: relative;
  }

  .pulse-ring {
    position: absolute;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 2px solid var(--accent);
    opacity: 0.2;
    animation: pulse-glow 3s ease-in-out infinite;
    pointer-events: none;
  }

  .empty-icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
    position: relative;
  }

  .spinning { animation: spin 2s linear infinite; }

  .empty h2 {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .empty p {
    font-size: 0.9rem;
    max-width: 300px;
    line-height: 1.6;
  }

  .tip { color: var(--text-muted); font-size: 0.82rem; }
  .tip strong { color: var(--accent-text); }
</style>
