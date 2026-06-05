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

import type { RateLimitProvider } from "../ratelimit/index.js";

function emitActionInvoked(
  events: TypedEventBus,
  payload: {
    handle: InvokeActionRequest["handle"];
    actionName: string;
    input: unknown;
    result: AgentResult<unknown>;
    durationMs: number;
    sessionId?: string;
  }
): void {
  events.emit("action:invoked", {
    handle: payload.handle,
    actionName: payload.actionName,
    input: payload.input,
    result: payload.result.ok
      ? { ok: true, data: payload.result.data }
      : { ok: false, error: payload.result.error },
    durationMs: payload.durationMs,
    sessionId: payload.sessionId
  });
}

export async function invokeAction(
  surfaces: SurfaceRegistry,
  actions: ActionRegistry,
  events: TypedEventBus,
  request: InvokeActionRequest,
  options: {
    actionTimeoutMs?: number;
    policy?: PolicyProvider;
    rateLimit?: RateLimitProvider;
  } = {}
): Promise<AgentResult<unknown>> {
  const start = performance.now();
  const { handle, action: actionName, input, context } = request;
  const sessionId = context?.sessionId;

  const finish = (result: AgentResult<unknown>): AgentResult<unknown> => {
    emitActionInvoked(events, {
      handle,
      actionName,
      input,
      result,
      durationMs: performance.now() - start,
      sessionId
    });
    return result;
  };

  if (options.rateLimit && sessionId) {
    const allowed = await options.rateLimit.check({
      sessionId,
      handle,
      action: actionName
    });
    if (!allowed) {
      return finish({
        ok: false,
        error: agentError("AGENT_RATE_LIMITED", "Rate limit exceeded")
      });
    }
  }

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
      events.emit("policy:denied", {
        handle,
        actionName,
        reason: error.message,
        sessionId
      });
      return finish({ ok: false, error });
    }
  }

  const validation = validateAgentInput(registered.definition.input, input);
  if (!validation.success) {
    return finish({ ok: false, error: validation.error });
  }

  const handlerContext: ActionHandlerContext = {
    handle,
    session: context,
    signal: AbortSignal.timeout(options.actionTimeoutMs ?? 30_000)
  };

  try {
    const data = await registered.handler(validation.data, handlerContext);
    return finish({
      ok: true,
      data,
      meta: { durationMs: performance.now() - start }
    });
  } catch (err) {
    return finish({
      ok: false,
      error: agentError(
        "AGENT_HANDLER_ERROR",
        err instanceof Error ? err.message : "Handler failed"
      )
    });
  }
}
