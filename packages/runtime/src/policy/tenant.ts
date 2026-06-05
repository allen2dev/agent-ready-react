import type { AgentHandle } from "@agent-ready/schema";
import type { PolicyContext, PolicyProvider } from "./types.js";
import { createPolicyEngine } from "./engine.js";

export interface TenantAllowlistConfig {
  /** session.metadata tenant key, default `tenantId` */
  tenantMetadataKey?: string;
  /** tenantId -> allowed handles */
  allowlist: Record<string, AgentHandle[]>;
  policy?: import("./types.js").PolicyConfig;
}

function tenantForSession(
  session: PolicyContext["session"],
  key: string
): string | undefined {
  return session?.metadata?.[key];
}

/** Deny cross-tenant handle access based on session tenant metadata. */
export function createTenantPolicyProvider(
  config: TenantAllowlistConfig
): PolicyProvider {
  const engine = createPolicyEngine(
    config.policy ?? { mode: "defaultAllow" }
  );
  const tenantKey = config.tenantMetadataKey ?? "tenantId";

  return {
    async canInvokeAction(ctx: PolicyContext): Promise<boolean> {
      const tenantId = tenantForSession(ctx.session, tenantKey);
      if (tenantId) {
        const allowedHandles = config.allowlist[tenantId];
        if (allowedHandles && !allowedHandles.includes(ctx.handle)) {
          return false;
        }
      }
      return engine.canInvokeAction(ctx);
    }
  };
}
