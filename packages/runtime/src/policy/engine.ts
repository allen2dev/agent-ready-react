import type { PolicyConfig, PolicyContext, PolicyProvider } from "./types.js";

export function createPolicyEngine(config: PolicyConfig = { mode: "defaultDeny" }): PolicyProvider {
  const rules = config.rules ?? [];

  return {
    async canInvokeAction(ctx: PolicyContext): Promise<boolean> {
      if (config.mode === "defaultAllow") {
        return true;
      }

      const sessionRoles = ctx.session?.roles ?? [];
      if (sessionRoles.length === 0) {
        return false;
      }

      return rules.some((rule) => {
        const roleMatch =
          !rule.roles?.length ||
          rule.roles.some((role) => sessionRoles.includes(role));
        const actionMatch =
          !rule.actions?.length || rule.actions.includes(ctx.action);
        const handleMatch =
          !rule.handles?.length || rule.handles.includes(ctx.handle);
        return roleMatch && actionMatch && handleMatch;
      });
    }
  };
}
