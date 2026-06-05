import { useEffect, useRef } from "react";
import type { AgentHandle, ObservationDefinition } from "@agent-ready/schema";
import { useAgentReadyContext } from "../context.js";

/**
 * Registers an observation selector on a surface for the lifetime of the component.
 *
 * The selector runs when an agent reads the observation; its return value is
 * validated against the observation schema at runtime.
 *
 * @example
 * ```tsx
 * function DealPanel({ deal }: { deal: Deal }) {
 *   useAgentSurface({
 *     handle: "crm://deals/panel/main",
 *     title: "Deal Panel",
 *     capabilities: ["read"],
 *   });
 *
 *   useAgentObservation(
 *     "crm://deals/panel/main",
 *     defineObservation({
 *       name: "dealState",
 *       description: "Current deal being edited",
 *       schema: z.object({ id: z.string(), stage: z.string() }),
 *     }),
 *     () => ({ id: deal.id, stage: deal.stage }),
 *     { debounceMs: 100 }
 *   );
 * }
 * ```
 */
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
