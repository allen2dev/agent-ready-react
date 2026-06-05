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
});
