import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "@agent-ready/runtime";
import { createMcpSseServer } from "./sse.js";

async function readSseEvent(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  eventName: string
): Promise<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const lines = block.split("\n");
      const eventLine = lines.find((l) => l.startsWith("event: "));
      const dataLine = lines.find((l) => l.startsWith("data: "));
      if (eventLine?.slice(7) === eventName && dataLine) {
        return dataLine.slice(6);
      }
    }
  }

  throw new Error(`SSE event not found: ${eventName}`);
}

describe("mcp sse", () => {
  it("serves tools/list over HTTP SSE transport", async () => {
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
        input: z.object({ msg: z.string() })
      }),
      handler: (input) => ({ echo: input.msg })
    });

    const mcp = createMcpSseServer(runtime);
    const port = await mcp.listen();

    try {
      const sseRes = await fetch(`http://127.0.0.1:${port}/sse`);
      expect(sseRes.headers.get("content-type")).toContain("text/event-stream");

      const reader = sseRes.body!.getReader();
      const endpoint = await readSseEvent(reader, "endpoint");
      expect(endpoint).toMatch(/^\/messages\?sessionId=/);

      const postRes = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list"
        })
      });
      expect(postRes.status).toBe(202);

      const message = await readSseEvent(reader, "message");
      const parsed = JSON.parse(message) as {
        id: number;
        result: { tools: Array<{ name: string }> };
      };
      expect(parsed.id).toBe(1);
      expect(parsed.result.tools.some((t) => t.name.includes("ping"))).toBe(true);
    } finally {
      await mcp.close();
    }
  });
});
