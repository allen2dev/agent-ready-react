import type { AgentHandle, AgentSessionContext } from "@agent-ready/schema";

export type PolicyMode = "defaultDeny" | "defaultAllow";

export interface PolicyRule {
  roles?: string[];
  actions?: string[];
  handles?: AgentHandle[];
}

export interface PolicyConfig {
  mode: PolicyMode;
  rules?: PolicyRule[];
}

export interface PolicyContext {
  handle: AgentHandle;
  action: string;
  session?: AgentSessionContext;
}

export interface PolicyProvider {
  canInvokeAction(ctx: PolicyContext): Promise<boolean>;
}
