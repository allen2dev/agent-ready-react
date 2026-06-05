import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "./runtime.js";
import { createPolicyEngine } from "./policy/engine.js";

describe("createAgentRuntime", () => {
  it("creates runtime instance", () => {
    const rt = createAgentRuntime({ actionTimeoutMs: 1000 });
    expect(rt.getCatalog().total).toBe(0);
  });

  it("unregisters surface and related actions", () => {
    const handle = "app://demo/page/main" as const;
    const rt = createAgentRuntime({ defaultPolicy: { mode: "defaultAllow" } });
    const off = rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });
    expect(rt.getCatalog().total).toBe(1);
    off();
    expect(rt.getCatalog().total).toBe(0);
  });

  it("accepts runtime policy provider updates", async () => {
    const handle = "app://demo/page/main" as const;
    const rt = createAgentRuntime();
    rt.setPolicyProvider(createPolicyEngine({ mode: "defaultAllow" }));
    rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });
    const result = await rt.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: { sessionId: "s1" }
    });
    expect(result.ok).toBe(true);
  });
});
