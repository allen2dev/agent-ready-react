import type { AgentHandle } from "@agent-ready/schema";
import type { AgentRuntime } from "@agent-ready/runtime";

interface SurfaceRegistrationEntry {
  unregister: () => void;
  refCount: number;
}

const surfaceRefs = new WeakMap<
  AgentRuntime,
  Map<AgentHandle, SurfaceRegistrationEntry>
>();

export function registerSurfaceWithRefCount(
  runtime: AgentRuntime,
  handle: AgentHandle,
  register: () => () => void
): () => void {
  let refs = surfaceRefs.get(runtime);
  if (!refs) {
    refs = new Map();
    surfaceRefs.set(runtime, refs);
  }

  const existing = refs.get(handle);
  if (existing) {
    existing.refCount += 1;
    return () => {
      existing.refCount -= 1;
      if (existing.refCount === 0) {
        existing.unregister();
        refs!.delete(handle);
      }
    };
  }

  const unregister = register();
  refs.set(handle, { unregister, refCount: 1 });
  return () => {
    const entry = refs!.get(handle);
    if (!entry) return;
    entry.refCount -= 1;
    if (entry.refCount === 0) {
      entry.unregister();
      refs!.delete(handle);
    }
  };
}
