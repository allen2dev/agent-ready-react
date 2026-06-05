import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { AgentReadyProvider } from "./AgentReadyProvider.js";
import { useAgentSurface } from "./hooks/useAgentSurface.js";
import { useAgentAction } from "./hooks/useAgentAction.js";

const handle = "app://demo/page/main" as const;

function Demo() {
  useAgentSurface({
    handle,
    title: "Demo",
    capabilities: ["act"]
  });
  useAgentSurface({
    handle,
    title: "Demo",
    capabilities: ["act"]
  });
  useAgentAction(
    handle,
    defineAction({
      name: "ping",
      description: "Ping",
      input: z.object({ msg: z.string() })
    }),
    (input) => ({ echo: input.msg })
  );
  return null;
}

describe("surface registration ref counting", () => {
  it("allows multiple useAgentSurface calls for the same handle", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });

    render(
      <AgentReadyProvider runtime={runtime} session={{ sessionId: "s1", roles: ["agent"] }}>
        <Demo />
      </AgentReadyProvider>
    );

    await waitFor(() => {
      expect(runtime.getCatalog().total).toBe(1);
    });

    const result = await runtime.invokeAction({
      handle,
      action: "ping",
      input: { msg: "hi" },
      context: { sessionId: "s1", roles: ["agent"] }
    });
    expect(result.ok).toBe(true);
  });
});
