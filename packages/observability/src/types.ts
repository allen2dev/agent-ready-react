import type { AgentRuntimeEvent, AgentRuntimeEventMap } from "@agent-ready/runtime";

export interface ObservabilityEvent<E extends AgentRuntimeEvent = AgentRuntimeEvent> {
  type: E;
  payload: AgentRuntimeEventMap[E];
  timestamp: number;
}

export type EventSink = (event: ObservabilityEvent) => void;

export type RedactionMiddleware = (
  event: ObservabilityEvent
) => ObservabilityEvent;
