import type { AgentHandle, SurfaceManifest } from "@agent-ready/schema";
import type { RegisteredSurface } from "../types.js";

export class SurfaceRegistry {
  private surfaces = new Map<AgentHandle, RegisteredSurface>();

  register(entry: RegisteredSurface): () => void {
    const { handle } = entry.manifest;
    if (this.surfaces.has(handle)) {
      throw new Error(`Surface handle already registered: ${handle}`);
    }
    this.surfaces.set(handle, entry);
    return () => {
      this.surfaces.delete(handle);
    };
  }

  get(handle: AgentHandle): RegisteredSurface | undefined {
    return this.surfaces.get(handle);
  }

  has(handle: AgentHandle): boolean {
    return this.surfaces.has(handle);
  }

  list(): SurfaceManifest[] {
    return [...this.surfaces.values()].map((s) => s.manifest);
  }

  unregister(handle: AgentHandle): boolean {
    return this.surfaces.delete(handle);
  }
}
