import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";
import { attachAuditSink, type AuditSink } from "./index.js";
import { createConsoleAuditSink } from "./console.js";

const handle = "app://demo/page/main" as const;

describe("audit.interface", () => {
  it("emits audit entries for invoke success, failure, and policy deny", async () => {
    const entries: unknown[] = [];
    const sink: AuditSink = { emit: (entry) => entries.push(entry) };

    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });
    attachAuditSink(runtime, sink);

    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "boom",
        description: "Boom",
        input: z.object({})
      }),
      handler: () => {
        throw new Error("boom");
      }
    });

    await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: { sessionId: "s1", roles: ["agent"] }
    });
    await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: { sessionId: "s2" }
    });
    await runtime.invokeAction({
      handle,
      action: "boom",
      input: {},
      context: { sessionId: "s3", roles: ["agent"] }
    });

    expect(entries.some((e) => (e as { type: string }).type === "action.invoked")).toBe(
      true
    );
    expect(entries.some((e) => (e as { type: string }).type === "action.denied")).toBe(
      true
    );
    expect(entries.some((e) => (e as { type: string }).type === "action.failed")).toBe(
      true
    );
  });
});

describe("audit.console", () => {
  it("writes structured JSON lines", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    createConsoleAuditSink().emit({
      type: "action.invoked",
      handle,
      action: "ping",
      timestamp: 1
    });
    expect(log.mock.calls[0]?.[0]).toBe(
      JSON.stringify({
        type: "action.invoked",
        handle,
        action: "ping",
        timestamp: 1
      })
    );
    log.mockRestore();
  });
});

describe("audit.http", () => {
  it("posts batched entries to mock server", async () => {
    const { createHttpAuditSink } = await import("./http.js");
    const bodies: string[] = [];
    const sink = createHttpAuditSink({
      url: "https://audit.example/events",
      batchSize: 2,
      fetchImpl: async (_url, init) => {
        bodies.push(String(init?.body));
        return new Response(null, { status: 200 });
      }
    });

    sink.emit({
      type: "action.invoked",
      handle,
      action: "a",
      timestamp: 1
    });
    sink.emit({
      type: "action.invoked",
      handle,
      action: "b",
      timestamp: 2
    });

    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toContain('"action":"a"');
  });
});
