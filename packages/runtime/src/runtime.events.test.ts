import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { defineAction, defineObservation } from "@agent-ready/schema";
import { createAgentRuntime } from "./runtime.js";

const handle = "app://demo/page/main" as const;
const manifest = { handle, title: "Main", capabilities: ["act", "observe"] as const };

describe("runtime events", () => {
  it("emits surface:registered with manifest", () => {
    const runtime = createAgentRuntime();
    const listener = vi.fn();
    runtime.on("surface:registered", listener);

    runtime.registerSurface({ manifest });

    expect(listener).toHaveBeenCalledWith({ handle, manifest });
  });

  it("emits surface:unregistered with manifest", () => {
    const runtime = createAgentRuntime();
    const listener = vi.fn();
    runtime.on("surface:unregistered", listener);

    const off = runtime.registerSurface({ manifest });
    off();

    expect(listener).toHaveBeenCalledWith({ handle, manifest });
  });

  it("emits action:registered and action:unregistered", () => {
    const runtime = createAgentRuntime();
    const registered = vi.fn();
    const unregistered = vi.fn();
    runtime.on("action:registered", registered);
    runtime.on("action:unregistered", unregistered);

    runtime.registerSurface({ manifest });
    const off = runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({ msg: z.string().optional() })
      }),
      handler: () => ({ ok: true })
    });
    off();

    expect(registered).toHaveBeenCalledWith({ handle, actionName: "ping" });
    expect(unregistered).toHaveBeenCalledWith({ handle, actionName: "ping" });
  });

  it("emits action:invoked with input, result, duration, and session", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });
    const listener = vi.fn();
    runtime.on("action:invoked", listener);

    runtime.registerSurface({ manifest });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({ msg: z.string() })
      }),
      handler: (input) => ({ echo: input.msg })
    });

    await runtime.invokeAction({
      handle,
      action: "ping",
      input: { msg: "hi" },
      context: { sessionId: "session-1", roles: ["agent"] }
    });

    expect(listener).toHaveBeenCalledOnce();
    const payload = listener.mock.calls[0]![0];
    expect(payload.handle).toBe(handle);
    expect(payload.actionName).toBe("ping");
    expect(payload.input).toEqual({ msg: "hi" });
    expect(payload.sessionId).toBe("session-1");
    expect(payload.result.ok).toBe(true);
    expect(payload.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("emits policy:denied with reason and session", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: { mode: "defaultDeny", rules: [] }
    });
    const listener = vi.fn();
    runtime.on("policy:denied", listener);

    runtime.registerSurface({ manifest });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });

    await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: { sessionId: "session-2", roles: ["guest"] }
    });

    expect(listener).toHaveBeenCalledWith({
      handle,
      actionName: "ping",
      reason: "Policy denied action",
      sessionId: "session-2"
    });
  });

  it("emits observation:read with byte size and duration", () => {
    const runtime = createAgentRuntime();
    const listener = vi.fn();
    runtime.on("observation:read", listener);

    runtime.registerSurface({ manifest });
    runtime.registerObservation(handle, {
      definition: defineObservation({
        name: "state",
        description: "State",
        schema: z.object({ count: z.number() })
      }),
      selector: () => ({ count: 42 })
    });

    runtime.readObservation({ handle, name: "state" });

    expect(listener).toHaveBeenCalledOnce();
    const payload = listener.mock.calls[0]![0];
    expect(payload.handle).toBe(handle);
    expect(payload.observationName).toBe("state");
    expect(payload.byteSize).toBeGreaterThan(0);
    expect(payload.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("emits catalog:updated with total surface count", () => {
    const runtime = createAgentRuntime();
    const listener = vi.fn();
    runtime.on("catalog:updated", listener);

    const off = runtime.registerSurface({ manifest });
    expect(listener).toHaveBeenLastCalledWith({ totalSurfaces: 1 });

    off();
    expect(listener).toHaveBeenLastCalledWith({ totalSurfaces: 0 });
  });
});
