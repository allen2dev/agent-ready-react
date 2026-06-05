import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createTestRuntime } from "./create-test-runtime.js";
import { createMockAgent } from "./mock-agent.js";

describe("createMockAgent", () => {
  it("invokes through runtime", async () => {
    const rt = createTestRuntime();
    const handle = "app://demo/page/main" as const;
    rt.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    rt.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({ pong: true })
    });

    const agent = createMockAgent(rt);
    const result = await agent.invoke({ handle, action: "ping", input: {} });
    expect(result.ok).toBe(true);
  });
});
