import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";

const handle = "crm://deals/detail/deal-1" as const;

describe("invokeAction", () => {
  it("invokes successfully", async () => {
    const rt = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["admin"], actions: ["save"] }]
      }
    });
    rt.registerSurface({
      manifest: { handle, title: "Deal", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "save",
        description: "Save",
        input: z.object({ id: z.number() })
      }),
      handler: (input) => ({ saved: input.id })
    });

    const result = await rt.invokeAction({
      handle,
      action: "save",
      input: { id: 42 },
      context: { sessionId: "test", roles: ["admin"] }
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ saved: 42 });
  });

  it("returns VALIDATION_FAILED for bad input", async () => {
    const rt = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["admin"], actions: ["save"] }]
      }
    });
    rt.registerSurface({
      manifest: { handle, title: "Deal", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "save",
        description: "Save",
        input: z.object({ id: z.number() })
      }),
      handler: (input) => ({ saved: input.id })
    });

    const result = await rt.invokeAction({
      handle,
      action: "save",
      input: { id: "bad" },
      context: { sessionId: "test", roles: ["admin"] }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_VALIDATION_FAILED");
  });

  it("returns HANDLER_ERROR when handler throws", async () => {
    const rt = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["admin"], actions: ["save"] }]
      }
    });
    rt.registerSurface({
      manifest: { handle, title: "Deal", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "save",
        description: "Save",
        input: z.object({ id: z.number() })
      }),
      handler: () => {
        throw new Error("boom");
      }
    });

    const result = await rt.invokeAction({
      handle,
      action: "save",
      input: { id: 1 },
      context: { sessionId: "test", roles: ["admin"] }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_HANDLER_ERROR");
  });

  it("returns NOT_FOUND for missing surface", async () => {
    const rt = createAgentRuntime();
    const result = await rt.invokeAction({
      handle,
      action: "save",
      input: {}
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AGENT_SURFACE_NOT_FOUND");
    }
  });

  it("returns NOT_FOUND for missing action", async () => {
    const rt = createAgentRuntime({
      defaultPolicy: { mode: "defaultAllow" }
    });
    rt.registerSurface({
      manifest: { handle, title: "Deal", capabilities: ["act"] }
    });
    const result = await rt.invokeAction({
      handle,
      action: "missing",
      input: {},
      context: { sessionId: "s1", roles: ["admin"] }
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("AGENT_ACTION_NOT_FOUND");
  });
});
