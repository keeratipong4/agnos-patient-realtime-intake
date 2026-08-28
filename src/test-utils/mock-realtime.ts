export type OutgoingBroadcastMessage = {
  type: "broadcast";
  event: string;
  payload: unknown;
};

export class MockRealtimeChannel {
  public topic: string;
  public config?: Record<string, unknown>;
  public status: string = "CLOSED";
  public subscribeCallback: ((status: string) => void) | null = null;
  public broadcastHandlers = new Map<
    string,
    Array<(envelope: { payload: unknown }) => void>
  >();
  public presenceHandlers = new Map<
    string,
    Array<(event: Record<string, unknown>) => void>
  >();
  public sentMessages: OutgoingBroadcastMessage[] = [];
  public currentPresenceState: Record<string, unknown[]> = {};
  public trackedPresence: Record<string, unknown> | null = null;
  public isUntracked = false;

  constructor(topic: string, config?: Record<string, unknown>) {
    this.topic = topic;
    this.config = config;
  }

  on(
    type: string,
    filter: { event: string },
    callback: (data: unknown) => void,
  ) {
    if (type === "broadcast") {
      const list = this.broadcastHandlers.get(filter.event) ?? [];
      list.push(callback as (envelope: { payload: unknown }) => void);
      this.broadcastHandlers.set(filter.event, list);
    } else if (type === "presence") {
      const list = this.presenceHandlers.get(filter.event) ?? [];
      list.push(callback as (event: Record<string, unknown>) => void);
      this.presenceHandlers.set(filter.event, list);
    }
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    if (callback) {
      this.subscribeCallback = callback;
    }
    return this;
  }

  async track(
    payload: Record<string, unknown>,
  ): Promise<"ok" | "timed out" | "error"> {
    this.trackedPresence = payload;
    this.isUntracked = false;
    return "ok";
  }

  async untrack(): Promise<"ok" | "timed out" | "error"> {
    this.isUntracked = true;
    return "ok";
  }

  presenceState<T = unknown>(): Record<string, T[]> {
    return this.currentPresenceState as Record<string, T[]>;
  }

  async send(
    message: OutgoingBroadcastMessage,
  ): Promise<"ok" | "timed out" | "error"> {
    this.sentMessages.push(message);
    return "ok";
  }

  triggerSubscribe(
    status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR",
  ) {
    this.status = status;
    if (this.subscribeCallback) {
      this.subscribeCallback(status);
    }
  }

  triggerBroadcast(event: string, payload: unknown) {
    const handlers = this.broadcastHandlers.get(event) ?? [];
    for (const handler of handlers) {
      handler({ payload });
    }
  }

  triggerPresence(
    event: "sync" | "join" | "leave",
    state?: Record<string, unknown[]>,
  ) {
    if (state !== undefined) {
      this.currentPresenceState = state;
    }
    const handlers = this.presenceHandlers.get(event) ?? [];
    for (const handler of handlers) {
      handler({});
    }
  }
}

export class MockSupabaseClient {
  public channels = new Map<string, MockRealtimeChannel>();
  public removedChannels: MockRealtimeChannel[] = [];

  channel(name: string, config?: Record<string, unknown>): MockRealtimeChannel {
    let chan = this.channels.get(name);
    if (!chan) {
      chan = new MockRealtimeChannel(name, config);
      this.channels.set(name, chan);
    }
    return chan;
  }

  async removeChannel(channel: MockRealtimeChannel) {
    this.removedChannels.push(channel);
    this.channels.delete(channel.topic);
    return "ok";
  }
}
