import { validateAgentInput, agentError, type AgentResult } from "@agent-ready/schema";
import type { ReadObservationRequest } from "@agent-ready/schema";
import type { ObservationRegistry } from "../registry/observation.js";
import type { SurfaceRegistry } from "../registry/surface.js";
import type { TypedEventBus } from "../events.js";

export function computeEtag(value: unknown): string {
  const json = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    hash = (hash << 5) - hash + json.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function estimateByteSize(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return 0;
  }
}

export function readObservation(
  surfaces: SurfaceRegistry,
  observations: ObservationRegistry,
  request: ReadObservationRequest,
  events?: TypedEventBus
): AgentResult<unknown> {
  const start = performance.now();
  const { handle, name } = request;

  const finish = (result: AgentResult<unknown>): AgentResult<unknown> => {
    if (events && result.ok) {
      events.emit("observation:read", {
        handle,
        observationName: name,
        byteSize: estimateByteSize(result.data),
        durationMs: performance.now() - start
      });
    }
    return result;
  };

  if (!surfaces.has(handle)) {
    return {
      ok: false,
      error: agentError("AGENT_SURFACE_NOT_FOUND", `Surface not found: ${handle}`)
    };
  }

  const registered = observations.get(handle, name);
  if (!registered) {
    return {
      ok: false,
      error: agentError("AGENT_ACTION_NOT_FOUND", `Observation not found: ${name}`)
    };
  }

  const raw = registered.selector();
  const validation = validateAgentInput(registered.definition.schema, raw);
  if (!validation.success) {
    return { ok: false, error: validation.error };
  }

  const etag = computeEtag(validation.data);
  return finish({
    ok: true,
    data: validation.data,
    meta: { durationMs: performance.now() - start, etag }
  });
}

export function readSnapshot(
  surfaces: SurfaceRegistry,
  observations: ObservationRegistry,
  handle: import("@agent-ready/schema").AgentHandle,
  names?: string[],
  events?: TypedEventBus
): AgentResult<Record<string, unknown>> {
  if (!surfaces.has(handle)) {
    return {
      ok: false,
      error: agentError("AGENT_SURFACE_NOT_FOUND", `Surface not found: ${handle}`)
    };
  }

  const targetNames = names ?? observations.listForHandle(handle);
  const snapshot: Record<string, unknown> = {};

  for (const name of targetNames) {
    const result = readObservation(surfaces, observations, { handle, name }, events);
    if (!result.ok) return result;
    snapshot[name] = result.data;
  }

  const etag = computeEtag(snapshot);
  return { ok: true, data: snapshot, meta: { durationMs: 0, etag } };
}
