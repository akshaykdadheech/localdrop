import EventEmitter from 'eventemitter3';

export interface TextPayload { type: 'text-payload'; id: string; content: string }

interface Events {
  received: (payload: TextPayload) => void;
}

export class TextTransfer extends EventEmitter<Events> {
  constructor(private readonly channel: RTCDataChannel) {
    super();
    channel.addEventListener('message', (ev) => {
      if (typeof ev.data !== 'string') return;
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'text-payload') this.emit('received', msg as TextPayload);
      } catch { /* ignore */ }
    });
  }

  send(content: string): void {
    const msg: TextPayload = { type: 'text-payload', id: crypto.randomUUID(), content };
    this.channel.send(JSON.stringify(msg));
  }
}
