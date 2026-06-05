import { useMemo, type ReactNode } from "react";
import {
  createAgentRuntime,
  type AgentRuntime,
  type AgentRuntimeConfig
} from "@agent-ready/runtime";
import type { AgentSessionContext } from "@agent-ready/schema";
import type { PolicyProvider } from "@agent-ready/runtime";
import { AgentReadyContext } from "./context.js";

export interface AgentReadyProviderProps {
  runtime?: AgentRuntime;
  config?: AgentRuntimeConfig;
  session?: AgentSessionContext;
  policy?: PolicyProvider;
  children: ReactNode;
}

export function AgentReadyProvider({
  runtime: runtimeProp,
  config,
  session,
  policy,
  children
}: AgentReadyProviderProps) {
  const runtime = useMemo(
    () => runtimeProp ?? createAgentRuntime(config),
    [runtimeProp, config]
  );

  if (policy) {
    runtime.setPolicyProvider(policy);
  }

  const value = useMemo(
    () => ({ runtime, session }),
    [runtime, session]
  );

  return (
    <AgentReadyContext.Provider value={value}>{children}</AgentReadyContext.Provider>
  );
}
