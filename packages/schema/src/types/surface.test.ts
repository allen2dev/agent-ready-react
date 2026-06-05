import { describe, expect, it } from "vitest";
import { agentHandleSchema, surfaceManifestSchema } from "./surface.js";

describe("surface types", () => {
  it("accepts valid handle", () => {
    expect(
      agentHandleSchema.safeParse("crm://deals/detail/deal-1").success
    ).toBe(true);
  });

  it("rejects invalid handle", () => {
    expect(agentHandleSchema.safeParse("invalid").success).toBe(false);
  });

  it("parses surface manifest", () => {
    const result = surfaceManifestSchema.safeParse({
      handle: "crm://deals/detail/deal-1",
      title: "Deal",
      capabilities: ["act"]
    });
    expect(result.success).toBe(true);
  });
});
