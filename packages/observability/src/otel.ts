import type { AgentResult, InvokeActionRequest } from "@agent-ready/schema";
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
      if (!result.ok) {
        span.setStatus({
          code: SPAN_ERROR,
          message: result.error.message
        });
        span.setAttribute("agent.error.code", result.error.code);
      } else {
        span.setStatus({ code: SPAN_OK });
        if (result.meta?.durationMs != null) {
          span.setAttribute("agent.duration_ms", result.meta.durationMs);
        }
      }
      return result as AgentResult<T>;
    } catch (err) {
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

/** Wrap runtime.invokeAction with an `agent.action.invoke` span. Requires an explicit tracer. */
export function attachOtelTracing(
  runtime: AgentRuntime,
  options: AttachOtelTracingOptions = {}
): () => void {
  const tracer = options.tracer;
  if (!tracer) {
    return () => {};
  }
  return wrapInvokeAction(runtime, tracer);
}
