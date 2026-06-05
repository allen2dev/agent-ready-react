import type { AgentRuntime } from "@agent-ready/runtime";
import { attachRuntimeListener, createMemorySink } from "@agent-ready/observability";
import { createDevToolsStore, type DevToolsState } from "./store.js";

export interface AgentReadyDevtoolsGlobal {
  getState: () => import("./store.js").DevToolsState;
  refreshCatalog: () => void;
}

declare global {
  interface Window {
    __AGENT_READY_DEVTOOLS__?: AgentReadyDevtoolsGlobal;
  }
}

export function connectDevtools(runtime: AgentRuntime): () => void {
  const store = createDevToolsStore(100);
  const sink = createMemorySink(100);

  const refreshCatalog = () => store.setCatalog(runtime.getCatalog());
  refreshCatalog();

  const detachSink = attachRuntimeListener(runtime, (event) => {
    sink(event);
    store.pushEvent(event);
    if (event.type === "surface:registered" || event.type === "surface:unregistered") {
      refreshCatalog();
    }
  });

  const detachEvents = [
    runtime.on("action:registered", refreshCatalog),
    runtime.on("surface:registered", refreshCatalog),
    runtime.on("surface:unregistered", refreshCatalog)
  ];

  const api: AgentReadyDevtoolsGlobal = {
    getState: () => store.getState(),
    refreshCatalog
  };

  if (typeof globalThis !== "undefined" && "window" in globalThis) {
    (globalThis as typeof globalThis & { window: Window }).window.__AGENT_READY_DEVTOOLS__ =
      api;
  }

  return () => {
    detachSink();
    detachEvents.forEach((off) => off());
  };
}

export { createDevToolsStore };
export type { DevToolsState };
