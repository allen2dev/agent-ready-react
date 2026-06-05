import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction, defineObservation } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { attachOtelTracing } from "./otel.js";
import { attachOtelTracingAuto, resetOtelCacheForTests } from "./otel-node.js";

interface RecordedSpan {
  name: string;
  attributes: Record<string, string | number | boolean>;
  status?: { code: number; message?: string };
  ended: boolean;
}

function createMockTracer(spans: RecordedSpan[]) {
  return {
    startSpan(name: string, options?: { attributes?: Record<string, string | number | boolean> }) {
      const span: RecordedSpan = {
        name,
        attributes: { ...options?.attributes },
        ended: false
      };
      spans.push(span);
      return {
        setAttribute(key: string, value: string | number | boolean) {
          span.attributes[key] = value;
        },
        setStatus(status: { code: number; message?: string }) {
          span.status = status;
        },
        recordException() {},
        end() {
          span.ended = true;
        }
      };
    }
  };
}

describe("attachOtelTracing", () => {
  const handle = "app://demo/page/main" as const;

  function setupRuntime() {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["test"], actions: ["ping"] }]
      }
    });
    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({ msg: z.string() })
      }),
      handler: (input) => ({ echo: input.msg })
    });
    return runtime;
  }

  it("records agent.action.invoke span", async () => {
    const spans: RecordedSpan[] = [];
    const runtime = setupRuntime();
    attachOtelTracing(runtime, { tracer: createMockTracer(spans) as never });

    const result = await runtime.invokeAction({
      handle,
      action: "ping",
      input: { msg: "hi" },
      context: { sessionId: "s1", roles: ["test"] }
    });

    expect(result.ok).toBe(true);
    expect(spans).toHaveLength(1);
    expect(spans[0]?.name).toBe("agent.action.invoke");
    expect(spans[0]?.attributes["agent.action"]).toBe("ping");
    expect(spans[0]?.attributes["agent.ok"]).toBe(true);
    expect(spans[0]?.ended).toBe(true);
  });

  it("records agent.observation.read span", () => {
    const spans: RecordedSpan[] = [];
    const runtime = setupRuntime();
    attachOtelTracing(runtime, { tracer: createMockTracer(spans) as never });

    runtime.registerObservation(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ n: z.number() })
      }),
      selector: () => ({ n: 1 })
    });

    runtime.readObservation({ handle, name: "state" });

    expect(spans.some((span) => span.name === "agent.observation.read")).toBe(true);
    expect(
      spans.find((span) => span.name === "agent.observation.read")?.attributes["agent.ok"]
    ).toBe(true);
  });

  it("no-ops when no tracer is provided", async () => {
    const runtime = setupRuntime();
    const detach = attachOtelTracing(runtime);

    const result = await runtime.invokeAction({
      handle,
      action: "ping",
      input: { msg: "hi" },
      context: { sessionId: "s1", roles: ["test"] }
    });

    expect(result.ok).toBe(true);
    expect(typeof detach).toBe("function");
    detach();
  });

  it("uses @opentelemetry/api when installed via auto helper", async () => {
    resetOtelCacheForTests();
    const api = await import("@opentelemetry/api");
    const { BasicTracerProvider, SimpleSpanProcessor, InMemorySpanExporter } =
      await import("@opentelemetry/sdk-trace-base");

    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider();
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    api.trace.setGlobalTracerProvider(provider);

    const runtime = setupRuntime();
    attachOtelTracingAuto(runtime);

    await runtime.invokeAction({
      handle,
      action: "ping",
      input: { msg: "otel" },
      context: { sessionId: "s1", roles: ["test"] }
    });

    const spans = exporter.getFinishedSpans();
    expect(spans.some((s) => s.name === "agent.action.invoke")).toBe(true);
    resetOtelCacheForTests();
  });
});
