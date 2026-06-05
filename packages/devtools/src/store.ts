import type { AgentCatalog } from "@agent-ready/runtime";
import type { ObservabilityEvent } from "@agent-ready/observability";

export interface DevToolsState {
  catalog: AgentCatalog;
  actionLog: ObservabilityEvent[];
  policyLog: ObservabilityEvent[];
}

export function createDevToolsStore(maxLog = 100) {
  let catalog: AgentCatalog = { surfaces: [], total: 0 };
  const actionLog: ObservabilityEvent[] = [];
  const policyLog: ObservabilityEvent[] = [];

  return {
    setCatalog(next: AgentCatalog) {
      catalog = next;
    },
    pushEvent(event: ObservabilityEvent) {
      if (event.type === "action:invoked") {
        actionLog.push(event);
        if (actionLog.length > maxLog) actionLog.shift();
      }
      if (event.type === "policy:denied") {
        policyLog.push(event);
        if (policyLog.length > maxLog) policyLog.shift();
      }
    },
    getState(): DevToolsState {
      return {
        catalog,
        actionLog: [...actionLog],
        policyLog: [...policyLog]
      };
    }
  };
}
