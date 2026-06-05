import { useEffect, useRef } from "react";
import type { SurfaceManifest } from "@agent-ready/schema";
import { useAgentReadyContext } from "../context.js";

export function useAgentSurface(manifest: SurfaceManifest) {
  const { runtime } = useAgentReadyContext();
  const manifestRef = useRef(manifest);
  manifestRef.current = manifest;

  useEffect(() => {
    const unregister = runtime.registerSurface({ manifest: manifestRef.current });
    return unregister;
  }, [runtime, manifest.handle]);

  return {
    handle: manifest.handle,
    updateManifest(patch: Partial<SurfaceManifest>) {
      Object.assign(manifestRef.current, patch);
    }
  };
}
