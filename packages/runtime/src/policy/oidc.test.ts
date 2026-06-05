import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";
import { createOidcRolePolicyProvider } from "./oidc.js";

const handle = "app://demo/page/main" as const;

describe("policy.oidc", () => {
  it("maps JWT claims to roles for policy evaluation", async () => {
    const runtime = createAgentRuntime();
    runtime.setPolicyProvider(
      createOidcRolePolicyProvider({
        mapClaimsToRoles: (claims) => {
          const groups = claims.groups;
          return Array.isArray(groups) ? groups.map(String) : [];
        },
        policy: {
          mode: "defaultDeny",
          rules: [{ roles: ["admin"], actions: ["ping"] }]
        }
      })
    );

    runtime.registerSurface({
      manifest: { handle, title: "Main", capabilities: ["act"] }
    });
    runtime.registerAction(handle, {
      definition: defineAction({
        name: "ping",
        description: "Ping",
        input: z.object({})
      }),
      handler: () => ({ ok: true })
    });

    const allowed = await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: {
        sessionId: "s1",
        metadata: {
          oidcClaims: JSON.stringify({ groups: ["admin"] })
        }
      }
    });
    expect(allowed.ok).toBe(true);

    const denied = await runtime.invokeAction({
      handle,
      action: "ping",
      input: {},
      context: {
        sessionId: "s2",
        metadata: {
          oidcClaims: JSON.stringify({ groups: ["viewer"] })
        }
      }
    });
    expect(denied.ok).toBe(false);
  });
});
