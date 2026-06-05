import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse
} from "node:http";
import { randomUUID } from "node:crypto";
import type { AgentRuntime } from "@agent-ready/runtime";
import { createMcpHandlers } from "./index.js";

type McpHandler = ReturnType<typeof createMcpHandlers>;
type McpMethod = keyof McpHandler;

interface SseSession {
  res: ServerResponse;
  handlers: McpHandler;
}

export interface McpSseServerOptions {
  port?: number;
  host?: string;
  ssePath?: string;
  messagePath?: string;
}

export interface McpSseServer {
  server: Server;
  listen(): Promise<number>;
  close(): Promise<void>;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function writeSseEvent(res: ServerResponse, event: string, data: string): void {
  res.write(`event: ${event}\ndata: ${data}\n\n`);
}

async function dispatchJsonRpc(
  handlers: McpHandler,
  msg: {
    id?: string | number;
    method?: string;
    params?: Record<string, unknown>;
  }
) {
  const handler = msg.method
    ? handlers[msg.method as McpMethod]
    : undefined;
  if (!handler) {
    return {
      jsonrpc: "2.0" as const,
      id: msg.id,
      error: { code: -32601, message: "Method not found" }
    };
  }
  const result = await (handler as (p: never) => unknown)(msg.params as never);
  return { jsonrpc: "2.0" as const, id: msg.id, result };
}

/** HTTP+SSE MCP transport (protocol 2024-11-05 compatibility). */
export function createMcpSseServer(
  runtime: AgentRuntime,
  options: McpSseServerOptions = {}
): McpSseServer {
  const ssePath = options.ssePath ?? "/sse";
  const messagePath = options.messagePath ?? "/messages";
  const handlers = createMcpHandlers(runtime);
  const sessions = new Map<string, SseSession>();

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "GET" && url.pathname === ssePath) {
      const sessionId = randomUUID();
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      });
      writeSseEvent(res, "endpoint", `${messagePath}?sessionId=${sessionId}`);
      sessions.set(sessionId, { res, handlers });
      req.on("close", () => sessions.delete(sessionId));
      return;
    }

    if (req.method === "POST" && url.pathname === messagePath) {
      const sessionId = url.searchParams.get("sessionId");
      const session = sessionId ? sessions.get(sessionId) : undefined;
      if (!session) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Session not found");
        return;
      }

      try {
        const body = await readBody(req);
        const msg = JSON.parse(body) as {
          id?: string | number;
          method?: string;
          params?: Record<string, unknown>;
        };
        const response = await dispatchJsonRpc(session.handlers, msg);
        writeSseEvent(session.res, "message", JSON.stringify(response));
        res.writeHead(202, { "Content-Type": "text/plain" });
        res.end("Accepted");
      } catch {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Bad Request");
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  return {
    server,
    listen() {
      return new Promise<number>((resolve, reject) => {
        server.once("error", reject);
        server.listen(options.port ?? 0, options.host ?? "127.0.0.1", () => {
          server.off("error", reject);
          const addr = server.address();
          if (!addr || typeof addr === "string") {
            reject(new Error("Unable to resolve server address"));
            return;
          }
          resolve(addr.port);
        });
      });
    },
    close() {
      for (const session of sessions.values()) {
        session.res.end();
      }
      sessions.clear();
      return new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
}
