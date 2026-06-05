import type { AgentError, AgentHandle } from "@agent-ready/schema";

export interface AgentRuntimeEventMap {
  "surface:registered": { handle: AgentHandle };
  "surface:unregistered": { handle: AgentHandle };
  "action:registered": { handle: AgentHandle; action: string };
  "action:invoked": {
    handle: AgentHandle;
    action: string;
    ok: boolean;
    error?: AgentError;
  };
  "policy:denied": { handle: AgentHandle; action: string };
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
