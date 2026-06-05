import type { AgentRuntime } from "@agent-ready/runtime";
import { toJsonSchema } from "@agent-ready/schema";

export function listTools(runtime: AgentRuntime) {
  const catalog = runtime.getCatalog({ limit: 500 });
  const tools = [];

  for (const surface of catalog.surfaces) {
    for (const actionName of surface.actions) {
      tools.push({
        name: encodeToolName(surface.handle, actionName),
        description: `${surface.title} — ${actionName}`,
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "object" },
            context: {
              type: "object",
              properties: {
                sessionId: { type: "string" },
                roles: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });
    }
  }

  return { tools };
}

export function encodeToolName(handle: string, action: string): string {
  return `${handle}::${action}`;
}

export function decodeToolName(name: string): { handle: string; action: string } {
  const idx = name.lastIndexOf("::");
  if (idx === -1) throw new Error(`Invalid tool name: ${name}`);
  return { handle: name.slice(0, idx), action: name.slice(idx + 2) };
}

export async function callTool(
  runtime: AgentRuntime,
  name: string,
  args: { input?: unknown; context?: { sessionId: string; roles?: string[] } }
) {
  const { handle, action } = decodeToolName(name);
  const result = await runtime.invokeAction({
    handle: handle as `${string}://${string}/${string}/${string}`,
    action,
    input: args.input ?? {},
    context: args.context
  });
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }]
  };
}

export function listResources(runtime: AgentRuntime) {
  const catalog = runtime.getCatalog({ limit: 500 });
  const resources = [];
  for (const surface of catalog.surfaces) {
    for (const obs of surface.observations) {
      resources.push({
        uri: `agent://observation/${surface.handle}/${obs}`,
        name: obs,
        mimeType: "application/json"
      });
    }
  }
  return { resources };
}

export function readResource(
  runtime: AgentRuntime,
  uri: string
): { contents: Array<{ uri: string; mimeType: string; text: string }> } {
  const match = /^agent:\/\/observation\/(.+)\/([^/]+)$/.exec(uri);
  if (!match) throw new Error(`Invalid resource URI: ${uri}`);
  const [, handle, name] = match;
  const result = runtime.readObservation({
    handle: handle as `${string}://${string}/${string}/${string}`,
    name: name!
  });
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(result)
      }
    ]
  };
}

// re-export for tests that need schema from registered actions
export { toJsonSchema };
