import type { NextApiRequest, NextApiResponse } from "next";
import type { AgentRuntime } from "@agent-ready/runtime";
import { handleBridgeMethod } from "@agent-ready/bridge";

interface JsonRpcRequest {
  jsonrpc?: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export function createPagesAgentReadyHandler(runtime: AgentRuntime) {
  return async function agentReadyPagesHandler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const payload = req.body as JsonRpcRequest;
    if (!payload?.method) {
      res.status(400).json({ error: "Missing method" });
      return;
    }

    const result = await handleBridgeMethod(runtime, payload.method, payload.params);
    res.status(200).json({
      jsonrpc: "2.0",
      id: payload.id ?? null,
      result
    });
  };
}
