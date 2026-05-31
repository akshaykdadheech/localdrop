<script lang="ts">
  import { connection } from '../../lib/stores/connection.js';
  import InstallButton from './InstallButton.svelte';

  let {
    onPairClick,
    onLeaveRoom,
    onNameChange,
  }: {
    onPairClick: () => void;
    onLeaveRoom: () => void;
    onNameChange: (name: string) => void;
  } = $props();

  let editing = $state(false);
  let draft = $state('');
  let inputEl: HTMLInputElement | undefined = $state();

  function getDeviceIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('iphone')) return '📱';
    if (n.includes('ipad')) return '📲';
    if (n.includes('android')) return '📱';
    if (n.includes('mac')) return '💻';
    if (n.includes('windows')) return '🖥️';
    if (n.includes('linux')) return '🐧';
    return '💻';
  }

  function startEdit() {
    draft = $connection.displayName ?? '';
    editing = true;
    // focus after DOM update
    setTimeout(() => inputEl?.select(), 0);
  }

  function commitEdit() {
    const name = draft.trim();
    if (name && name !== $connection.displayName) onNameChange(name);
    editing = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') editing = false;
  }
</script>

<header>
  <div class="inner">
    <!-- Brand -->
    <div class="brand">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="8" fill="#3b82f6"/>
        <path d="M14 6v10M14 6l-4 4M14 6l4 4" stroke="white" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="6" y="18" width="16" height="3" rx="1.5" fill="white" opacity="0.8"/>
      </svg>
      <span class="wordmark">LocalDrop</span>
    </div>

    <!-- My device name (editable) -->
    <div class="my-name">
      {#if editing}
        <input
          bind:this={inputEl}
          bind:value={draft}
          onblur={commitEdit}
          onkeydown={onKeydown}
          class="name-input"
          maxlength={32}
          aria-label="Edit your device name"
          placeholder="Your device name"
        />
      {:else}
        <button class="name-btn" onclick={startEdit} title="Click to edit your name"
                aria-label="Your name: {$connection.displayName}. Click to edit.">
          <span class="device-icon" aria-hidden="true">{getDeviceIcon($connection.displayName ?? '')}</span>
          <span class="name-text">{$connection.displayName ?? '…'}</span>
          <svg class="pencil" width="12" height="12" viewBox="0 0 12 12" fill="none"
               stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke-linejoin="round"/>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Actions -->
    <nav class="actions">
      <InstallButton />
      {#if $connection.roomCode}
        <div class="room-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="5" stroke="#22c55e" stroke-width="1.5"/>
            <circle cx="6" cy="6" r="2" fill="#22c55e"/>
          </svg>
          Room {$connection.roomCode}
        </div>
        <button class="btn btn-ghost btn-sm" onclick={onLeaveRoom}>Leave</button>
      {:else}
        <button class="btn btn-ghost btn-sm" onclick={onPairClick} aria-label="Pair with a device on the same WiFi" title="Pair with a device on the same WiFi that didn't auto-discover">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <rect x="1" y="1" width="12" height="12" rx="2"/>
            <line x1="7" y1="4" x2="7" y2="10"/>
            <line x1="4" y1="7" x2="10" y2="7"/>
          </svg>
          Pair
        </button>
      {/if}
    </nav>
  </div>
</header>


<style>
  header {
    height: var(--header-h);
    background: rgba(10, 15, 30, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  .inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 20px;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .wordmark {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  /* ── My name ───────────────────────────────── */
  .my-name {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  .name-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--r-full);
    padding: 5px 12px;
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: var(--font-sans);
    max-width: 220px;
  }

  .name-btn:hover {
    border-color: var(--accent);
    color: var(--text-primary);
  }

  .name-btn:hover .pencil { opacity: 1; }

  .device-icon { flex-shrink: 0; font-size: 0.85rem; line-height: 1; }
  .name-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .pencil {
    flex-shrink: 0;
    opacity: 0;
    transition: opacity var(--t-fast);
    color: var(--accent-text);
  }

  .name-input {
    width: 200px;
    padding: 5px 12px;
    font-size: 0.85rem;
    border-radius: var(--r-full);
    text-align: center;
    background: var(--surface-2);
    border: 1px solid var(--accent);
    box-shadow: 0 0 0 3px var(--accent-glow);
    color: var(--text-primary);
    outline: none;
    font-family: var(--font-sans);
  }

  /* ── Actions ───────────────────────────────── */
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .room-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    border-radius: var(--r-full);
    font-size: 0.8rem;
    font-weight: 600;
    color: #86efac;
    font-family: var(--font-mono);
    letter-spacing: 0.05em;
  }
</style>
