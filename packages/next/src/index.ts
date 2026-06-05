import type { AgentRuntime } from "@agent-ready/runtime";
import { handleBridgeMethod } from "@agent-ready/bridge";

interface JsonRpcRequest {
  jsonrpc?: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface AgentReadyHandlerOptions {
  /** Allowed HTTP methods. Defaults to POST only. */
  methods?: string[];
}

export function createAgentReadyHandler(
  runtime: AgentRuntime,
  options: AgentReadyHandlerOptions = {}
) {
  const allowed = new Set(
    (options.methods ?? ["POST"]).map((method) => method.toUpperCase())
  );

  return async function agentReadyHandler(request: Request): Promise<Response> {
    if (!allowed.has(request.method.toUpperCase())) {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    let payload: JsonRpcRequest;
    try {
      payload = (await request.json()) as JsonRpcRequest;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    if (!payload.method) {
      return jsonResponse({ error: "Missing method" }, 400);
    }

    const result = await handleBridgeMethod(runtime, payload.method, payload.params);
    return jsonResponse({
      jsonrpc: "2.0",
      id: payload.id ?? null,
      result
    });
  };
}

export interface WithAgentReadyOptions {
  /** App Router route path. Default `/api/agent-ready/[...method]`. */
  routePath?: string;
  transpilePackages?: string[];
}

export function withAgentReady<T extends Record<string, unknown>>(
  nextConfig: T = {} as T,
  options: WithAgentReadyOptions = {}
): T {
  const packages = new Set([
    "@agent-ready/react",
    "@agent-ready/runtime",
    "@agent-ready/schema",
    "@agent-ready/next",
    ...(options.transpilePackages ?? []),
    ...(((nextConfig as { transpilePackages?: string[] }).transpilePackages ??
      []) as string[])
  ]);

  return {
    ...nextConfig,
    transpilePackages: [...packages],
    env: {
      ...((nextConfig as { env?: Record<string, string> }).env ?? {}),
      AGENT_READY_ROUTE_PATH:
        options.routePath ?? "/api/agent-ready/[...method]"
    }
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
