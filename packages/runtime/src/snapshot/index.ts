import { validateAgentInput, agentError, type AgentResult } from "@agent-ready/schema";
import type { ReadObservationRequest } from "@agent-ready/schema";
import type { ObservationRegistry } from "../registry/observation.js";
import type { SurfaceRegistry } from "../registry/surface.js";

export function computeEtag(value: unknown): string {
  const json = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    hash = (hash << 5) - hash + json.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function readObservation(
  surfaces: SurfaceRegistry,
  observations: ObservationRegistry,
  request: ReadObservationRequest
): AgentResult<unknown> {
  const { handle, name } = request;

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
  return {
    ok: true,
    data: validation.data,
    meta: { durationMs: 0, etag }
  };
}

export function readSnapshot(
  surfaces: SurfaceRegistry,
  observations: ObservationRegistry,
  handle: import("@agent-ready/schema").AgentHandle,
  names?: string[]
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
    const result = readObservation(surfaces, observations, { handle, name });
    if (!result.ok) return result;
    snapshot[name] = result.data;
  }

  const etag = computeEtag(snapshot);
  return { ok: true, data: snapshot, meta: { durationMs: 0, etag } };
}
