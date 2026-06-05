import { trace } from "@opentelemetry/api";
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  WebTracerProvider
} from "@opentelemetry/sdk-trace-web";
import type { AgentRuntime } from "@agent-ready/runtime";
import { attachOtelTracing } from "@agent-ready/observability";

let detachTracing: (() => void) | undefined;
let provider: WebTracerProvider | undefined;

export function enablePlaygroundOtel(runtime: AgentRuntime): void {
  if (detachTracing) return;

  provider = new WebTracerProvider();
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  provider.register();

  const tracer = trace.getTracer("agent-ready-playground");
  detachTracing = attachOtelTracing(runtime, {
    tracer,
    tracerName: "agent-ready-playground"
  });
}

export function disablePlaygroundOtel(): void {
  detachTracing?.();
  detachTracing = undefined;
  provider?.shutdown();
  provider = undefined;
}

export function isPlaygroundOtelEnabled(): boolean {
  return detachTracing != null;
}
