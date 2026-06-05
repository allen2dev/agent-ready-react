import {
  agentError,
  validateAgentInput,
  type AgentResult,
  type InvokeActionRequest
} from "@agent-ready/schema";
import type { ActionRegistry } from "../registry/action.js";
import type { SurfaceRegistry } from "../registry/surface.js";
import type { ActionHandlerContext } from "../types.js";
import type { TypedEventBus } from "../events.js";
import type { PolicyProvider } from "../policy/types.js";

export async function invokeAction(
  surfaces: SurfaceRegistry,
  actions: ActionRegistry,
  events: TypedEventBus,
  request: InvokeActionRequest,
  options: {
    actionTimeoutMs?: number;
    policy?: PolicyProvider;
  } = {}
): Promise<AgentResult<unknown>> {
  const start = performance.now();
  const { handle, action: actionName, input, context } = request;

  if (!surfaces.has(handle)) {
    return {
      ok: false,
      error: agentError(
        "AGENT_SURFACE_NOT_FOUND",
        `Surface not found: ${handle}`
      )
    };
  }

  const registered = actions.get(handle, actionName);
  if (!registered) {
    return {
      ok: false,
      error: agentError(
        "AGENT_ACTION_NOT_FOUND",
        `Action not found: ${actionName}`
      )
    };
  }

  if (options.policy) {
    const allowed = await options.policy.canInvokeAction({
      handle,
      action: actionName,
      session: context
    });
    if (!allowed) {
      const error = agentError("AGENT_POLICY_DENIED", "Policy denied action");
      events.emit("policy:denied", { handle, action: actionName });
      events.emit("action:invoked", {
        handle,
        action: actionName,
        ok: false,
        error
      });
      return { ok: false, error };
    }
  }

  const validation = validateAgentInput(registered.definition.input, input);
  if (!validation.success) {
    events.emit("action:invoked", {
      handle,
      action: actionName,
      ok: false,
      error: validation.error
    });
    return { ok: false, error: validation.error };
  }

  const handlerContext: ActionHandlerContext = {
    handle,
    session: context,
    signal: AbortSignal.timeout(options.actionTimeoutMs ?? 30_000)
  };

  try {
    const data = await registered.handler(validation.data, handlerContext);
    const result: AgentResult<unknown> = {
      ok: true,
      data,
      meta: { durationMs: performance.now() - start }
    };
    events.emit("action:invoked", { handle, action: actionName, ok: true });
    return result;
  } catch (err) {
    const error = agentError(
      "AGENT_HANDLER_ERROR",
      err instanceof Error ? err.message : "Handler failed"
    );
    events.emit("action:invoked", {
      handle,
      action: actionName,
      ok: false,
      error
    });
    return { ok: false, error };
  }
}
