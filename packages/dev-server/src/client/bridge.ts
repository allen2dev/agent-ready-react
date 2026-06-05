import type { AgentRuntime } from "@agent-ready/runtime";
import { handleBridgeMethod } from "@agent-ready/bridge";
import type { BridgeRequestMessage, BridgeResponseMessage } from "../protocol.js";
import { parseBridgeMessage, serializeBridgeMessage } from "../protocol.js";

export interface AgentDevBridgeOptions {
  wsPath?: string;
  runtime?: AgentRuntime;
  getRuntime?: () => AgentRuntime | undefined;
}

function resolveWsUrl(wsPath: string): string {
  if (typeof window === "undefined") {
    throw new Error("AgentDevBridge requires a browser environment");
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${wsPath}`;
}

export function connectAgentDevBridge(
  runtimeOrOptions: AgentRuntime | AgentDevBridgeOptions,
  legacyOptions?: Pick<AgentDevBridgeOptions, "wsPath">
): () => void {
  const options: AgentDevBridgeOptions =
    "registerSurface" in runtimeOrOptions
      ? { runtime: runtimeOrOptions, wsPath: legacyOptions?.wsPath }
      : runtimeOrOptions;

  const wsPath = options.wsPath ?? "/__agent_ready_ws__";
  const getRuntime =
    options.getRuntime ??
    (() => options.runtime);

  let socket: WebSocket | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;

  const connect = () => {
    if (closed) return;

    socket = new WebSocket(resolveWsUrl(wsPath));

    socket.addEventListener("open", () => {
      socket?.send(serializeBridgeMessage({ type: "register", role: "browser" }));
    });

    socket.addEventListener("message", async (event) => {
      const message = parseBridgeMessage(String(event.data));
      if (!message || message.type !== "request") return;

      const runtime = getRuntime();
      const response: BridgeResponseMessage = {
        type: "response",
        id: message.id
      };

      if (!runtime) {
        response.error = { message: "Agent runtime is not available yet" };
        socket?.send(serializeBridgeMessage(response));
        return;
      }

      try {
        response.result = await handleBridgeMethod(runtime, message.method, message.params);
      } catch (err) {
        response.error = {
          message: err instanceof Error ? err.message : "Bridge handler failed"
        };
      }

      socket?.send(serializeBridgeMessage(response));
    });

    socket.addEventListener("close", () => {
      if (!closed) {
        reconnectTimer = setTimeout(connect, 1500);
      }
    });
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  };
}

/** Auto-connect when runtime is published on window by the dev-server vite plugin. */
export function initAgentDevBridgeAuto(): void {
  if (typeof window === "undefined") return;

  const wsPath =
    (import.meta as ImportMeta & { env?: { VITE_AGENT_READY_WS_PATH?: string } }).env
      ?.VITE_AGENT_READY_WS_PATH ?? "/__agent_ready_ws__";
  const globalWindow = window as Window & {
    __AGENT_READY_RUNTIME__?: AgentRuntime;
    __AGENT_READY_BRIDGE__?: () => void;
  };

  const tryConnect = () => {
    const runtime = globalWindow.__AGENT_READY_RUNTIME__;
    if (!runtime) return false;
    globalWindow.__AGENT_READY_BRIDGE__?.();
    globalWindow.__AGENT_READY_BRIDGE__ = connectAgentDevBridge(runtime, { wsPath });
    return true;
  };

  const interval = setInterval(() => {
    if (tryConnect()) clearInterval(interval);
  }, 250);

  tryConnect();
}

export { connectAgentDevBridge as AgentDevBridge };
