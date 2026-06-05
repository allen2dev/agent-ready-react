import type { AgentError, AgentHandle, SurfaceManifest } from "@agent-ready/schema";

export type ActionInvokeResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: AgentError };

export interface AgentRuntimeEventMap {
  "surface:registered": { handle: AgentHandle; manifest: SurfaceManifest };
  "surface:unregistered": { handle: AgentHandle; manifest: SurfaceManifest };
  "action:registered": { handle: AgentHandle; actionName: string };
  "action:unregistered": { handle: AgentHandle; actionName: string };
  "action:invoked": {
    handle: AgentHandle;
    actionName: string;
    input: unknown;
    result: ActionInvokeResult;
    durationMs: number;
    sessionId?: string;
  };
  "observation:read": {
    handle: AgentHandle;
    observationName: string;
    byteSize: number;
    durationMs: number;
  };
  "policy:denied": {
    handle: AgentHandle;
    actionName: string;
    reason: string;
    sessionId?: string;
  };
  "catalog:updated": { totalSurfaces: number };
}

export type AgentRuntimeEvent = keyof AgentRuntimeEventMap;

type Listener<E extends AgentRuntimeEvent> = (
  payload: AgentRuntimeEventMap[E]
) => void;

export class TypedEventBus {
  private listeners = new Map<string, Set<Listener<AgentRuntimeEvent>>>();

  on<E extends AgentRuntimeEvent>(
    event: E,
    listener: Listener<E>
  ): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener as Listener<AgentRuntimeEvent>);
    this.listeners.set(event, set);
    return () => set.delete(listener as Listener<AgentRuntimeEvent>);
  }

  emit<E extends AgentRuntimeEvent>(
    event: E,
    payload: AgentRuntimeEventMap[E]
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      listener(payload);
    }
  }
}
