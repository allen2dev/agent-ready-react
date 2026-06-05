import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { createBridgeServer } from "./index.js";

describe("bridge e2e", () => {
  it("invokes action over HTTP JSON-RPC", async () => {
    const runtime = createAgentRuntime({
      defaultPolicy: {
        mode: "defaultDeny",
        rules: [{ roles: ["agent"], actions: ["ping"] }]
      }
    });
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
      handler: () => ({ pong: true })
    });

    const { server, port } = await createBridgeServer(runtime);
    const response = await fetch(`http://127.0.0.1:${port}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "agent.action.invoke",
        params: {
          handle,
          action: "ping",
          input: {},
          context: { sessionId: "s1", roles: ["agent"] }
        }
      })
    });
    const json = await response.json();
    expect(json.result.ok).toBe(true);
    server.close();
  });
});
