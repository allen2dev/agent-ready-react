#!/usr/bin/env node
import { createAgentRuntime } from "@agent-ready/runtime";
import { createMcpHandlers } from "./index.js";

async function main() {
  const runtime = createAgentRuntime({
    defaultPolicy: { mode: "defaultAllow" }
  });
  const handlers = createMcpHandlers(runtime);

  process.stdin.on("data", async (chunk) => {
    try {
      const msg = JSON.parse(chunk.toString()) as {
        id: string | number;
        method: keyof ReturnType<typeof createMcpHandlers>;
        params?: Record<string, unknown>;
      };
      const handler = handlers[msg.method];
      if (!handler) {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: "2.0",
            id: msg.id,
            error: { code: -32601, message: "Method not found" }
          }) + "\n"
        );
        return;
      }
      const result = await (handler as (p: never) => unknown)(msg.params as never);
      process.stdout.write(
        JSON.stringify({ jsonrpc: "2.0", id: msg.id, result }) + "\n"
      );
    } catch {
      // ignore malformed lines in demo stdio loop
    }
  });
}

main();
