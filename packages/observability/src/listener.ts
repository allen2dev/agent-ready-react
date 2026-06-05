import type { AgentRuntime, AgentRuntimeEvent } from "@agent-ready/runtime";
import type { EventSink, ObservabilityEvent, RedactionMiddleware } from "./types.js";

const ALL_EVENTS: AgentRuntimeEvent[] = [
  "surface:registered",
  "surface:unregistered",
  "action:registered",
  "action:invoked",
  "policy:denied"
];

export function attachRuntimeListener(
  runtime: AgentRuntime,
  sink: EventSink,
  options?: { middleware?: RedactionMiddleware[] }
): () => void {
  const middleware = options?.middleware ?? [];
  const unsubs = ALL_EVENTS.map((event) =>
    runtime.on(event, (payload) => {
      let record: ObservabilityEvent = {
        type: event,
        payload,
        timestamp: Date.now()
      };
      for (const mw of middleware) {
        record = mw(record);
      }
      sink(record);
    })
  );
  return () => unsubs.forEach((off) => off());
}
