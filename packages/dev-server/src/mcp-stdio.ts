import { createMcpHandlers } from "@agent-ready/mcp";
import { listResources, listTools } from "@agent-ready/mcp";
import type { AgentCatalog } from "@agent-ready/runtime";
import { RemoteBridgeClient } from "./remote-bridge.js";

export interface StartMcpDevServerOptions {
  wsUrl: string;
  timeoutMs?: number;
}

export function createRemoteMcpHandlers(client: RemoteBridgeClient) {
  let catalogCache: AgentCatalog = { surfaces: [], total: 0 };

  const refreshCatalog = async () => {
    catalogCache = (await client.request("agent.catalog.list", {
      limit: 500
    })) as AgentCatalog;
    return catalogCache;
  };

  const runtimeProxy = {
    getCatalog: () => catalogCache,
    invokeAction: (request: unknown) =>
      client.request("agent.action.invoke", request as Record<string, unknown>),
    readObservation: (request: unknown) =>
      client.request("agent.observation.read", request as Record<string, unknown>)
  };

  const baseHandlers = createMcpHandlers(runtimeProxy as never);

  return {
    ...baseHandlers,
    "tools/list": async () => {
      await refreshCatalog();
      return listTools(runtimeProxy as never);
    },
    "tools/call": baseHandlers["tools/call"],
    "resources/list": async () => {
      await refreshCatalog();
      return listResources(runtimeProxy as never);
    },
    "resources/read": async (params: { uri: string }) => {
      const match = /^agent:\/\/observation\/(.+)\/([^/]+)$/.exec(params.uri);
      if (!match) throw new Error(`Invalid resource URI: ${params.uri}`);
      const [, handle, name] = match;
      const result = await client.request("agent.observation.read", { handle, name });
      return {
        contents: [
          {
            uri: params.uri,
            mimeType: "application/json",
            text: JSON.stringify(result)
          }
        ]
      };
    }
  };
}

export async function startMcpDevServer(options: StartMcpDevServerOptions): Promise<{
  close: () => void;
}> {
  const client = new RemoteBridgeClient({
    wsUrl: options.wsUrl,
    role: "mcp",
    timeoutMs: options.timeoutMs
  });

  await client.connect();
  const handlers = createRemoteMcpHandlers(client);

  const onData = async (chunk: Buffer) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    for (const line of lines) {
      try {
        const msg = JSON.parse(line) as {
          id: string | number;
          method: keyof ReturnType<typeof createRemoteMcpHandlers>;
          params?: Record<string, unknown>;
        };
        const handler = handlers[msg.method];
        if (!handler) {
          process.stdout.write(
            `${JSON.stringify({
              jsonrpc: "2.0",
              id: msg.id,
              error: { code: -32601, message: "Method not found" }
            })}\n`
          );
          continue;
        }
        const result = await (handler as (p: never) => unknown)(msg.params as never);
        process.stdout.write(
          `${JSON.stringify({ jsonrpc: "2.0", id: msg.id, result })}\n`
        );
      } catch (err) {
        process.stderr.write(
          `[agent-ready dev] ${err instanceof Error ? err.message : String(err)}\n`
        );
      }
    }
  };

  process.stdin.on("data", onData);

  return {
    close: () => {
      process.stdin.off("data", onData);
      client.close();
    }
  };
}
