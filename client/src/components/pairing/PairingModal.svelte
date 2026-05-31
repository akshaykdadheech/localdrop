<script lang="ts">
  import { generateCode, isValidCode } from '../../lib/pairing/roomCode.js';
  import { generateQrDataUrl } from '../../lib/pairing/qr.js';
  import { connection } from '../../lib/stores/connection.js';

  let {
    onJoin,
    onShare,
    onClose,
  }: { onJoin: (code: string) => void; onShare: (code: string) => void; onClose: () => void } = $props();

  let tab = $state<'join' | 'share'>('join');
  let code = $state('');
  let error = $state('');
  let myCode = $state(generateCode());
  let qrUrl = $state('');

  $effect(() => {
    if (tab === 'share') {
      const url = `${window.location.origin}?code=${myCode}`;
      generateQrDataUrl(url).then((u) => (qrUrl = u));
      // Mac also joins its own code room so phone can find it
      onShare(myCode);
    }
  });

  function handleJoin() {
    if (!isValidCode(code)) { error = 'Enter a 6-digit code'; return; }
    error = '';
    onJoin(code);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleJoin();
  }

  function formatCode(raw: string): string {
    return raw.replace(/\D/g, '').slice(0, 6);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Pair devices"
     tabindex="-1"
     onclick={(e) => e.target === e.currentTarget && onClose()}
     onkeydown={(e) => e.key === 'Escape' && onClose()}>
  <div class="modal-box">
    <div class="modal-title-row">
      <h2 class="modal-title">Pair devices</h2>
      <button class="btn btn-ghost btn-sm" onclick={onClose} aria-label="Close">✕</button>
    </div>

    <p class="modal-body">
      Connect two devices on the <strong>same WiFi</strong> that can't auto-discover each other
      (e.g., different subnets or guest networks). Both devices must be on the same local network for transfer to work.
    </p>

    <div class="tabs">
      <button class="tab" class:active={tab === 'join'} onclick={() => (tab = 'join')}>Enter code</button>
      <button class="tab" class:active={tab === 'share'} onclick={() => (tab = 'share')}>Show my code</button>
    </div>

    {#if tab === 'join'}
      <div class="join-form">
        <input
          type="text"
          inputmode="numeric"
          pattern="\d{6}"
          placeholder="000000"
          value={code}
          oninput={(e) => { code = formatCode((e.target as HTMLInputElement).value); error = ''; }}
          onkeydown={handleKeydown}
          aria-label="6-digit room code"
          class="code-input"
          maxlength={6}
          autocomplete="one-time-code"
        />
        {#if error}<p class="error-msg">{error}</p>{/if}
        <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick={handleJoin}
                disabled={code.length !== 6}>
          Join room
        </button>
      </div>
    {:else}
      <div class="share-section">
        <div class="code-display" aria-label="Your room code: {myCode}">
          {#each myCode.split('') as digit}
            <span>{digit}</span>
          {/each}
        </div>

        {#if qrUrl}
          <img class="qr" src={qrUrl} alt="QR code for room {myCode}" width="200" height="200" />
        {/if}

        <p class="share-hint">
          Enter this code on another device on the <strong>same WiFi</strong>, or scan the QR code to join the same room.
        </p>
        <p class="share-hint" style="color: var(--warning); margin-top: 6px; font-size: 0.75rem;">
          ⚠️ Cross-network transfer (different WiFi / mobile data) is not supported yet.
        </p>

        <button class="btn btn-ghost btn-sm" style="margin-top:4px" onclick={() => { myCode = generateCode(); qrUrl = ''; onShare(myCode); }}>
          Generate new code
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .tabs {
    display: flex;
    gap: 4px;
    background: var(--surface-2);
    padding: 3px;
    border-radius: var(--r-md);
    margin-bottom: 20px;
  }

  .tab {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: calc(var(--r-md) - 3px);
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--t-fast);
    font-family: var(--font-sans);
  }

  .tab.active { background: var(--surface-3); color: var(--text-primary); }

  .code-input {
    font-family: var(--font-mono);
    font-size: 2rem;
    text-align: center;
    letter-spacing: 0.4em;
    padding: 12px;
  }

  .error-msg { color: var(--danger); font-size: 0.82rem; margin-top: 6px; }

  .share-section { display: flex; flex-direction: column; align-items: center; gap: 16px; }

  .code-display {
    font-family: var(--font-mono);
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    color: var(--accent-text);
    background: var(--surface-2);
    padding: 16px 24px;
    border-radius: var(--r-md);
    border: 1px solid var(--border-accent);
    width: 100%;
    text-align: center;
  }

  .qr {
    border-radius: var(--r-md);
    image-rendering: pixelated;
  }

  .share-hint {
    text-align: center;
    font-size: 0.82rem;
    color: var(--text-muted);
    line-height: 1.5;
  }
</style>
