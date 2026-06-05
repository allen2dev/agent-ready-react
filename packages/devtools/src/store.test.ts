import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { createDevToolsStore } from "./store.js";

const handle = "app://demo/page/main" as const;

describe("createDevToolsStore", () => {
  it("keeps action log ring buffer at 100", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["a"] }]
      }
    });
    const store = createDevToolsStore(runtime, 100);

    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "a",
        description: "A",
        input: z.object({ n: z.number() })
      }),
      handler: (input) => input
    });

    for (let i = 0; i < 101; i++) {
      await runtime.invokeAction({
        handle,
        action: "a",
        input: { n: i },
        context: { sessionId: "s1", roles: ["agent"] }
      });
    }

    expect(store.getState().actionLog).toHaveLength(100);
    store.destroy();
  });

  it("records policy denied", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: { mode: "defaultDeny", rules: [] }
    });
    const store = createDevToolsStore(runtime);

    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "x",
        description: "X",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });

    await runtime.invokeAction({
      handle,
      action: "x",
      input: {},
      context: { sessionId: "s1", roles: ["guest"] }
    });

    expect(store.getState().policyLog).toHaveLength(1);
    store.destroy();
  });
});
