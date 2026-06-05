import { describe, expect, it } from "vitest";
import { createAgentRuntime } from "../runtime.js";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";

const handle = "app://demo/page/main" as const;

describe("policy", () => {
  it("defaultDeny rejects without roles", async () => {
    const rt = createAgentRuntime();
    rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({})
    });

    const result = await rt.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: { sessionId: "s1" }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_POLICY_DENIED");
  });

  it("allows when role matches rule", async () => {
    const rt = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["admin"], actions: ["ping"] }]
      }
    });
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
      context: { sessionId: "s1", roles: ["admin"] }
    });
    expect(result.ok).toBe(true);
  });
});
