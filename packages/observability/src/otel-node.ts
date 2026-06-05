import { createRequire } from "module";
import type { Tracer } from "@opentelemetry/api";
import type { AgentRuntime } from "@agent-ready/runtime";
import { attachOtelTracing, type AttachOtelTracingOptions } from "./otel.js";

const require = createRequire(import.meta.url);

type OtelApi = typeof import("@opentelemetry/api");

let cachedOtel: OtelApi | null | undefined;

function loadOtelApi(): OtelApi | undefined {
  if (cachedOtel !== undefined) {
    return cachedOtel ?? undefined;
  }
  try {
    cachedOtel = require("@opentelemetry/api") as OtelApi;
    return cachedOtel;
  } catch {
    cachedOtel = null;
    return undefined;
  }
}

export function resolveOtelTracer(tracerName?: string): Tracer | undefined {
  const api = loadOtelApi();
  return api?.trace.getTracer(tracerName ?? "@agent-ready/observability");
}

/** Node helper: resolve tracer from optional @opentelemetry/api install. */
export function attachOtelTracingAuto(
  runtime: AgentRuntime,
  options: AttachOtelTracingOptions = {}
): () => void {
  const tracer =
    options.tracer ?? resolveOtelTracer(options.tracerName);
  return attachOtelTracing(runtime, { ...options, tracer });
}

export function resetOtelCacheForTests(value?: OtelApi | null): void {
  cachedOtel = value;
}
