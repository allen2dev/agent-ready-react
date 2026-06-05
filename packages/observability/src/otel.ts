import type { AgentResult, InvokeActionRequest, ReadObservationRequest } from "@agent-ready/schema";
import type { AgentRuntime } from "@agent-ready/runtime";
import type { Tracer } from "@opentelemetry/api";

const SPAN_OK = 1;
const SPAN_ERROR = 2;

export interface AttachOtelTracingOptions {
  tracer?: Tracer;
  tracerName?: string;
}

function wrapInvokeAction(runtime: AgentRuntime, tracer: Tracer): () => void {
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
      span.setAttribute("agent.ok", result.ok);
      if (result.ok && result.meta?.durationMs != null) {
        span.setAttribute("agent.duration_ms", result.meta.durationMs);
      }
      if (!result.ok) {
        span.setStatus({
          code: SPAN_ERROR,
          message: result.error.message
        });
        span.setAttribute("agent.error.code", result.error.code);
      } else {
        span.setStatus({ code: SPAN_OK });
      }
      return result as AgentResult<T>;
    } catch (err) {
      span.setAttribute("agent.ok", false);
      span.recordException(
        err instanceof Error ? err : new Error(String(err))
      );
      span.setStatus({ code: SPAN_ERROR });
      throw err;
    } finally {
      span.end();
    }
  }) as AgentRuntime["invokeAction"];

  return () => {
    runtimeWithInvoke.invokeAction = original;
  };
}

function wrapReadObservation(runtime: AgentRuntime, tracer: Tracer): () => void {
  const runtimeWithRead = runtime as AgentRuntime & {
    readObservation: AgentRuntime["readObservation"];
  };
  const original = runtimeWithRead.readObservation.bind(runtimeWithRead);

  runtimeWithRead.readObservation = ((request: ReadObservationRequest) => {
    const span = tracer.startSpan("agent.observation.read", {
      attributes: {
        "agent.handle": request.handle,
        "agent.observation": request.name
      }
    });
    const start = performance.now();

    try {
      const result = original(request);
      const durationMs =
        result.ok && result.meta?.durationMs != null
          ? result.meta.durationMs
          : performance.now() - start;
      span.setAttribute("agent.ok", result.ok);
      span.setAttribute("agent.duration_ms", durationMs);
      if (!result.ok) {
        span.setStatus({
          code: SPAN_ERROR,
          message: result.error.message
        });
        span.setAttribute("agent.error.code", result.error.code);
      } else {
        span.setStatus({ code: SPAN_OK });
      }
      return result;
    } catch (err) {
      span.setAttribute("agent.ok", false);
      span.recordException(
        err instanceof Error ? err : new Error(String(err))
      );
      span.setStatus({ code: SPAN_ERROR });
      throw err;
    } finally {
      span.end();
    }
  }) as AgentRuntime["readObservation"];

  return () => {
    runtimeWithRead.readObservation = original;
  };
}

/** Wrap runtime action and observation reads with OpenTelemetry spans. Requires an explicit tracer. */
export function attachOtelTracing(
  runtime: AgentRuntime,
  options: AttachOtelTracingOptions = {}
): () => void {
  const tracer = options.tracer;
  if (!tracer) {
    return () => {};
  }
  const restoreInvoke = wrapInvokeAction(runtime, tracer);
  const restoreRead = wrapReadObservation(runtime, tracer);
  return () => {
    restoreInvoke();
    restoreRead();
  };
}
