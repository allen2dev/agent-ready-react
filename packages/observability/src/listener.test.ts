import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { attachRuntimeListener, createMemorySink } from "./index.js";

describe("attachRuntimeListener", () => {
  it("records action:invoked", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["test"], actions: ["ping"] }]
      }
    });
    const sink = createMemorySink();
    attachRuntimeListener(runtime, sink);

    const handle = "app://demo/page/main" as const;
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

    await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: { sessionId: "s1", roles: ["test"] }
    });

    expect(sink.getEntries().some((e) => e.type === "action:invoked")).toBe(
      true
    );
  });
});
