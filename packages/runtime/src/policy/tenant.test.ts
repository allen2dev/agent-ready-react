import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineAction } from "@agent-ready/schema";
import { createAgentRuntime } from "../runtime.js";
import { createTenantPolicyProvider } from "./tenant.js";

describe("policy.tenant", () => {
  const handleA = "app://tenant-a/page/main" as const;
  const handleB = "app://tenant-b/page/main" as const;

  it("blocks tenant A from invoking tenant B handle", async () => {
    const runtime = createAgentRuntime();
    runtime.setPolicyProvider(
      createTenantPolicyProvider({
        allowlist: {
          "tenant-a": [handleA],
          "tenant-b": [handleB]
        }
      })
    );

    for (const handle of [handleA, handleB]) {
      runtime.registerSurface({
        manifest: { handle, title: handle, capabilities: ["act"] }
      });
      runtime.registerAction(handle, {
        definition: defineAction({
          name: "ping",
          description: "Ping",
          input: z.object({})
        }),
        handler: () => ({ ok: true })
      });
    }

    const own = await runtime.invokeAction({
      handle: handleA,
      action: "ping",
      input: {},
      context: {
        sessionId: "s1",
        metadata: { tenantId: "tenant-a" }
      }
    });
    expect(own.ok).toBe(true);

    const cross = await runtime.invokeAction({
      handle: handleB,
      action: "ping",
      input: {},
      context: {
        sessionId: "s1",
        metadata: { tenantId: "tenant-a" }
      }
    });
    expect(cross.ok).toBe(false);
    if (!cross.ok) expect(cross.error.code).toBe("AGENT_POLICY_DENIED");
  });
});
