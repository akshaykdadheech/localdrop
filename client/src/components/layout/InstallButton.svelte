<script lang="ts">
  let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null);
  let installed = $state(false);

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  $effect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      installed = true;
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  });

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') installed = true;
    deferredPrompt = null;
  }
</script>

{#if deferredPrompt && !installed}
  <button class="install-btn" onclick={install} aria-label="Install LocalDrop app">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M7 1v8M7 9l-3-3M7 9l3-3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M2 11h10" stroke-linecap="round"/>
    </svg>
    Install
  </button>
{/if}

<style>
  .install-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: var(--r-full);
    background: var(--accent);
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: var(--font-sans);
    border: none;
    cursor: pointer;
    transition: all var(--t-fast);
    box-shadow: 0 0 12px var(--accent-glow);
  }
  .install-btn:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }
</style>
