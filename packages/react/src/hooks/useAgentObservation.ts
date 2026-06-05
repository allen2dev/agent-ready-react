import { useEffect, useRef } from "react";
import type { AgentHandle, ObservationDefinition } from "@agent-ready/schema";
import { useAgentReadyContext } from "../context.js";

export function useAgentObservation<T>(
  handle: AgentHandle,
  definition: ObservationDefinition<T>,
  selector: () => T,
  options?: { debounceMs?: number }
) {
  const { runtime } = useAgentReadyContext();
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const debounceMs = options?.debounceMs ?? 0;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wrapped = () => {
      if (debounceMs > 0) {
        clearTimeout(timer);
        timer = setTimeout(() => selectorRef.current(), debounceMs);
        return selectorRef.current();
      }
      return selectorRef.current();
    };

    return runtime.registerObservation(handle, {
      definition,
      selector: wrapped
    });
  }, [runtime, handle, definition.name, debounceMs]);
}
