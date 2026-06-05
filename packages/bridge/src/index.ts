import type { AgentRuntime } from "@agent-ready/runtime";
import type { InvokeActionRequest } from "@agent-ready/schema";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export function createBridgeServer(runtime: AgentRuntime, port = 0) {
  const server = createServer(async (req, res) => {
    if (req.method !== "POST") {
      sendJson(res, 405, { error: "Method not allowed" });
      return;
    }

    const body = await readBody(req);
    let payload: JsonRpcRequest;
    try {
      payload = JSON.parse(body) as JsonRpcRequest;
    } catch {
      sendJson(res, 400, { error: "Invalid JSON" });
      return;
    }

    const result = await handleMethod(runtime, payload);
    sendJson(res, 200, { jsonrpc: "2.0", id: payload.id, result });
  });

  return new Promise<{ server: typeof server; port: number }>((resolve) => {
    server.listen(port, () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" && address ? address.port : port;
      resolve({ server, port: resolvedPort });
    });
  });
}

async function handleMethod(runtime: AgentRuntime, req: JsonRpcRequest) {
  switch (req.method) {
    case "agent.catalog.list":
      return runtime.getCatalog(req.params as { limit?: number });
    case "agent.action.invoke":
      return runtime.invokeAction(req.params as unknown as InvokeActionRequest);
    case "agent.observation.read":
      return runtime.readObservation(
        req.params as { handle: string; name: string }
      );
    default:
      return { ok: false, error: { code: "AGENT_ACTION_NOT_FOUND", message: req.method } };
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
