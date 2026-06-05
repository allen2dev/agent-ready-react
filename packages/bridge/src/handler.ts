import type { AgentRuntime } from "@agent-ready/runtime";
import type { InvokeActionRequest } from "@agent-ready/schema";

export async function handleBridgeMethod(
  runtime: AgentRuntime,
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  switch (method) {
    case "agent.catalog.list":
      return runtime.getCatalog(params as { limit?: number });
    case "agent.catalog.prompt":
      return runtime.toPromptContext(
        params as { tier?: "summary" | "full" | "debug" }
      );
    case "agent.action.invoke":
      return runtime.invokeAction(params as unknown as InvokeActionRequest);
    case "agent.observation.read":
      return runtime.readObservation(
        params as { handle: string; name: string }
      );
    default:
      return {
        ok: false,
        error: { code: "AGENT_ACTION_NOT_FOUND", message: method }
      };
  }
}
