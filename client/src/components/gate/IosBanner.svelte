<script lang="ts">
  let dismissed = $state(false);
</script>

{#if !dismissed}
  <div class="banner animate-fadeIn" role="status">
    <div class="inner">
      <span class="icon">ℹ️</span>
      <p>
        On iPhone/iPad, sending files and receiving normal-size files works great.
        Receiving very large files (multi-GB) is limited by Apple's browser rules.
      </p>
      <button class="close" onclick={() => (dismissed = true)} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .banner {
    background: rgba(6, 182, 212, 0.1);
    border-bottom: 1px solid rgba(6, 182, 212, 0.3);
  }

  .inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 10px 16px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }

  p {
    flex: 1;
    font-size: 0.85rem;
    color: #67e8f9;
    line-height: 1.5;
  }

  .close {
    flex-shrink: 0;
    background: none;
    border: none;
    color: #67e8f9;
    cursor: pointer;
    padding: 2px;
    opacity: 0.7;
    transition: opacity var(--t-fast);
  }
  .close:hover { opacity: 1; }
</style>
