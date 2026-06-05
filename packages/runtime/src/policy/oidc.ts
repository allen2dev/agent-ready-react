import type { PolicyConfig, PolicyContext, PolicyProvider } from "./types.js";
import { createPolicyEngine } from "./engine.js";

export interface OidcRolePolicyConfig {
  /** Map decoded JWT claims to Agent Ready roles */
  mapClaimsToRoles: (claims: Record<string, unknown>) => string[];
  policy?: PolicyConfig;
  /** session.metadata key holding JSON claims, default `oidcClaims` */
  claimsMetadataKey?: string;
}

function parseClaims(session: PolicyContext["session"], key: string) {
  const raw = session?.metadata?.[key];
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** Compose default policy evaluation with roles derived from OIDC JWT claims. */
export function createOidcRolePolicyProvider(
  config: OidcRolePolicyConfig
): PolicyProvider {
  const engine = createPolicyEngine(
    config.policy ?? { mode: "defaultDeny", rules: [] }
  );
  const claimsKey = config.claimsMetadataKey ?? "oidcClaims";

  return {
    async canInvokeAction(ctx: PolicyContext): Promise<boolean> {
      const claims = parseClaims(ctx.session, claimsKey);
      const mappedRoles = claims ? config.mapClaimsToRoles(claims) : [];
      const mergedRoles = [
        ...new Set([...(ctx.session?.roles ?? []), ...mappedRoles])
      ];

      return engine.canInvokeAction({
        ...ctx,
        session: ctx.session
          ? { ...ctx.session, roles: mergedRoles }
          : { sessionId: "anonymous", roles: mergedRoles }
      });
    }
  };
}
