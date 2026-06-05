import type { AgentRuntime } from "@agent-ready/runtime";
import { callTool, listResources, listTools, readResource } from "./tools.js";

/** Lightweight MCP adapter surface; wire to @modelcontextprotocol/sdk in stdio entry. */
export function createMcpHandlers(runtime: AgentRuntime) {
  return {
    "tools/list": () => listTools(runtime),
    "tools/call": (params: { name: string; arguments?: Record<string, unknown> }) =>
      callTool(runtime, params.name, params.arguments ?? {}),
    "resources/list": () => listResources(runtime),
    "resources/read": (params: { uri: string }) => readResource(runtime, params.uri)
  };
}

export * from "./tools.js";
