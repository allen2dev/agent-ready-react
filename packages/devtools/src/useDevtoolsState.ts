import { useSyncExternalStore } from "react";
import type { AgentRuntime } from "@agent-ready/runtime";
import { createDevToolsStore, type DevToolsState, type DevToolsStore } from "./store.js";

const storeCache = new WeakMap<AgentRuntime, DevToolsStore>();

function getOrCreateStore(runtime: AgentRuntime): DevToolsStore {
  let store = storeCache.get(runtime);
  if (!store) {
    store = createDevToolsStore(runtime);
    storeCache.set(runtime, store);
  }
  return store;
}

export function useDevToolsState(runtime: AgentRuntime): DevToolsState {
  const store = getOrCreateStore(runtime);
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function connectDevtoolsStore(runtime: AgentRuntime): () => void {
  getOrCreateStore(runtime);
  return () => {
    const store = storeCache.get(runtime);
    store?.destroy();
    storeCache.delete(runtime);
  };
}

export { getOrCreateStore };
