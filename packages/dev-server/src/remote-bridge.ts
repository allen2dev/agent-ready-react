import type { BridgeResponseMessage } from "./protocol.js";
import { serializeBridgeMessage } from "./protocol.js";

export interface RemoteBridgeClientOptions {
  wsUrl: string;
  role?: "mcp";
  timeoutMs?: number;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class RemoteBridgeClient {
  private ws: import("ws").WebSocket | undefined;
  private pending = new Map<string, PendingRequest>();
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private nextId = 1;

  constructor(private readonly options: RemoteBridgeClientOptions) {
    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });
  }

  async connect(): Promise<void> {
    const { WebSocket } = await import("ws");
    const ws = new WebSocket(this.options.wsUrl);
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => {
        ws.send(
          serializeBridgeMessage({
            type: "register",
            role: this.options.role ?? "mcp"
          })
        );
        resolve();
      });
      ws.once("error", reject);
    });

    ws.on("message", (data) => {
      const raw = typeof data === "string" ? data : data.toString("utf8");
      this.handleMessage(raw);
    });

    ws.on("close", () => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("WebSocket closed"));
      }
      this.pending.clear();
    });

    await this.readyPromise;
  }

  close(): void {
    this.ws?.close();
  }

  async request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error("WebSocket is not connected");
    }

    const id = String(this.nextId++);
    const result = new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Bridge request timed out: ${method}`));
      }, this.options.timeoutMs ?? 30_000);

      this.pending.set(id, { resolve, reject, timer });
    });

    this.ws.send(
      serializeBridgeMessage({
        type: "request",
        id,
        method,
        params
      })
    );

    return result;
  }

  private handleMessage(raw: string): void {
    let message: BridgeResponseMessage | { type: "ready"; role: string };
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.type === "ready") {
      this.readyResolve();
      return;
    }

    if (message.type !== "response") return;

    const pending = this.pending.get(message.id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(message.id);

    if (message.error) {
      pending.reject(new Error(message.error.message));
      return;
    }

    pending.resolve(message.result);
  }
}
