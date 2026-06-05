import { createContext, useContext } from "react";
import type { AgentRuntime } from "@agent-ready/runtime";
import type { AgentSessionContext } from "@agent-ready/schema";

export interface AgentReadyContextValue {
  runtime: AgentRuntime;
  session?: AgentSessionContext;
}

const AgentReadyContext = createContext<AgentReadyContextValue | null>(null);

export function useAgentReadyContext(): AgentReadyContextValue {
  const value = useContext(AgentReadyContext);
  if (!value) {
    throw new Error("useAgentReadyContext must be used within AgentReadyProvider");
  }
  return value;
}

export { AgentReadyContext };
