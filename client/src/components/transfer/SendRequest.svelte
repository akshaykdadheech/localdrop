<script lang="ts">
  import type { PeerInfo } from '../../lib/signaling/protocol.js';

  let {
    peer,
    onSend,
    onSendText,
    onClose,
  }: {
    peer: PeerInfo;
    onSend: (files: File[]) => void;
    onSendText: (text: string) => void;
    onClose: () => void;
  } = $props();

  let files = $state<File[]>([]);
  let dragging = $state(false);
  let fileInput = $state<HTMLInputElement>(null!);
  let textMode = $state(false);
  let textContent = $state('');

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const items = e.dataTransfer?.files;
    if (items) files = [...files, ...Array.from(items)];
  }

  function handleDragOver(e: DragEvent) { e.preventDefault(); dragging = true; }
  function handleDragLeave() { dragging = false; }

  function removeFile(idx: number) { files = files.filter((_, i) => i !== idx); }

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files) files = [...files, ...Array.from(input.files)];
    input.value = '';
  }

  function submit() {
    if (files.length > 0) onSend(files);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
<div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Send files to {peer.displayName}"
     tabindex="-1"
     onclick={(e) => e.target === e.currentTarget && onClose()}
     onkeydown={(e) => e.key === 'Escape' && onClose()}>
  <div class="modal-box">
    <div class="peer-header">
      <div class="peer-info">
        <strong>Send to</strong>
        <span class="peer-name">{peer.displayName}</span>
      </div>
      <button class="btn btn-ghost btn-sm" onclick={onClose} aria-label="Cancel">✕</button>
    </div>

    <div class="tabs">
      <button class="tab" class:active={!textMode} onclick={() => (textMode = false)}>Files</button>
      <button class="tab" class:active={textMode} onclick={() => (textMode = true)}>Text</button>
    </div>

    {#if !textMode}
      <!-- Drop zone -->
      <div
        class="dropzone"
        class:dragging
        ondrop={handleDrop}
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        role="region"
        aria-label="Drop files here or click to browse"
      >
        <div class="dz-icon">📂</div>
        <p class="dz-label">Drop files here</p>
        <button class="btn btn-ghost btn-sm" onclick={() => fileInput.click()}>Browse files</button>
        <input
          bind:this={fileInput}
          type="file"
          multiple
          class="sr-only"
          onchange={onFileInput}
          aria-label="Select files"
        />
      </div>

      {#if files.length > 0}
        <ul class="file-list" aria-label="Selected files">
          {#each files as f, i}
            <li class="file-item">
              <span class="file-name truncate">{f.name}</span>
              <span class="file-size">{formatSize(f.size)}</span>
              <button class="remove" onclick={() => removeFile(i)} aria-label="Remove {f.name}">✕</button>
            </li>
          {/each}
        </ul>
      {/if}

      <div class="modal-actions">
        <button class="btn btn-ghost" onclick={onClose}>Cancel</button>
        <button class="btn btn-primary" disabled={files.length === 0} onclick={submit}>
          Send {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : ''}
        </button>
      </div>
    {:else}
      <textarea
        placeholder="Type a message to send…"
        bind:value={textContent}
        rows={5}
        style="resize: vertical; margin-bottom: 16px;"
      ></textarea>
      <div class="modal-actions">
        <button class="btn btn-ghost" onclick={onClose}>Cancel</button>
        <button class="btn btn-primary" disabled={textContent.trim() === ''}
          onclick={() => { onSendText(textContent.trim()); onClose(); }}>
          Send Text
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .peer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .peer-info { display: flex; flex-direction: column; gap: 2px; }
  .peer-info strong { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .peer-name { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }

  .tabs {
    display: flex;
    gap: 4px;
    background: var(--surface-2);
    padding: 3px;
    border-radius: var(--r-md);
    margin-bottom: 16px;
  }

  .tab {
    flex: 1;
    padding: 7px;
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

  .dropzone {
    border: 2px dashed var(--border);
    border-radius: var(--r-md);
    padding: 28px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: all var(--t-fast);
    cursor: default;
    margin-bottom: 16px;
  }

  .dropzone.dragging {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.05);
  }

  .dz-icon { font-size: 2rem; }

  .dz-label { font-size: 0.9rem; color: var(--text-secondary); }

  .file-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
    max-height: 160px;
    overflow-y: auto;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: var(--surface-2);
    border-radius: var(--r-sm);
    font-size: 0.85rem;
  }

  .file-name { flex: 1; min-width: 0; }
  .file-size { color: var(--text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }

  .remove {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.75rem;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color var(--t-fast);
  }
  .remove:hover { color: var(--danger); }
</style>
