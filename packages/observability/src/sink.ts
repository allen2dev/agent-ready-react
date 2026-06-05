import type { ObservabilityEvent, EventSink } from "./types.js";

export function createMemorySink(maxEntries = 100): EventSink & {
  getEntries(): ObservabilityEvent[];
  clear(): void;
} {
  const entries: ObservabilityEvent[] = [];

  const sink: EventSink & {
    getEntries(): ObservabilityEvent[];
    clear(): void;
  } = (event) => {
    entries.push(event);
    if (entries.length > maxEntries) {
      entries.shift();
    }
  };

  sink.getEntries = () => [...entries];
  sink.clear = () => {
    entries.length = 0;
  };

  return sink;
}
