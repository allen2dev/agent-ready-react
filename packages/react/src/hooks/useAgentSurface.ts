import { useEffect, useRef } from "react";
import type { SurfaceManifest } from "@agent-ready/schema";
import { useAgentReadyContext } from "../context.js";
import { registerSurfaceWithRefCount } from "../surface-registration.js";

/**
 * Registers a surface manifest with the agent runtime for the component lifetime.
 *
 * Multiple calls with the same handle share one runtime registration (ref-counted),
 * which supports {@link createSurface} helpers that register from several hooks.
 *
 * @example
 * ```tsx
 * function DealPanel() {
 *   const { updateManifest } = useAgentSurface({
 *     handle: "crm://deals/panel/main",
 *     title: "Deal Panel",
 *     capabilities: ["act", "read"],
 *   });
 *
 *   useEffect(() => {
 *     updateManifest({ description: "Editing deal #42" });
 *   }, [dealId]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useAgentSurface(manifest: SurfaceManifest) {
  const { runtime } = useAgentReadyContext();
  const manifestRef = useRef(manifest);
  manifestRef.current = manifest;

  useEffect(() => {
    return registerSurfaceWithRefCount(runtime, manifest.handle, () =>
      runtime.registerSurface({ manifest: manifestRef.current })
    );
  }, [runtime, manifest.handle]);

  return {
    handle: manifest.handle,
    updateManifest(patch: Partial<SurfaceManifest>) {
      Object.assign(manifestRef.current, patch);
    }
  };
}
