import { useEffect, useRef } from "react";
import type { ActionDefinition } from "@agent-ready/schema";
import type { ActionHandlerContext } from "@agent-ready/runtime";
import { useAgentReadyContext } from "../context.js";
import type { AgentHandle } from "@agent-ready/schema";

export function useAgentAction<TIn, TOut>(
  handle: AgentHandle,
  action: ActionDefinition<TIn, TOut>,
  handler: (input: TIn, ctx: ActionHandlerContext) => Promise<TOut> | TOut
) {
  const { runtime } = useAgentReadyContext();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!handle) return;
    return runtime.registerAction(handle, {
      definition: action,
      handler: (input, ctx) =>
        handlerRef.current(input as TIn, ctx)
    });
  }, [runtime, handle, action.name]);
}
