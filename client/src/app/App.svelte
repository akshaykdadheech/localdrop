<script lang="ts">
  import { onMount } from 'svelte';
  import { checkGate } from '../lib/browser/gate.js';
  import { ConnectionManager, type IncomingTransfer, type IncomingText } from '../lib/ConnectionManager.js';
  import { peers } from '../lib/stores/peers.js';
  import { transfers } from '../lib/stores/transfers.js';

  import BlockedScreen from '../components/gate/BlockedScreen.svelte';
  import OutdatedScreen from '../components/gate/OutdatedScreen.svelte';
  import IosBanner from '../components/gate/IosBanner.svelte';
  import Header from '../components/layout/Header.svelte';
  import StatusBar from '../components/layout/StatusBar.svelte';
  import IsolationBanner from '../components/layout/IsolationBanner.svelte';
  import PublicWifiBanner from '../components/layout/PublicWifiBanner.svelte';
  import MdnsBanner from '../components/layout/MdnsBanner.svelte';
  import DiagnosticsPanel from '../components/layout/DiagnosticsPanel.svelte';
  import PeerGrid from '../components/discovery/PeerGrid.svelte';
  import SendRequest from '../components/transfer/SendRequest.svelte';
  import ReceivePrompt from '../components/transfer/ReceivePrompt.svelte';
  import TransferToast from '../components/transfer/TransferToast.svelte';
  import PairingModal from '../components/pairing/PairingModal.svelte';
  import IncomingTextToast from '../components/text/IncomingTextToast.svelte';

  const gate = checkGate();
  let gateOverride = $state(false);

  const shouldConnect = $derived(
    gate.result === 'ok' || gate.result === 'ios' || (gate.result === 'outdated' && gateOverride)
  );

  let manager: ConnectionManager | null = null;

  let selectedPeer = $state<string | null>(null);
  let connectingPeer = $state<string | null>(null);
  let showPairing = $state(false);
  let incomingTransfer = $state<IncomingTransfer | null>(null);
  let incomingText = $state<IncomingText | null>(null);
  let verificationNumbers = $state<Record<string, string>>({});
  let isolationPeer = $state<{ id: string; name: string } | null>(null);
  let roomError = $state<string | null>(null);

  const urlCode = new URLSearchParams(window.location.search).get('code');

  function buildWsUrl(): string {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${window.location.host}/ws`;
  }

  onMount(() => {
    if (!shouldConnect) return;

    manager = new ConnectionManager(buildWsUrl());

    manager.onIsolationDetected = (peerId) => {
      const name = $peers.find((p) => p.id === peerId)?.displayName ?? peerId;
      isolationPeer = { id: peerId, name };
    };

    manager.onRoomError = (msg) => {
      roomError = msg;
      setTimeout(() => (roomError = null), 5000);
    };

    manager.onIncomingTransfer = (t) => {
      incomingTransfer = {
        ...t,
        accept: () => { t.accept(); incomingTransfer = null; },
        decline: () => { t.decline(); incomingTransfer = null; },
      };
    };
    manager.onIncomingText = (t) => { incomingText = t; };
    manager.onVerificationNumber = (peerId, num) => {
      verificationNumbers = { ...verificationNumbers, [peerId]: num };
    };

    manager.connect();

    if (urlCode) {
      setTimeout(() => {
        manager?.joinRoomCode(urlCode);
        // Clean the URL so refreshing doesn't re-join
        window.history.replaceState({}, '', window.location.pathname);
      }, 1000);
    }

    return () => manager?.destroy();
  });

  function handleSelectPeer(peerId: string) {
    selectedPeer = peerId;
  }

  async function handleSend(files: File[]) {
    if (!selectedPeer || !manager) return;
    const pid = selectedPeer;
    selectedPeer = null;
    connectingPeer = pid;
    try {
      await manager.sendFiles(pid, files);
    } finally {
      connectingPeer = null;
    }
  }

  async function handleSendText(text: string) {
    if (!selectedPeer || !manager) return;
    const pid = selectedPeer;
    selectedPeer = null;
    await manager.sendText(pid, text);
  }

  function handlePairJoin(code: string) {
    manager?.joinRoomCode(code);
    showPairing = false;
  }

  function handlePairShare(code: string) {
    manager?.joinRoomCode(code);
  }

  const selectedPeerInfo = $derived($peers.find((p) => p.id === selectedPeer) ?? null);

  function handleRetry(transferId: string) {
    transfers.update((list) => list.filter((t) => t.id !== transferId));
  }
</script>

{#if gate.result === 'blocked'}
  <BlockedScreen capability={gate.capability} />
{:else if gate.result === 'outdated' && !gateOverride}
  <OutdatedScreen capability={gate.capability} onContinue={() => { gateOverride = true; }} />
{:else}
  <!-- iOS info banner (non-blocking) -->
  {#if gate.result === 'ios'}
    <IosBanner />
  {/if}

  <Header
    onPairClick={() => (showPairing = true)}
    onLeaveRoom={() => manager?.leaveRoom()}
    onNameChange={(name) => manager?.setName(name)}
  />
  <StatusBar />

  {#if roomError}
    <div class="room-error animate-fadeIn" role="alert">{roomError}</div>
  {/if}

  <PublicWifiBanner />
  <MdnsBanner />

  {#if isolationPeer}
    <IsolationBanner
      peerName={isolationPeer.name}
      onDismiss={() => (isolationPeer = null)}
    />
  {/if}

  <main>
    <PeerGrid
      connectingPeerId={connectingPeer}
      {verificationNumbers}
      onSelectPeer={handleSelectPeer}
    />
  </main>

  <!-- Transfer activity panel with retry -->
  <TransferToast onRetry={handleRetry} onCancel={(id) => manager?.cancelTransfer(id)} />

  <!-- Live connection diagnostics -->
  <DiagnosticsPanel />

  <!-- Send file modal -->
  {#if selectedPeer && selectedPeerInfo}
    <SendRequest
      peer={selectedPeerInfo}
      onSend={handleSend}
      onSendText={handleSendText}
      onClose={() => (selectedPeer = null)}
    />
  {/if}

  <!-- Receive prompt modal -->
  {#if incomingTransfer}
    <ReceivePrompt
      transfer={incomingTransfer}
    />
  {/if}

  <!-- Pairing modal -->
  {#if showPairing}
    <PairingModal
      onJoin={handlePairJoin}
      onShare={handlePairShare}
      onClose={() => (showPairing = false)}
    />
  {/if}

  <!-- Incoming text toast -->
  {#if incomingText}
    <IncomingTextToast
      message={incomingText}
      onDismiss={() => (incomingText = null)}
    />
  {/if}
{/if}

<style>
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
