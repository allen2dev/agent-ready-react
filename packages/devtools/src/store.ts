import type { AgentCatalog, AgentRuntime } from "@agent-ready/runtime";
import type { AgentHandle } from "@agent-ready/schema";
import type { AgentRuntimeEventMap } from "@agent-ready/runtime";

export interface ActionLogEntry {
  timestamp: number;
  handle: AgentHandle;
  actionName: string;
  inputSummary: string;
  ok: boolean;
  errorMessage?: string;
  durationMs: number;
  sessionId?: string;
}

export interface ObservationSnapshot {
  handle: AgentHandle;
  observationName: string;
  value: unknown;
  byteSize: number;
  readAt: number;
}

export interface DevToolsState {
  catalog: AgentCatalog;
  actionLog: ActionLogEntry[];
  policyLog: AgentRuntimeEventMap["policy:denied"][];
  observationSnapshots: ObservationSnapshot[];
}

function summarizeInput(input: unknown): string {
  try {
    const json = JSON.stringify(input);
    return json.length > 80 ? `${json.slice(0, 77)}...` : json;
  } catch {
    return String(input);
  }
}

function observationKey(handle: AgentHandle, name: string): string {
  return `${handle}::${name}`;
}

function emptyState(): DevToolsState {
  return {
    catalog: { surfaces: [], total: 0 },
    actionLog: [],
    policyLog: [],
    observationSnapshots: []
  };
}

export function createDevToolsStore(runtime: AgentRuntime, maxLog = 100) {
  let catalog = runtime.getCatalog();
  const actionLog: ActionLogEntry[] = [];
  const policyLog: AgentRuntimeEventMap["policy:denied"][] = [];
  const observationSnapshots = new Map<string, ObservationSnapshot>();
  const listeners = new Set<() => void>();
  let snapshot = emptyState();

  const rebuildSnapshot = () => {
    snapshot = {
      catalog,
      actionLog: [...actionLog],
      policyLog: [...policyLog],
      observationSnapshots: [...observationSnapshots.values()]
    };
  };

  const notify = () => {
    rebuildSnapshot();
    listeners.forEach((listener) => listener());
  };

  const refreshObservationSnapshots = () => {
    for (const surface of catalog.surfaces) {
      for (const name of surface.observations) {
        const result = runtime.readObservation({ handle: surface.handle, name });
        if (result.ok) {
          observationSnapshots.set(observationKey(surface.handle, name), {
            handle: surface.handle,
            observationName: name,
            value: result.data,
            byteSize: new TextEncoder().encode(JSON.stringify(result.data)).byteLength,
            readAt: Date.now()
          });
        }
      }
    }
  };

  const refreshCatalog = () => {
    catalog = runtime.getCatalog();
    refreshObservationSnapshots();
    notify();
  };

  const pushActionLog = (entry: ActionLogEntry) => {
    actionLog.push(entry);
    if (actionLog.length > maxLog) actionLog.shift();
    notify();
  };

  const pushPolicyLog = (entry: AgentRuntimeEventMap["policy:denied"]) => {
    policyLog.push(entry);
    if (policyLog.length > maxLog) policyLog.shift();
    notify();
  };

  const unsubs = [
    runtime.on("surface:registered", refreshCatalog),
    runtime.on("surface:unregistered", refreshCatalog),
    runtime.on("action:registered", refreshCatalog),
    runtime.on("action:unregistered", refreshCatalog),
    runtime.on("catalog:updated", refreshCatalog),
    runtime.on("action:invoked", (payload) => {
      pushActionLog({
        timestamp: Date.now(),
        handle: payload.handle,
        actionName: payload.actionName,
        inputSummary: summarizeInput(payload.input),
        ok: payload.result.ok,
        errorMessage: payload.result.ok ? undefined : payload.result.error.message,
        durationMs: payload.durationMs,
        sessionId: payload.sessionId
      });
    }),
    runtime.on("policy:denied", (payload) => {
      pushPolicyLog(payload);
    }),
    runtime.on("observation:read", (payload) => {
      const result = runtime.readObservation({
        handle: payload.handle,
        name: payload.observationName
      });
      if (result.ok) {
        observationSnapshots.set(
          observationKey(payload.handle, payload.observationName),
          {
            handle: payload.handle,
            observationName: payload.observationName,
            value: result.data,
            byteSize: payload.byteSize,
            readAt: Date.now()
          }
        );
        notify();
      }
    })
  ];

  rebuildSnapshot();
  refreshCatalog();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState(): DevToolsState {
      return snapshot;
    },
    refreshCatalog,
    destroy() {
      unsubs.forEach((off) => off());
      listeners.clear();
    }
  };
}

export type DevToolsStore = ReturnType<typeof createDevToolsStore>;
