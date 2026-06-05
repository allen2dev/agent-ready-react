import { useAgentReadyContext } from "@agent-ready/react";
import type { AgentRuntime } from "@agent-ready/runtime";

export function useAgentRuntimeFromContext(): AgentRuntime {
  const { runtime } = useAgentReadyContext();
  return runtime;
}
