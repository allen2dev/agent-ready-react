import { createRequire } from "module";
import type { AgentResult, InvokeActionRequest } from "@agent-ready/schema";
import type { AgentRuntime } from "@agent-ready/runtime";

const require = createRequire(import.meta.url);

type OtelApi = typeof import("@opentelemetry/api");
type Tracer = import("@opentelemetry/api").Tracer;

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

export interface AttachOtelTracingOptions {
  tracer?: Tracer;
  tracerName?: string;
}

/** Wrap runtime.invokeAction with an `agent.action.invoke` span when OTel is available. */
export function attachOtelTracing(
  runtime: AgentRuntime,
  options: AttachOtelTracingOptions = {}
): () => void {
  const api = loadOtelApi();
  const tracer =
    options.tracer ??
    api?.trace.getTracer(options.tracerName ?? "@agent-ready/observability");

  if (!tracer) {
    return () => {};
  }

  const runtimeWithInvoke = runtime as AgentRuntime & {
    invokeAction: AgentRuntime["invokeAction"];
  };
  const original = runtimeWithInvoke.invokeAction.bind(runtimeWithInvoke);

  runtimeWithInvoke.invokeAction = (async <T>(
    request: InvokeActionRequest
  ): Promise<AgentResult<T>> => {
    const span = tracer.startSpan("agent.action.invoke", {
      attributes: {
        "agent.handle": request.handle,
        "agent.action": request.action,
        "agent.session_id": request.context?.sessionId ?? ""
      }
    });

    try {
      const result = await original(request);
      if (api) {
        if (!result.ok) {
          span.setStatus({
            code: api.SpanStatusCode.ERROR,
            message: result.error.message
          });
          span.setAttribute("agent.error.code", result.error.code);
        } else {
          span.setStatus({ code: api.SpanStatusCode.OK });
          if (result.meta?.durationMs != null) {
            span.setAttribute("agent.duration_ms", result.meta.durationMs);
          }
        }
      }
      return result as AgentResult<T>;
    } catch (err) {
      span.recordException(
        err instanceof Error ? err : new Error(String(err))
      );
      if (api) {
        span.setStatus({ code: api.SpanStatusCode.ERROR });
      }
      throw err;
    } finally {
      span.end();
    }
  }) as AgentRuntime["invokeAction"];

  return () => {
    runtimeWithInvoke.invokeAction = original;
  };
}

export function resetOtelCacheForTests(value?: OtelApi | null): void {
  cachedOtel = value;
}
