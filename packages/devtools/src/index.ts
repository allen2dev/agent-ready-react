import type { AgentRuntime } from "@agent-ready/runtime";
import { getOrCreateStore } from "./useDevtoolsState.js";

export interface AgentReadyDevtoolsGlobal {
  getState: () => import("./store.js").DevToolsState;
  refreshCatalog: () => void;
}

declare global {
  interface Window {
    __AGENT_READY_DEVTOOLS__?: AgentReadyDevtoolsGlobal;
  }
}

/** @deprecated Use AgentDevPanel or createDevToolsStore directly */
export function connectDevtools(runtime: AgentRuntime): () => void {
  const store = getOrCreateStore(runtime);

  const api: AgentReadyDevtoolsGlobal = {
    getState: () => store.getState(),
    refreshCatalog: () => store.refreshCatalog()
  };

  if (typeof globalThis !== "undefined" && "window" in globalThis) {
    (globalThis as typeof globalThis & { window: Window }).window.__AGENT_READY_DEVTOOLS__ =
      api;
  }

  return () => {
    store.destroy();
  };
}

export { AgentDevPanel } from "./AgentDevPanel.js";
export type { AgentDevPanelProps, DevPanelPosition } from "./AgentDevPanel.js";
export { AgentInspector } from "./AgentInspector.js";
export type { AgentInspectorProps } from "./AgentInspector.js";
export { createDevToolsStore } from "./store.js";
export { connectDevtoolsStore, useDevToolsState } from "./useDevtoolsState.js";
export type { DevToolsState, ActionLogEntry, ObservationSnapshot } from "./store.js";
