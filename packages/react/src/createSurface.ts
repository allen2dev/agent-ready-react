import type {
  ActionDefinition,
  AgentHandle,
  ObservationDefinition,
  SurfaceManifest
} from "@agent-ready/schema";
import type { ActionHandlerContext } from "@agent-ready/runtime";
import { useAgentAction } from "./hooks/useAgentAction.js";
import { useAgentObservation } from "./hooks/useAgentObservation.js";
import { useAgentSurface } from "./hooks/useAgentSurface.js";

export interface AgentSurface<H extends AgentHandle = AgentHandle> {
  readonly handle: H;
  useSurface(): ReturnType<typeof useAgentSurface>;
  useAction<TIn, TOut>(
    action: ActionDefinition<TIn, TOut>,
    handler: (input: TIn, ctx: ActionHandlerContext) => Promise<TOut> | TOut
  ): void;
  useObservation<T>(
    definition: ObservationDefinition<T>,
    selector: () => T,
    options?: { debounceMs?: number }
  ): void;
}

/**
 * Creates a typed surface binding for a fixed agent handle.
 *
 * Returns hook helpers that register the surface and bind actions/observations
 * without repeating the handle on every call (ADR-007 handle is fixed at creation).
 *
 * @example
 * ```tsx
 * const surface = createSurface("crm://deals/panel/main", {
 *   title: "Deal Panel",
 *   capabilities: ["act", "read"],
 * });
 *
 * function DealPanel() {
 *   surface.useAction(submitAction, async (input) => {
 *     await saveDeal(input);
 *     return { saved: true };
 *   });
 *   surface.useObservation(dealObservation, () => dealState);
 *   return <div>...</div>;
 * }
 * ```
 */
export function createSurface<H extends AgentHandle>(
  handle: H,
  manifest: Omit<SurfaceManifest, "handle">
): AgentSurface<H> {
  const fullManifest = { handle, ...manifest } as SurfaceManifest;

  function useSurfaceRegistration(): ReturnType<typeof useAgentSurface> {
    return useAgentSurface(fullManifest);
  }

  return {
    handle,
    useSurface: useSurfaceRegistration,
    useAction(action, handler) {
      useSurfaceRegistration();
      useAgentAction(handle, action, handler);
    },
    useObservation(definition, selector, options) {
      useSurfaceRegistration();
      useAgentObservation(handle, definition, selector, options);
    }
  };
}
