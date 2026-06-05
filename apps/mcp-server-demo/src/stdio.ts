import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { createMcpHandlers } from "@agent-ready/mcp";

const runtime = createAgentRuntime({
  defaultPolicy: {
    mode: "defaultDeny",
    rules: [{ roles: ["demo"], actions: ["hello"] }]
  }
});

const handle = "app://mcp/demo/main" as const;
runtime.registerSurface({
  manifest: { handle, title: "MCP Demo", capabilities: ["act"] }
});
runtime.registerAction(handle, {
  definition: defineAction({
    name: "hello",
    description: "Say hello",
    input: z.object({ name: z.string() })
  }),
  handler: (input) => {
    const { name } = input as { name: string };
    return { message: `Hello, ${name}` };
  }
});

const handlers = createMcpHandlers(runtime);

process.stdin.on("data", async (chunk: Buffer) => {
  const msg = JSON.parse(chunk.toString()) as {
    id: number;
    method: keyof ReturnType<typeof createMcpHandlers>;
    params?: Record<string, unknown>;
  };
  const handler = handlers[msg.method];
  const result = handler
    ? await (handler as (p: never) => unknown)(msg.params as never)
    : { error: "not found" };
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }) + "\n");
});
